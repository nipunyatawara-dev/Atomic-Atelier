"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Template({ children }: { children: React.ReactNode }) {
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const veil = veilRef.current;
    if (!veil) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      veil.style.display = "none";
      return;
    }

    const tween = gsap.fromTo(
      veil,
      { opacity: 1 },
      {
        opacity: 0,
        duration: 0.38,
        ease: "power2.inOut",
        onComplete: () => {
          if (veil) veil.style.display = "none";
        },
      }
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <>
      <div ref={veilRef} className="page-transition-veil" aria-hidden="true" />
      {children}
    </>
  );
}
