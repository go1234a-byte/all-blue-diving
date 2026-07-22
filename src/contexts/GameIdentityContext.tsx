import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const UID_KEY = "infinite-dive-uid";
const NICKNAME_KEY = "infinite-dive-nickname";

function generateUid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `diver-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function generateDefaultNickname(): string {
  return `다이버-${Math.floor(1000 + Math.random() * 9000)}`;
}

interface GameIdentityContextValue {
  uid: string;
  nickname: string;
  setNickname: (nickname: string) => void;
}

const GameIdentityContext = createContext<GameIdentityContextValue | undefined>(undefined);

export function GameIdentityProvider({ children }: { children: ReactNode }) {
  const [uid] = useState<string>(() => {
    if (typeof window === "undefined") return generateUid();
    const stored = window.localStorage.getItem(UID_KEY);
    if (stored) return stored;
    const created = generateUid();
    window.localStorage.setItem(UID_KEY, created);
    return created;
  });

  const [nickname, setNicknameState] = useState<string>(() => {
    if (typeof window === "undefined") return generateDefaultNickname();
    const stored = window.localStorage.getItem(NICKNAME_KEY);
    if (stored) return stored;
    const created = generateDefaultNickname();
    window.localStorage.setItem(NICKNAME_KEY, created);
    return created;
  });

  useEffect(() => {
    window.localStorage.setItem(NICKNAME_KEY, nickname);
  }, [nickname]);

  const setNickname = (next: string) => setNicknameState(next.trim() || generateDefaultNickname());

  const value = useMemo(() => ({ uid, nickname, setNickname }), [uid, nickname]);

  return <GameIdentityContext.Provider value={value}>{children}</GameIdentityContext.Provider>;
}

export function useGameIdentity(): GameIdentityContextValue {
  const ctx = useContext(GameIdentityContext);
  if (!ctx) throw new Error("useGameIdentity must be used within GameIdentityProvider");
  return ctx;
}
