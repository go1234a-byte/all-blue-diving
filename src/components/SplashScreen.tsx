import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";

interface SplashScreenProps {
  onFinish?: () => void;
}

const TOTAL_DURATION_MS = 3000;

interface WaveLayerProps {
  path: string;
  className: string;
  duration: number;
  delay?: number;
  translateY?: number;
}

/** 여러 겹의 파도가 서로 다른 속도로 계속 흘러가는 레이어. */
function WaveLayer({ path, className, duration, delay = 0, translateY = 0 }: WaveLayerProps) {
  return (
    <motion.svg
      className={`absolute bottom-0 left-0 w-[220%] ${className}`}
      style={{ translateY }}
      viewBox="0 0 1440 320"
      fill="currentColor"
      animate={{ x: ["0%", "-50%"] }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      <path d={path} />
    </motion.svg>
  );
}

const WAVE_PATH_A =
  "M0,192L48,197.3C96,203,192,213,288,213.3C384,213,480,203,576,181.3C672,160,768,128,864,133.3C960,139,1056,181,1152,192C1248,203,1344,181,1392,170.7L1440,160L1440,320L0,320Z";
const WAVE_PATH_B =
  "M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L0,320Z";
const WAVE_PATH_C =
  "M0,256L60,240C120,224,240,192,360,181.3C480,171,600,181,720,197.3C840,213,960,235,1080,229.3C1200,224,1320,192,1380,176L1440,160L1440,320L0,320Z";

/**
 * 파도/바다 테마 모션 스플래시 — 배경 가득 여러 겹의 파도가 끊임없이 흐르고,
 * 그 위로 ALL BLUE 로고(앱 아이콘과 동일 심벌)가 떠오르듯 등장한 뒤 홈으로 Fade.
 */
export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowLogo(true), 200),
      setTimeout(() => setShowTagline(true), 900),
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
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-gradient-ocean"
        >
          {/* 위쪽에서 은은하게 번지는 빛 */}
          <div className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary-glow)/0.35),_transparent_65%)]" />

          {/* 계속 흘러가는 파도 레이어들 (뒤에서 앞으로, 느리게 → 빠르게) */}
          <WaveLayer path={WAVE_PATH_C} className="text-primary-glow/10" duration={14} translateY={40} />
          <WaveLayer path={WAVE_PATH_B} className="text-accent/20" duration={9} delay={0.2} translateY={20} />
          <WaveLayer path={WAVE_PATH_A} className="text-primary-glow/30" duration={6} delay={0.4} />

          <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 12 }}
              animate={
                showLogo ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.7, opacity: 0, y: 12 }
              }
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <Logo size="lg" tone="inverted" />
            </motion.div>

            <motion.p
              className="text-sm text-primary-foreground/80 sm:text-base"
              initial={{ opacity: 0, y: 8 }}
              animate={showTagline ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              모든 바다가 만나는 곳
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
