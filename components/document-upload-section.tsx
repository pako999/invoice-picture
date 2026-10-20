"use client";

import { useEffect, useRef, type ReactNode } from "react";

const UPLOAD_EVENT = "document-upload:reveal";

export function revealDocumentUpload() {
  window.dispatchEvent(new Event(UPLOAD_EVENT));
}

/** Keep the upload controls visible while the usage/recipient banners load. */
export function DocumentUploadSection({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    let frame = 0;
    let observer: ResizeObserver | undefined;
    let previousTop = -1;
    const interactionEvents = ["pointerdown", "touchstart", "wheel", "keydown"] as const;

    function stop() {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      interactionEvents.forEach((event) => window.removeEventListener(event, stop));
    }

    function align() {
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY;
      if (Math.abs(top - previousTop) < 1) return;
      previousTop = top;
      target.scrollIntoView({ block: "start", behavior: "instant" });
    }

    function reveal() {
      stop();
      previousTop = -1;
      // Wait for the mobile menu to close and Next's route scroll to finish.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(align);
      });
      observer = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(align);
      });
      // Ancestors resize when async panels above the upload area appear.
      for (let element: HTMLElement | null = target; element; element = element.parentElement) {
        observer.observe(element);
      }
      // Once the user interacts, never pull them away from their chosen position.
      interactionEvents.forEach((event) => window.addEventListener(event, stop, { passive: true }));
    }

    window.addEventListener(UPLOAD_EVENT, reveal);
    if (window.matchMedia("(max-width: 767px)").matches || window.location.hash === "#document-upload") {
      reveal();
    }
    return () => {
      stop();
      window.removeEventListener(UPLOAD_EVENT, reveal);
    };
  }, []);

  return <div id="document-upload" ref={ref} className="scroll-mt-20">{children}</div>;
}
