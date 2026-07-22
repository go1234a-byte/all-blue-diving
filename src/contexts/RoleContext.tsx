import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  /** 현재 강사 ID (profiles.id 문자열, 강사가 아니면 빈 문자열). */
  currentInstructorId: string;
  /** 현재 다이버 ID (profiles.id 문자열, 다이버가 아니면 빈 문자열). */
  currentDiverId: string;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

/** 실제 role이 없을 때(비로그인) QA 목적의 강제 역할 오버라이드 — 개발 환경에서만 MasterRoleToolbar가 사용. */
const DEV_ROLE_OVERRIDE_KEY = "allblue-dev-role-override";

export function RoleProvider({ children }: { children: ReactNode }) {
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
      setProfile(data as ProfileRow | null);
      setAuthLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

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
  const resolvedRole: MasterRole = profile
    ? profile.role === "diver"
      ? "public"
      : profile.role
    : (import.meta.env.DEV && devRoleOverride) || "public";

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
          ? profile.id
          : import.meta.env.DEV && devRoleOverride === "instructor"
            ? seedInstructorId
            : "",
      currentDiverId: profile && profile.role !== "instructor" ? profile.id : "",
    }),
    [resolvedRole, isLoggedIn, authLoading, session, profile, devRoleOverride, seedInstructorId],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
