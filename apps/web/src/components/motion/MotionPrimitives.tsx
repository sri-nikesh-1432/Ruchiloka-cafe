'use client';

import React, { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type HTMLMotionProps,
  type Variants,
} from 'framer-motion';

export const EDITORIAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const MOTION_TIMINGS = {
  micro: 0.2,
  interactive: 0.26,
  reveal: 0.65,
  hero: 1.05,
} as const;

export const MOTION_VARIANTS: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION_TIMINGS.reveal, ease: EDITORIAL_EASE },
    },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: EDITORIAL_EASE },
    },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: MOTION_TIMINGS.reveal, ease: EDITORIAL_EASE },
    },
  },
  staggerChildren: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.09,
        delayChildren: 0.04,
      },
    },
  },
  imageReveal: {
    hidden: {
      opacity: 0,
      clipPath: 'inset(10% 0% 10% 0% round 18px)',
      scale: 1.06,
    },
    visible: {
      opacity: 1,
      clipPath: 'inset(0% 0% 0% 0% round 18px)',
      scale: 1,
      transition: { duration: 0.85, ease: EDITORIAL_EASE },
    },
  },
  scaleReveal: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: EDITORIAL_EASE },
    },
  },
  slideFromLeft: {
    hidden: { opacity: 0, x: -24 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: MOTION_TIMINGS.reveal, ease: EDITORIAL_EASE },
    },
  },
  slideFromRight: {
    hidden: { opacity: 0, x: 24 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: MOTION_TIMINGS.reveal, ease: EDITORIAL_EASE },
    },
  },
  textReveal: {
    hidden: { opacity: 0, y: '105%' },
    visible: {
      opacity: 1,
      y: '0%',
      transition: { duration: 0.72, ease: EDITORIAL_EASE },
    },
  },
  subtleParallax: {
    hidden: { opacity: 0, y: 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION_TIMINGS.hero, ease: EDITORIAL_EASE },
    },
  },
};

export function ScrollProgressBar({ className = '' }: { className?: string }) {
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  if (prefersReduced) {
    return null;
  }

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className={`h-[2px] w-full origin-left bg-cognac/85 will-change-transform ${className}`}
    />
  );
}

export function PageTransitionWrapper({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface EditorialRevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  delay?: number;
  yOffset?: number;
}

export function EditorialReveal({
  children,
  delay = 0,
  yOffset = 22,
  className = '',
  ...rest
}: EditorialRevealProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.65, delay, ease: EDITORIAL_EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function SlideReveal({
  children,
  direction = 'left',
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  delay?: number;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const xStart = direction === 'left' ? -24 : 24;

  return (
    <motion.div
      initial={{ opacity: 0, x: xStart }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: MOTION_TIMINGS.reveal, delay, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function TextReveal({
  children,
  delay = 0,
  immediate = false,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  immediate?: boolean;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <span className={`inline-block ${className}`}>{children}</span>;
  }

  return (
    <span className={`inline-block overflow-hidden align-bottom ${className}`}>
      <motion.span
        className="inline-block will-change-transform"
        initial={{ opacity: 0, y: '105%' }}
        {...(immediate
          ? { animate: { opacity: 1, y: '0%' } }
          : {
              whileInView: { opacity: 1, y: '0%' },
              viewport: { once: true, amount: 0.25 },
            })}
        transition={{ duration: 0.72, delay, ease: EDITORIAL_EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function ImageMaskReveal({
  children,
  delay = 0,
  immediate = false,
  roundedClass = 'rounded-[18px]',
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  immediate?: boolean;
  roundedClass?: string;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={`${roundedClass} overflow-hidden ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      initial={{
        opacity: 0.2,
        clipPath: 'inset(10% 0% 10% 0% round 18px)',
        scale: 1.07,
      }}
      {...(immediate
        ? {
            animate: {
              opacity: 1,
              clipPath: 'inset(0% 0% 0% 0% round 18px)',
              scale: 1,
            },
          }
        : {
            whileInView: {
              opacity: 1,
              clipPath: 'inset(0% 0% 0% 0% round 18px)',
              scale: 1,
            },
            viewport: { once: true, amount: 0.16 },
          })}
      transition={{ duration: 0.9, delay, ease: EDITORIAL_EASE }}
      className={`${roundedClass} overflow-hidden will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function BorderDrawReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0.25, clipPath: 'inset(0% 100% 0% 0%)' }}
      whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.95, delay, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: EDITORIAL_EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ParallaxFrame({
  children,
  className = '',
  offset = 36,
}: {
  children: React.ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="h-full w-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

export function SubtleFloat({
  children,
  className = '',
  amplitude = 6,
  duration = 5.5,
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      animate={{ y: [-amplitude, amplitude, -amplitude] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
