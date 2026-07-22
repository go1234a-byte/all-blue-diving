import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGameIdentity } from "@/contexts/GameIdentityContext";

const SEEN_KEY = "infinite-dive-nickname-seen";

export function NicknameDialog() {
  const { nickname, setNickname } = useGameIdentity();
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.localStorage.getItem(SEEN_KEY);
  });
  const [value, setValue] = useState(nickname);

  const handleConfirm = () => {
    setNickname(value);
    window.localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="game-theme sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>다이버 닉네임 설정</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          실시간 랭킹에 표시될 닉네임을 입력해주세요.
        </p>
        <Input
          value={value}
          maxLength={12}
          onChange={(e) => setValue(e.target.value)}
          placeholder="닉네임을 입력하세요"
        />
        <Button onClick={handleConfirm} disabled={!value.trim()} className="w-full">
          시작하기
        </Button>
      </DialogContent>
    </Dialog>
  );
}
