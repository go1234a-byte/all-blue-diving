import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRole } from "@/contexts/RoleContext";
import {
  db,
  isMissingRelation,
  pointCountry,
  type DiverAlert,
  type DiveWish,
  type WishDemandRow,
} from "@/lib/diveWish";
import type { DivePoint } from "@/content/divePointGuide";

/**
 * 다이버의 "가고 싶어요"·빈자리 알림·알림함 상태를 앱 전체에서 공유한다.
 * 홈(포인트 상세), 투어 상세(빈자리 알림), 마이페이지(관리), 알림 벨이 같은 데이터를 본다.
 */
interface DiverWishValue {
  /** DB 마이그레이션이 적용돼 기능을 쓸 수 있는지. false면 관련 UI를 숨긴다. */
  available: boolean;
  wishes: DiveWish[];
  getWish: (pointId: string) => DiveWish | undefined;
  saveWish: (point: Pick<DivePoint, "id" | "region">, months: number[]) => Promise<void>;
  removeWish: (pointId: string) => Promise<void>;
  /** pointId → 관심 인원(월 무관 합계, 사람 기준 중복 제거는 서버 집계 기준) */
  demandByPoint: Map<string, number>;
  demand: WishDemandRow[];
  seatAlertTourIds: Set<string>;
  toggleSeatAlert: (tourId: string) => Promise<boolean>;
  alerts: DiverAlert[];
  unreadCount: number;
  markAlertRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const Ctx = createContext<DiverWishValue | null>(null);

export function DiverWishProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, profile } = useRole();
  const profileId = isLoggedIn ? profile?.id ?? null : null;
  const [available, setAvailable] = useState(true);
  const [wishes, setWishes] = useState<DiveWish[]>([]);
  const [demand, setDemand] = useState<WishDemandRow[]>([]);
  const [seatAlertTourIds, setSeatAlertTourIds] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<DiverAlert[]>([]);

  // 관심 집계는 비로그인도 본다(포인트 상세의 "N명이 관심").
  const loadDemand = useCallback(async () => {
    const { data, error } = await db.rpc("get_dive_wish_demand");
    if (error) {
      if (isMissingRelation(error)) setAvailable(false);
      return;
    }
    setDemand(
      (data as { point_id: string; country: string; month: number; wish_count: number }[]).map((r) => ({
        pointId: r.point_id,
        country: r.country,
        month: Number(r.month),
        count: Number(r.wish_count),
      })),
    );
  }, []);

  useEffect(() => {
    void loadDemand();
  }, [loadDemand]);

  useEffect(() => {
    if (!profileId) {
      setWishes([]);
      setSeatAlertTourIds(new Set());
      setAlerts([]);
      return;
    }
    let active = true;
    (async () => {
      const [w, s, a] = await Promise.all([
        db.from("dive_wishes").select("id, point_id, region, country, months").eq("profile_id", profileId),
        db.from("tour_seat_alerts").select("tour_id").eq("profile_id", profileId).is("notified_at", null),
        db
          .from("diver_alerts")
          .select("id, type, tour_id, title, body, read, created_at")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (!active) return;
      if (isMissingRelation(w.error) || isMissingRelation(a.error)) {
        setAvailable(false);
        return;
      }
      if (w.data)
        setWishes(
          (w.data as { id: string; point_id: string; region: string; country: string; months: number[] }[]).map((r) => ({
            id: r.id,
            pointId: r.point_id,
            region: r.region,
            country: r.country,
            months: r.months ?? [],
          })),
        );
      if (s.data) setSeatAlertTourIds(new Set((s.data as { tour_id: string }[]).map((r) => r.tour_id)));
      if (a.data) setAlerts((a.data as Record<string, unknown>[]).map(mapAlert));
    })();

    // 새 알림 실시간 수신 — 트리거가 INSERT 하는 즉시 벨/배너에 반영
    const channel = db
      .channel(`diver_alerts_${profileId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "diver_alerts", filter: `profile_id=eq.${profileId}` },
        (payload) => {
          const next = mapAlert(payload.new as Record<string, unknown>);
          setAlerts((prev) => (prev.some((x) => x.id === next.id) ? prev : [next, ...prev]));
          if (next.type === "seat_open" && next.tourId) {
            setSeatAlertTourIds((prev) => {
              const copy = new Set(prev);
              copy.delete(next.tourId as string);
              return copy;
            });
          }
        },
      )
      .subscribe();
    return () => {
      active = false;
      void db.removeChannel(channel);
    };
  }, [profileId]);

  const saveWish = useCallback(
    async (point: Pick<DivePoint, "id" | "region">, months: number[]) => {
      if (!profileId) throw new Error("login required");
      const row = {
        profile_id: profileId,
        point_id: point.id,
        region: point.region,
        country: pointCountry(point),
        months: [...new Set(months)].sort((a, b) => a - b),
      };
      const { data, error } = await db
        .from("dive_wishes")
        .upsert(row, { onConflict: "profile_id,point_id" })
        .select("id")
        .single();
      if (error) throw error;
      setWishes((prev) => [
        ...prev.filter((w) => w.pointId !== point.id),
        { id: (data as { id: string }).id, pointId: point.id, region: row.region, country: row.country, months: row.months },
      ]);
      void loadDemand();
    },
    [profileId, loadDemand],
  );

  const removeWish = useCallback(
    async (pointId: string) => {
      if (!profileId) return;
      const { error } = await db.from("dive_wishes").delete().eq("profile_id", profileId).eq("point_id", pointId);
      if (error) throw error;
      setWishes((prev) => prev.filter((w) => w.pointId !== pointId));
      void loadDemand();
    },
    [profileId, loadDemand],
  );

  const toggleSeatAlert = useCallback(
    async (tourId: string) => {
      if (!profileId) throw new Error("login required");
      if (seatAlertTourIds.has(tourId)) {
        const { error } = await db.from("tour_seat_alerts").delete().eq("profile_id", profileId).eq("tour_id", tourId);
        if (error) throw error;
        setSeatAlertTourIds((prev) => {
          const copy = new Set(prev);
          copy.delete(tourId);
          return copy;
        });
        return false;
      }
      // 예전에 한 번 알림을 받아 notified_at 이 찍힌 행이 있으면 다시 대기 상태로 되돌린다.
      const { error } = await db
        .from("tour_seat_alerts")
        .upsert({ profile_id: profileId, tour_id: tourId, notified_at: null }, { onConflict: "profile_id,tour_id" });
      if (error) throw error;
      setSeatAlertTourIds((prev) => new Set(prev).add(tourId));
      return true;
    },
    [profileId, seatAlertTourIds],
  );

  const markAlertRead = useCallback(async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    await db.from("diver_alerts").update({ read: true }).eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!profileId) return;
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    await db.from("diver_alerts").update({ read: true }).eq("profile_id", profileId).eq("read", false);
  }, [profileId]);

  const value = useMemo<DiverWishValue>(() => {
    const demandByPoint = new Map<string, number>();
    // 한 사람이 여러 달을 골랐으면 월별 행이 여러 개라, 포인트별로는 "가장 많이 몰린 달" 대신
    // 월 무관 합계를 쓰면 중복이 생긴다. 포인트별 최대값(사람 수 하한)을 쓴다.
    for (const r of demand) demandByPoint.set(r.pointId, Math.max(demandByPoint.get(r.pointId) ?? 0, r.count));
    return {
      available,
      wishes,
      getWish: (pointId) => wishes.find((w) => w.pointId === pointId),
      saveWish,
      removeWish,
      demand,
      demandByPoint,
      seatAlertTourIds,
      toggleSeatAlert,
      alerts,
      unreadCount: alerts.filter((a) => !a.read).length,
      markAlertRead,
      markAllRead,
    };
  }, [available, wishes, saveWish, removeWish, demand, seatAlertTourIds, toggleSeatAlert, alerts, markAlertRead, markAllRead]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function mapAlert(r: Record<string, unknown>): DiverAlert {
  return {
    id: String(r.id),
    type: r.type as DiverAlert["type"],
    tourId: (r.tour_id as string | null) ?? null,
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    read: Boolean(r.read),
    createdAt: String(r.created_at ?? ""),
  };
}

export function useDiverWish(): DiverWishValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDiverWish must be used inside DiverWishProvider");
  return v;
}
