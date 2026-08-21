"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

type SignInModalProps = {
  children: ReactNode;
  onRequestClose: () => void | Promise<void>;
};

const focusableSelector = [
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(",");
const MODAL_TRANSITION_MS = 220;

export default function SignInModal({ children, onRequestClose }: SignInModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeHandlerRef = useRef(onRequestClose);
  const closeRequestedRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    }, MODAL_TRANSITION_MS);
  }, []);

  useEffect(() => {
    closeHandlerRef.current = onRequestClose;
  }, [onRequestClose]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const firstFrame = window.requestAnimationFrame(() => {
      setVisible(true);
      window.requestAnimationFrame(() => {
        panelRef.current?.querySelector<HTMLElement>("input:not([disabled])")?.focus();
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
      className={`fixed inset-0 z-[100] flex items-end justify-center transition-opacity duration-200 ease-out sm:items-center sm:p-4 motion-reduce:transition-none ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="登录"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[3px] transition-opacity duration-200 ease-out motion-reduce:transition-none"
        aria-label="关闭登录弹窗"
        tabIndex={-1}
        onClick={requestClose}
      />

      <section
        ref={panelRef}
        className={`relative flex max-h-[min(92dvh,760px)] w-full flex-col overflow-y-auto overscroll-contain rounded-t-[24px] bg-white shadow-2xl transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none sm:max-h-[min(90dvh,720px)] sm:w-[min(92vw,460px)] sm:rounded-2xl ${
          visible ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-full opacity-0 sm:translate-y-2 sm:scale-95"
        }`}
      >
        <button
          type="button"
          onClick={requestClose}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:right-4 sm:top-4"
          aria-label="关闭登录弹窗"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </section>
    </div>
  );
}
