"use client";

import { useEffect, useState, type RefObject } from "react";

type OrbitState = { controls: { enabled: boolean }; renderer: { domElement: HTMLCanvasElement } };

/** Desktop stays interactive; touch viewports opt into rotation explicitly. */
export function useTouchOrbit(stateRef: RefObject<OrbitState | null>) {
  const [touchActive, setTouchActive] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    let disposed = false;
    const sync = () => {
      const state = stateRef.current;
      if (disposed || !state) return;
      const interactive = !media.matches || touchActive;
      state.controls.enabled = interactive;
      state.renderer.domElement.style.touchAction = interactive ? "none" : "pan-y";
      state.renderer.domElement.style.pointerEvents = interactive ? "auto" : "none";
    };
    // Scene initialization runs in the same commit, after this hook's effect.
    queueMicrotask(sync);
    media.addEventListener("change", sync);
    return () => { disposed = true; media.removeEventListener("change", sync); };
  }, [stateRef, touchActive]);
  return [touchActive, setTouchActive] as const;
}
