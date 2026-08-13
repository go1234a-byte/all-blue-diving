import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type MasterRole = "public" | "instructor" | "admin";

interface ProfileRow {
  id: string;
  role: "diver" | "instructor" | "admin";
  name: string;
  phone: string | null;
  gender: string | null;
  status: string;
  deleted_at: string | null;
}

interface RoleContextValue {
  /** 실제 세션 기반 역할. 다이버는 "public"으로 매핑된다(기존 컴포넌트 하위호환). */
  role: MasterRole;
  /** 실제 세션 없이 QA가 역할을 강제로 바꾸고 싶을 때 사용 (개발 환경 전용 MasterRoleToolbar). */
  setRole: (role: MasterRole) => void;
  /** 실제 Supabase Auth 로그인 여부. */
  isLoggedIn: boolean;
  /** 인증 상태(세션+프로필) 로딩 중 여부. */
  authLoading: boolean;
  /** 현재 로그인한 Supabase Auth 사용자. */
  user: User | null;
  /** 현재 로그인한 사용자의 profiles row. */
  profile: ProfileRow | null;
  login: () => void;
  /** 실제 로그아웃: Supabase 세션 파기. */
  logout: () => Promise<void>;
  /** 현재 강사 ID (instructors.id 문자열, 강사가 아니거나 아직 조회 중이면 빈 문자열). */
  currentInstructorId: string;
  /** 현재 다이버 ID (profiles.id 문자열, 다이버가 아니면 빈 문자열). */
  currentDiverId: string;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

/** 실제 role이 없을 때(비로그인) QA 목적의 강제 역할 오버라이드 — 개발 환경에서만 MasterRoleToolbar가 사용. */
const DEV_ROLE_OVERRIDE_KEY = "allblue-dev-role-override";

export function RoleProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [devRoleOverride, setDevRoleOverride] = useState<MasterRole | null>(() => {
    if (typeof window === "undefined" || !import.meta.env.DEV) return null;
    const stored = window.localStorage.getItem(DEV_ROLE_OVERRIDE_KEY);
    return stored === "instructor" || stored === "admin" || stored === "public" ? stored : null;
  });
  // 마스터 테스트 툴바로 "강사" 역할을 선택했을 때(실 로그인 없음) 바인딩할 시드 강사 profile id.
  const [seedInstructorId, setSeedInstructorId] = useState<string>("");
  // 실 로그인한 강사의 instructors.id(= profiles.id와 다른 별도 PK). getInstructorById/tours.instructorId 등
  // 앱 전역이 instructors.id를 기준으로 조인하므로, profile.id를 그대로 쓰면 안 되고 반드시 이 값으로 변환해야 한다.
  const [resolvedInstructorId, setResolvedInstructorId] = useState<string>("");

  useEffect(() => {
    let active = true;

    // 세션 리스너를 먼저 등록한 뒤 현재 세션을 조회한다 (Supabase 권장 순서).
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setAuthLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (!data.session) setAuthLoading(false);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    let active = true;
    setAuthLoading(true);
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      const row = data as ProfileRow | null;
      // 관리자가 정지(suspended) 처리한 계정은 로그인 상태를 유지시키지 않는다 —
      // 세션을 즉시 종료해 다른 곳에서와 마찬가지로(RequireRole 등) 접근이 실제로 막히게 한다.
      if (row?.status === "suspended") {
        await supabase.auth.signOut();
        if (active) {
          setSession(null);
          setProfile(null);
          setAuthLoading(false);
          toast({
            title: "이용이 제한된 계정입니다",
            description: "관리자에 의해 이용이 정지된 계정이에요. 문의사항은 고객센터로 연락해주세요.",
            variant: "destructive",
          });
        }
        return;
      }
      setProfile(row);
      // 강사 계정이면 profiles.id(auth UID)와는 별도 PK인 instructors.id 조회까지 끝난 뒤에
      // authLoading을 내린다. 이 조회가 끝나기 전에 authLoading만 먼저 false가 되면(기존 버그),
      // RequireRole 통과 직후에도 currentInstructorId가 잠깐 빈 문자열이라 TourEditPage 등의
      // "본인 소유 투어인지" 확인 로직이 진짜 담당 강사를 남으로 오인해 강제로 콘솔로
      // 튕겨내는 문제가 있었다(특히 수정 페이지를 새로고침하거나 직접 URL로 들어올 때 재현됨).
      if (row?.role === "instructor") {
        const { data: instructorRow } = await supabase
          .from("instructors")
          .select("id")
          .eq("profile_id", row.id)
          .maybeSingle();
        if (!active) return;
        setResolvedInstructorId((instructorRow as { id?: string } | null)?.id ?? "");
      }
      setAuthLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session?.user?.id, toast]);

  // 이미 로그인된 상태에서 관리자가 정지 처리를 하면, 세션을 유지한 채(재로그인 전까지) 계속
  // 이용 가능했던 문제가 있었다 (프로필 상태는 session.user.id가 바뀔 때만 재확인했음).
  // 활동 중에도 주기적으로 본인 상태를 다시 확인해서, 정지되면 곧바로 강제 로그아웃한다.
  useEffect(() => {
    if (!session?.user) return;
    const intervalId = window.setInterval(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", session.user.id)
        .maybeSingle();
      if ((data as { status?: string } | null)?.status === "suspended") {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        toast({
          title: "이용이 제한된 계정입니다",
          description: "관리자에 의해 이용이 정지된 계정이에요. 문의사항은 고객센터로 연락해주세요.",
          variant: "destructive",
        });
      }
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, [session?.user, toast]);

  // QA 데모용 강사 바인딩: MasterRoleToolbar에서 "강사"를 고르면 실제 프로필이 없으므로
  // 시드된 강사 중 첫 번째를 데모 강사로 바인딩해 대시보드/투어/정산이 비지 않도록 한다.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let active = true;
    supabase
      .from("instructors")
      .select("id")
      .order("id")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        // getInstructorById/tours.instructorId 등 앱 전역이 instructors.id(예: "inst-1")를
        // 기준으로 조인하므로, profile_id가 아니라 id를 데모 강사 식별자로 바인딩한다.
        const seedId = (data as { id?: string } | null)?.id;
        if (seedId) setSeedInstructorId(seedId);
      });
    return () => {
      active = false;
    };
  }, []);

  // 실 로그인한 강사의 profile.id(auth UID) → instructors.id를 조회해 바인딩한다.
  // instructors.id는 회원가입 시 별도로 생성되는 PK(profile_id 컬럼으로만 profiles와 연결)이므로,
  // profile.id를 그대로 강사 식별자로 쓰면 getInstructorById/투어 생성 등 전 영역에서 조회가 실패한다.
  useEffect(() => {
    if (profile?.role !== "instructor") {
      setResolvedInstructorId("");
      return;
    }
    let active = true;
    supabase
      .from("instructors")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setResolvedInstructorId((data as { id?: string } | null)?.id ?? "");
      });
    return () => {
      active = false;
    };
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (devRoleOverride) {
      window.localStorage.setItem(DEV_ROLE_OVERRIDE_KEY, devRoleOverride);
    } else {
      window.localStorage.removeItem(DEV_ROLE_OVERRIDE_KEY);
    }
  }, [devRoleOverride]);

  const isLoggedIn = !!session?.user;

  // profiles.role("diver"|"instructor"|"admin")을 기존 MasterRole("public"|"instructor"|"admin")로 매핑.
  // devRoleOverride는 "실 로그인 없이" QA가 미리보기할 때만 유효하다 — 로그인은 됐지만 아직
  // profiles row가 없는 사용자(예: 카카오 로그인 직후 /complete-profile)까지 profile이 null이라는
  // 이유만으로 예전에 QA 툴바로 눌러둔 역할을 그대로 물려받던 버그가 있었다(뒤로가기 시 관리자로
  // 보이는 문제의 원인). isLoggedIn이면 override를 절대 참조하지 않도록 명시적으로 막는다.
  const resolvedRole: MasterRole = profile
    ? profile.role === "diver"
      ? "public"
      : profile.role
    : (import.meta.env.DEV && !isLoggedIn && devRoleOverride) || "public";

  const setRole = (next: MasterRole) => {
    // 실 세션이 있으면 role은 DB profiles.role이 유일한 소스이므로 무시한다.
    // 개발 환경에서 비로그인 QA 데모용으로만 오버라이드를 허용한다.
    if (import.meta.env.DEV && !isLoggedIn) {
      setDevRoleOverride(next);
    }
  };

  const login = () => {
    // 실제 로그인은 signInWithPassword/signUp 완료 시 onAuthStateChange가 처리한다.
    // 이 함수는 레거시 호출부 호환을 위해 남겨둔 no-op.
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setDevRoleOverride(null);
  };

  const value = useMemo<RoleContextValue>(
    () => ({
      role: resolvedRole,
      setRole,
      isLoggedIn,
      authLoading,
      user: session?.user ?? null,
      profile,
      login,
      logout,
      currentInstructorId:
        profile?.role === "instructor"
          ? resolvedInstructorId
          : import.meta.env.DEV && !isLoggedIn && devRoleOverride === "instructor"
            ? seedInstructorId
            : "",
      currentDiverId: profile && profile.role !== "instructor" ? profile.id : "",
    }),
    [
      resolvedRole,
      isLoggedIn,
      authLoading,
      session,
      profile,
      devRoleOverride,
      seedInstructorId,
      resolvedInstructorId,
    ],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
