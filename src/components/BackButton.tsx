"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  href?: string;
  onBeforeNavigate?: () => boolean;
}

export default function BackButton({ href, onBeforeNavigate }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onBeforeNavigate && onBeforeNavigate()) {
      return;
    }

    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button onClick={handleClick} className="btn-back" title="返回">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
  );
}
