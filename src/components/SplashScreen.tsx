import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark } from "@/components/brand/Logo";

interface SplashScreenProps {
  onFinish?: () => void;
}

const TOTAL_DURATION_MS = 3000;

/** 앱 실행 시 3초간 보여주는 스플래시 — ALL BLUE 로고. 브랜드 비주얼(잠수사) 이미지는 홈 화면 팝업(DiverPopup)에서 별도로 보여준다. */
export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowLogo(true), 200),
      setTimeout(() => setVisible(false), TOTAL_DURATION_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          // "dark" 클래스를 직접 붙여, 사용자의 라이트/다크 모드 설정과 무관하게 스플래시는
          // 항상 짙은 오션 그라데이션으로 보이게 한다(흰 텍스트/배지가 라이트 배경에 묻히는 것 방지).
          className="dark fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-gradient-ocean"
        >
          <div className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary-glow)/0.35),_transparent_65%)]" />
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 12 }}
            animate={showLogo ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.7, opacity: 0, y: 12 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center gap-3"
          >
            <LogoMark size={108} />
            <span className="text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl">
              ALL BLUE
            </span>
            <span className="text-sm text-primary-foreground/80 sm:text-base">모든 바다가 만나는 곳</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
