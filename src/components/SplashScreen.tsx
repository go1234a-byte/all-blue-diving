import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onFinish?: () => void;
}

const TOTAL_DURATION_MS = 3000;

/** 앱 실행 시 3초간 보여주는 스플래시 — 브랜드 비주얼(잠수사 + "길잃은 다이버들이여 여기로 오라.") 이미지를 그대로 전체 화면에 띄운 뒤 홈으로 Fade. */
export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), TOTAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] overflow-hidden bg-black"
        >
          <img
            src="/splash-diver.jpg"
            alt="ALL BLUE"
            className="h-full w-full object-cover"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
