"use client";

import { useEffect, useRef, useState } from "react";

type CopyStatus = "idle" | "success" | "error";

interface MarkdownCodeBlockProps {
  code: string;
  language?: string | null;
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "0";
  textArea.style.top = "0";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }
}

function formatLanguageLabel(language?: string | null) {
  if (!language) {
    return null;
  }

  return language.toLowerCase();
}

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M0 0h24v24H0z" fill="none" />
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M7 9.667A2.667 2.667 0 0 1 9.667 7h8.666A2.667 2.667 0 0 1 21 9.667v8.666A2.667 2.667 0 0 1 18.333 21H9.667A2.667 2.667 0 0 1 7 18.333z" />
        <path d="M4.012 16.737A2 2 0 0 1 3 15V5c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1" />
      </g>
    </svg>
  );
}

function CopyFilledIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M0 0h24v24H0z" fill="none" />
      <g fill="currentColor">
        <path d="M20.926 7.074A3.67 3.67 0 0 1 22 9.667v8.666A3.667 3.667 0 0 1 18.333 22H9.667A3.667 3.667 0 0 1 6 18.333V9.667q0-.053.005-.102A3.66 3.66 0 0 1 9.667 6h8.666c.973 0 1.905.386 2.593 1.074" />
        <path d="M17.374 3.514a1 1 0 1 1-1.748.972C15.405 4.088 15.284 4 15 4H5c-.548 0-1 .452-1 1v9.998c0 .36.194.692.507.87a1 1 0 1 1-.99 1.738A3 3 0 0 1 2 15V5c0-1.652 1.348-3 3-3h10c1.094 0 1.828.533 2.374 1.514" />
      </g>
    </svg>
  );
}

export default function MarkdownCodeBlock({
  code,
  language,
}: MarkdownCodeBlockProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await copyText(code);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setCopyStatus("idle");
      resetTimerRef.current = null;
    }, 2000);
  };

  const isCopied = copyStatus === "success";
  const languageLabel = formatLanguageLabel(language);

  return (
    <div className="not-prose relative my-6 overflow-hidden rounded-xl bg-[#1f2937] text-slate-100 shadow-sm">
      {languageLabel ? (
        <span className="absolute left-3 top-3 z-10 rounded-md bg-white/8 px-2 py-1 font-mono text-[11px] leading-none text-slate-300">
          {languageLabel}
        </span>
      ) : null}
      <div className="absolute right-3 top-3 z-10">
        <button
          type="button"
          onClick={handleCopy}
          className={
            isCopied
              ? "inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/12 text-emerald-300 transition"
              : "inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/8 text-slate-300 transition hover:bg-white/12 hover:text-white"
          }
          aria-label={isCopied ? "已复制代码" : "复制代码"}
          title={isCopied ? "已复制" : "复制代码"}
        >
          <span className="text-[18px] leading-none">
            {isCopied ? <CopyFilledIcon /> : <CopyIcon />}
          </span>
        </button>
      </div>
      <pre
        className="code__pre code-scroll hljs m-0 overflow-x-auto overflow-y-hidden bg-transparent px-4 pb-4 pt-12"
        style={{ whiteSpace: "pre", wordBreak: "normal", overflowWrap: "normal" }}
      >
        <code
          className="block min-w-full bg-transparent font-mono text-[13px] leading-6 text-slate-100"
          style={{ whiteSpace: "inherit", wordBreak: "inherit", overflowWrap: "inherit" }}
        >
          {code}
        </code>
      </pre>
    </div>
  );
}
