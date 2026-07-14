import { useEffect, useRef, useState } from "react";
import {
  LazyMotion,
  MotionConfig,
  animate,
  domAnimation,
  m,
  useInView,
  useReducedMotion,
  type Variants,
} from "motion/react";

// Primitivas de motion da landing. LazyMotion + m.* mantém o bundle enxuto
// (domAnimation cobre whileInView/variants/useScroll) e `strict` impede o
// import pesado de `motion.*` por acidente. MotionConfig reducedMotion="user"
// desliga transforms para quem prefere menos movimento.
export function LandingMotion({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + rise ao entrar na viewport (uma vez). */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px 0px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </m.div>
  );
}

const groupVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

export function itemVariants(y = 24): Variants {
  return {
    hidden: { opacity: 0, y },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };
}

/** Contêiner que revela os RevealItem filhos em cascata. */
export function RevealGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-64px 0px" }}
    >
      {children}
    </m.div>
  );
}

export function RevealItem({
  children,
  className,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <m.div className={className} variants={itemVariants(y)}>
      {children}
    </m.div>
  );
}

/**
 * Número que conta de 0 até `to` ao entrar na viewport. Renderiza o valor
 * final no SSR/no-JS e só zera imediatamente antes de animar; com
 * prefers-reduced-motion mostra o valor final direto.
 */
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.4,
  delay = 0,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-64px 0px" });
  const reducedMotion = useReducedMotion();
  const [started, setStarted] = useState(false);

  const format = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  useEffect(() => {
    if (!inView || started) return;
    setStarted(true);
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const controls = animate(0, to, {
      duration,
      delay,
      ease: "circOut",
      onUpdate: (value) => {
        el.textContent = `${prefix}${format(value)}${suffix}`;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, started, reducedMotion]);

  return <span ref={ref}>{`${prefix}${format(to)}${suffix}`}</span>;
}
