"use client";

import { useEffect } from "react";

const DEFAULT_X = "16vw";
const DEFAULT_Y = "10vh";

export default function CursorBackground() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }

    const root = document.documentElement;
    let frame = 0;
    let pointerX = window.innerWidth * 0.16;
    let pointerY = window.innerHeight * 0.1;

    const commitPosition = () => {
      root.style.setProperty("--cursor-x", `${pointerX}px`);
      root.style.setProperty("--cursor-y", `${pointerY}px`);
      frame = 0;
    };

    const scheduleCommit = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(commitPosition);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      scheduleCommit();
    };

    const resetGlow = () => {
      root.style.setProperty("--cursor-x", DEFAULT_X);
      root.style.setProperty("--cursor-y", DEFAULT_Y);
    };

    resetGlow();

    document.documentElement.addEventListener("pointerleave", resetGlow);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetGlow);

    return () => {
      document.documentElement.removeEventListener("pointerleave", resetGlow);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetGlow);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      resetGlow();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(230,239,146,0.22)_0%,rgba(230,239,146,0.14)_18%,rgba(215,227,124,0.08)_36%,transparent_72%)] blur-[110px] transition-[left,top] duration-150 ease-out"
        style={{ left: "var(--cursor-x)", top: "var(--cursor-y)" }}
      />
      <div
        className="absolute h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,245,247,0.14)_0%,rgba(244,245,247,0.04)_34%,transparent_70%)] blur-[95px] transition-[left,top] duration-200 ease-out"
        style={{ left: "calc(var(--cursor-x) + 48px)", top: "calc(var(--cursor-y) - 36px)" }}
      />
    </div>
  );
}
