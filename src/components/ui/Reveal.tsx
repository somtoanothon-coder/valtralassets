"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import clsx from "clsx";

/**
 * Lightweight scroll-reveal wrapper. Uses IntersectionObserver so it costs
 * nothing when the section is already visible, and respects the user's
 * reduced-motion preference (animation durations collapse to ~0 in CSS).
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
  y = 18,
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={clsx("transition-all duration-700 ease-out will-change-transform", className)}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
