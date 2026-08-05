"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  RotateCw,
  X,
} from "lucide-react";

interface PreviewImage {
  src: string;
  alt?: string;
}

interface ImagePreviewLightboxProps {
  images: PreviewImage[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

const MAX_BACKGROUND_CLICK_DURATION_MS = 300;
const MAX_BACKGROUND_CLICK_DISTANCE_PX = 8;

const getDownloadFilename = (src: string, index: number) => {
  let filename = `image-${index + 1}`;

  try {
    const url = new URL(src, window.location.href);
    const candidate = decodeURIComponent(
      url.pathname.split("/").filter(Boolean).pop() || "",
    );

    if (candidate) {
      filename = candidate;
    }
  } catch {
    // Keep the fallback filename for non-URL strings.
  }

  if (/\.[a-z0-9]{2,8}$/i.test(filename)) {
    return filename;
  }

  return `${filename}.jpg`;
};

const triggerDownload = (href: string, filename: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export default function ImagePreviewLightbox({
  images,
  currentIndex,
  onClose,
  onIndexChange,
}: ImagePreviewLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const viewerPointerRef = useRef<{ x: number; y: number; startedAt: number } | null>(null);
  const suppressViewerClickRef = useRef(false);

  const currentImage = images[currentIndex];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < images.length - 1;
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const isSideways = normalizedRotation === 90 || normalizedRotation === 270;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.classList.add("image-preview-active");

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("image-preview-active");
    };
  }, []);

  useEffect(() => {
    setRotation(0);
  }, [currentImage?.src, currentIndex]);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (!onIndexChange) return;
      if (nextIndex < 0 || nextIndex >= images.length) return;

      onIndexChange(nextIndex);
    },
    [images.length, onIndexChange],
  );

  const goPrev = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const goNext = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft" && canGoPrev) {
        goPrev();
      }

      if (event.key === "ArrowRight" && canGoNext) {
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canGoNext, canGoPrev, goNext, goPrev, onClose]);

  const downloadImage = useCallback(async () => {
    if (!currentImage || isDownloading) return;

    setIsDownloading(true);

    try {
      const filename = getDownloadFilename(currentImage.src, currentIndex);
      const params = new URLSearchParams({
        url: currentImage.src,
        filename,
      });

      triggerDownload(
        `/api/image-download?${params.toString()}`,
        filename,
      );
    } finally {
      window.setTimeout(() => setIsDownloading(false), 500);
    }
  }, [currentImage, currentIndex, isDownloading]);

  const handleViewerPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    viewerPointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      startedAt: performance.now(),
    };
    suppressViewerClickRef.current = false;
  };

  const handleViewerPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = viewerPointerRef.current;
    if (!pointer) return;

    const distance = Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
    const duration = performance.now() - pointer.startedAt;
    suppressViewerClickRef.current =
      distance > MAX_BACKGROUND_CLICK_DISTANCE_PX
      || duration > MAX_BACKGROUND_CLICK_DURATION_MS;
  };

  const handleViewerClick = (event: MouseEvent<HTMLDivElement>) => {
    const shouldSuppress = suppressViewerClickRef.current;
    suppressViewerClickRef.current = false;
    viewerPointerRef.current = null;

    if (shouldSuppress || event.target !== event.currentTarget) return;

    onClose();
  };

  if (!mounted || !currentImage) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] bg-black/98 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div
        className="absolute left-1/2 top-4 z-[2147483647] flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-black/55 px-2 py-1.5 shadow-2xl backdrop-blur-xl sm:top-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
          onClick={() => setRotation((value) => value - 90)}
          aria-label="Rotate left"
          title="Rotate left"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
          onClick={() => setRotation((value) => value + 90)}
          aria-label="Rotate right"
          title="Rotate right"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-wait disabled:opacity-60"
          onClick={downloadImage}
          disabled={isDownloading}
          aria-label={isDownloading ? "Downloading" : "Download image"}
          title={isDownloading ? "Downloading..." : "Download image"}
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        className="absolute right-4 top-4 z-[2147483647] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-2xl backdrop-blur-xl transition-colors hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50 sm:right-6 sm:top-6"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="Close preview"
        title="Close preview"
      >
        <X className="h-5 w-5" />
      </button>

      {images.length > 1 && (
        <>
          {canGoPrev && (
            <button
              type="button"
              className="absolute left-3 top-1/2 z-[2147483647] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-2xl backdrop-blur-lg transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 sm:left-8 sm:h-16 sm:w-16"
              onClick={(event) => {
                event.stopPropagation();
                goPrev();
              }}
              aria-label="Previous image"
              title="Previous image"
            >
              <ChevronLeft className="h-7 w-7 sm:h-9 sm:w-9" />
            </button>
          )}
          {canGoNext && (
            <button
              type="button"
              className="absolute right-3 top-1/2 z-[2147483647] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-2xl backdrop-blur-lg transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 sm:right-8 sm:h-16 sm:w-16"
              onClick={(event) => {
                event.stopPropagation();
                goNext();
              }}
              aria-label="Next image"
              title="Next image"
            >
              <ChevronRight className="h-7 w-7 sm:h-9 sm:w-9" />
            </button>
          )}
        </>
      )}

      <TransformWrapper
        key={`${currentImage.src}-${normalizedRotation}`}
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit
      >
        <TransformComponent
          wrapperStyle={{ width: "100vw", height: "100vh" }}
          contentStyle={{ width: "100vw", height: "100vh" }}
        >
          <div
            className="flex h-full w-full items-center justify-center p-4 sm:p-8"
            onPointerDown={handleViewerPointerDown}
            onPointerUp={handleViewerPointerUp}
            onPointerCancel={() => {
              viewerPointerRef.current = null;
              suppressViewerClickRef.current = true;
            }}
            onClick={handleViewerClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage.src}
              alt={currentImage.alt || "Preview image"}
              className={`select-none object-contain shadow-2xl transition-transform duration-200 ${
                isSideways
                  ? "max-h-[calc(100vw-2rem)] max-w-[calc(100vh-6rem)]"
                  : "max-h-[calc(100vh-6rem)] max-w-[calc(100vw-2rem)]"
              }`}
              style={{ transform: `rotate(${normalizedRotation}deg)` }}
              draggable={false}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </TransformComponent>
      </TransformWrapper>

      {images.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 z-[2147483647] -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-5 py-2 text-sm font-semibold text-white shadow-2xl backdrop-blur-md sm:bottom-10 sm:text-base"
          onClick={(event) => event.stopPropagation()}
        >
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body,
  );
}
