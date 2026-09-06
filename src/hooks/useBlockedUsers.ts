import { useCallback, useEffect, useState } from "react";
import {
  blockUser as blockUserStore,
  getBlockedUserIds,
  getBlockedUsers,
  unblockUser as unblockUserStore,
  type BlockedUser,
} from "@/lib/userBlocks";

/** 차단 목록을 구독하는 훅. 차단/해제 시 화면이 즉시 갱신되도록 커스텀 이벤트를 듣는다. */
export function useBlockedUsers() {
  const [ids, setIds] = useState<Set<string>>(() => getBlockedUserIds());
  const [list, setList] = useState<BlockedUser[]>(() => getBlockedUsers());

  useEffect(() => {
    const sync = () => {
      setIds(getBlockedUserIds());
      setList(getBlockedUsers());
    };
    window.addEventListener("allblue-blocks-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("allblue-blocks-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const block = useCallback((id: string, name: string) => blockUserStore(id, name), []);
  const unblock = useCallback((id: string) => unblockUserStore(id), []);
  const isBlocked = useCallback((id: string) => ids.has(id), [ids]);

  return { blockedIds: ids, blockedUsers: list, block, unblock, isBlocked };
}
