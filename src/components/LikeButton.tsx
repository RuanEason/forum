"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const LIKE_REQUEST_TIMEOUT = 3000;
const FAILURE_NOTICE_DURATION = 3500;

const particleDirections = [
  { tx: "-35px", ty: "-35px" },
  { tx: "0px", ty: "-45px" },
  { tx: "35px", ty: "-35px" },
  { tx: "-45px", ty: "0px" },
  { tx: "45px", ty: "0px" },
  { tx: "-35px", ty: "35px" },
  { tx: "0px", ty: "45px" },
  { tx: "35px", ty: "35px" },
] as const;

interface LikeButtonProps {
  targetType: "post" | "comment";
  targetId: string;
  initialLikesCount: number;
  initialLikedByUser: boolean;
}

interface LikeResponse {
  liked?: boolean;
  error?: string;
}

export default function LikeButton({
  targetType,
  targetId,
  initialLikesCount,
  initialLikedByUser,
}: LikeButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [likedByUser, setLikedByUser] = useState(initialLikedByUser);
  const [requestPending, setRequestPending] = useState(false);
  const [animateLike, setAnimateLike] = useState(false);
  const [failureMessage, setFailureMessage] = useState("");
  const requestPendingRef = useRef(false);
  const failureTimerRef = useRef<number | null>(null);
  const animationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (failureTimerRef.current !== null) {
        window.clearTimeout(failureTimerRef.current);
      }
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const showFailureMessage = (message: string) => {
    if (failureTimerRef.current !== null) {
      window.clearTimeout(failureTimerRef.current);
    }

    setFailureMessage(message);
    failureTimerRef.current = window.setTimeout(() => {
      setFailureMessage("");
      failureTimerRef.current = null;
    }, FAILURE_NOTICE_DURATION);
  };

  const stopLikeAnimation = () => {
    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current);
    }

    setAnimateLike(false);
    animationTimerRef.current = null;
  };

  const startLikeAnimation = () => {
    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current);
    }

    setAnimateLike(true);
    animationTimerRef.current = window.setTimeout(() => {
      setAnimateLike(false);
      animationTimerRef.current = null;
    }, 650);
  };

  const handleLikeToggle = async () => {
    if (requestPendingRef.current) {
      return;
    }

    if (status !== "authenticated") {
      router.push(`/auth/signin?redirect=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    const previousLiked = likedByUser;
    const previousLikesCount = likesCount;
    const optimisticLiked = !previousLiked;

    requestPendingRef.current = true;
    setRequestPending(true);
    setFailureMessage("");

    // Update the interface before waiting for the server response.
    setLikedByUser(optimisticLiked);
    setLikesCount(
      Math.max(0, previousLikesCount + (optimisticLiked ? 1 : -1))
    );

    if (optimisticLiked) {
      startLikeAnimation();
    } else {
      stopLikeAnimation();
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, LIKE_REQUEST_TIMEOUT);

    try {
      const response = await fetch("/api/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetType, targetId }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as LikeResponse | null;

      if (!response.ok || typeof data?.liked !== "boolean") {
        throw new Error(data?.error || "Like request failed");
      }

      // Reconcile an unexpected server state without applying the count delta twice.
      if (data.liked !== optimisticLiked) {
        setLikesCount((currentCount) =>
          Math.max(0, currentCount + (data.liked ? 1 : -1))
        );
      }
      setLikedByUser(data.liked);

      if (data.liked) {
        router.refresh();
      }
    } catch {
      setLikedByUser(previousLiked);
      setLikesCount(previousLikesCount);
      stopLikeAnimation();
      showFailureMessage(timedOut ? "点赞失败，请稍后重试" : "点赞失败");
    } finally {
      window.clearTimeout(timeoutId);
      requestPendingRef.current = false;
      setRequestPending(false);
    }
  };

  return (
    <>
      {failureMessage && (
        <div
          className="fixed left-1/2 top-4 z-[1100] -translate-x-1/2 rounded-md border border-yellow-300 bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-900 shadow-lg"
          role="alert"
          aria-live="polite"
        >
          {failureMessage}
        </div>
      )}

      <button
        type="button"
        onClick={handleLikeToggle}
        className={`like-button-container relative flex items-center justify-center rounded-full p-1 transition-colors hover:bg-gray-200 disabled:cursor-wait sm:p-2 ${
          likedByUser ? "is-liked text-blue-500" : "text-gray-400 hover:text-blue-500"
        } ${animateLike ? "animate-like" : ""}`}
        disabled={requestPending || status === "loading"}
        aria-label={likedByUser ? "取消点赞" : "点赞"}
        aria-pressed={likedByUser}
        aria-busy={requestPending}
        title={likedByUser ? "取消点赞" : "点赞"}
        suppressHydrationWarning
      >
        <span className="particles-wrapper" aria-hidden="true">
          {particleDirections.map((direction, index) => (
            <span
              key={index}
              className="particle"
              style={
                {
                  "--tx": direction.tx,
                  "--ty": direction.ty,
                } as CSSProperties
              }
            />
          ))}
        </span>

        <svg
          width="20"
          height="20"
          viewBox="0 0 36 36"
          xmlns="http://www.w3.org/2000/svg"
          className="thumb-icon"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.77234 30.8573V11.7471H7.54573C5.50932 11.7471 3.85742 13.3931 3.85742 15.425V27.1794C3.85742 29.2112 5.50932 30.8573 7.54573 30.8573H9.77234ZM11.9902 30.8573V11.7054C14.9897 10.627 16.6942 7.8853 17.1055 3.33591C17.2666 1.55463 18.9633 0.814421 20.5803 1.59505C22.1847 2.36964 23.243 4.32583 23.243 6.93947C23.243 8.50265 23.0478 10.1054 22.6582 11.7471H29.7324C31.7739 11.7471 33.4289 13.402 33.4289 15.4435C33.4289 15.7416 33.3928 16.0386 33.3215 16.328L30.9883 25.7957C30.2558 28.7683 27.5894 30.8573 24.528 30.8573H11.9911H11.9902Z"
          />
        </svg>

        <span
          className="ml-1 text-xs font-medium tabular-nums sm:text-sm"
          suppressHydrationWarning
        >
          {likesCount > 0 ? likesCount : null}
        </span>
      </button>

      <style jsx>{`
        .like-button-container {
          -webkit-tap-highlight-color: transparent;
        }

        .thumb-icon {
          width: 20px;
          height: 20px;
          fill: transparent;
          stroke: currentColor;
          stroke-width: 2.5px;
          transition: fill 0.3s ease, stroke 0.3s ease, stroke-width 0.3s ease;
          overflow: visible;
          transform-origin: center bottom;
        }

        .particles-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background-color: #3b82f6;
          border-radius: 50%;
          opacity: 0;
          transform: translate(-50%, -50%) scale(0);
        }

        @keyframes thumbBurst {
          0% {
            transform: scale(1) rotate(0deg);
          }
          30% {
            transform: scale(1.15) rotate(-12deg);
          }
          50% {
            transform: scale(0.95) rotate(5deg);
          }
          70% {
            transform: scale(1.05) rotate(-3deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes shootParticle {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0);
          }
        }

        .is-liked .thumb-icon {
          fill: currentColor;
          stroke: currentColor;
          stroke-width: 0;
        }

        .animate-like .thumb-icon {
          animation: thumbBurst 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
        }

        .animate-like .particle {
          animation: shootParticle 0.6s ease-out forwards;
        }
      `}</style>
    </>
  );
}
