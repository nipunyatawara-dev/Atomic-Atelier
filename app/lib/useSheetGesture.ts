"use client";

import { useEffect, useRef } from "react";

type SheetGestureOptions = {
  isOpen: boolean;
  onClose: () => void;
  threshold?: number;
};

export function useSheetGesture<T extends HTMLElement = HTMLElement>({
  isOpen,
  onClose,
  threshold = 90,
}: SheetGestureOptions) {
  const sheetRef = useRef<T | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const currentDeltaY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !isOpen) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      // Only initiate drag if touching the handle/header or at the top of scroll
      const target = e.target as HTMLElement | null;
      const isHeaderOrHandle = Boolean(
        target?.closest(".panel-heading, .molecule-library-header, .panel-header") ||
        (target === sheet && touch.clientY - sheet.getBoundingClientRect().top < 60)
      );
      const isScrolledToTop = sheet.scrollTop <= 0;

      if (isHeaderOrHandle || isScrolledToTop) {
        touchStartY.current = touch.clientY;
        touchStartTime.current = Date.now();
        currentDeltaY.current = 0;
        isDragging.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || touchStartY.current === null) return;
      const touch = e.touches[0];
      if (!touch) return;

      const rawDelta = touch.clientY - touchStartY.current;

      // If pulling upward at top, apply heavy rubber-band resistance
      if (rawDelta < 0) {
        currentDeltaY.current = rawDelta * 0.2;
      } else {
        currentDeltaY.current = rawDelta;
      }

      if (currentDeltaY.current > 0) {
        // Prevent default native scroll bounce while dragging downward
        if (
          e.cancelable &&
          (sheet.scrollTop <= 0 || (e.target as HTMLElement)?.closest(".panel-heading, .molecule-library-header"))
        ) {
          e.preventDefault();
        }
        sheet.style.transform = `translateY(${currentDeltaY.current}px)`;
        sheet.style.transition = "none";
      }
    };

    const onTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const delta = currentDeltaY.current;
      const elapsed = Date.now() - touchStartTime.current;
      const velocity = delta / Math.max(1, elapsed); // px per ms

      touchStartY.current = null;
      currentDeltaY.current = 0;

      // Dismiss if dragged beyond threshold or fast downward flick
      if (delta > threshold || (delta > 40 && velocity > 0.5)) {
        sheet.style.transition = "transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)";
        sheet.style.transform = "translateY(104%)";
        setTimeout(() => {
          onClose();
          sheet.style.transform = "";
          sheet.style.transition = "";
        }, 220);
      } else {
        // Snap back
        sheet.style.transition = "transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)";
        sheet.style.transform = "translateY(0)";
        setTimeout(() => {
          sheet.style.transform = "";
          sheet.style.transition = "";
        }, 220);
      }
    };

    const onTouchCancel = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      touchStartY.current = null;
      currentDeltaY.current = 0;
      sheet.style.transform = "";
      sheet.style.transition = "";
    };

    sheet.addEventListener("touchstart", onTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", onTouchEnd, { passive: true });
    sheet.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      sheet.removeEventListener("touchstart", onTouchStart);
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [isOpen, onClose, threshold]);

  return sheetRef;
}
