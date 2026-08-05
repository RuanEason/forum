"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type CreatePostSheetProps = {
  children: ReactNode;
  onRequestClose: () => void | Promise<void>;
  closeRequest?: number;
};

const focusableSelector = [
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(",");
const SHEET_TRANSITION_MS = 300;

export default function CreatePostSheet({ children, onRequestClose, closeRequest = 0 }: CreatePostSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeHandlerRef = useRef(onRequestClose);
  const closeRequestedRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCloseRequestRef = useRef(closeRequest);
  const [visible, setVisible] = useState(false);

  const requestClose = useCallback(() => {
    if (closeRequestedRef.current) {
      return;
    }

    closeRequestedRef.current = true;
    setVisible(false);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      void closeHandlerRef.current();
    }, SHEET_TRANSITION_MS);
  }, []);

  useEffect(() => {
    closeHandlerRef.current = onRequestClose;
  }, [onRequestClose]);

  useEffect(() => {
    if (closeRequest <= lastCloseRequestRef.current) {
      return;
    }

    lastCloseRequestRef.current = closeRequest;
    const closeFrame = window.requestAnimationFrame(requestClose);
    return () => window.cancelAnimationFrame(closeFrame);
  }, [closeRequest, requestClose]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const firstFrame = window.requestAnimationFrame(() => {
      setVisible(true);
      window.requestAnimationFrame(() => {
        panelRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      if (!focusable?.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="发布动态"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-200 ease-out motion-reduce:transition-none"
        aria-label="关闭发布面板"
        tabIndex={-1}
        onClick={requestClose}
      />

      <div
        ref={panelRef}
        className={`absolute inset-x-0 bottom-0 flex h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#f7f9fc] shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none md:h-[min(92dvh,900px)] ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
