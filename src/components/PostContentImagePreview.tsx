"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import ImagePreviewLightbox from "@/components/ImagePreviewLightbox";

interface PreviewImage {
  src: string;
  alt: string;
}

interface PreviewState {
  images: PreviewImage[];
  currentIndex: number;
}

interface PostContentImagePreviewProps {
  children: ReactNode;
}

function getImageSource(image: HTMLImageElement): string {
  return image.currentSrc || image.getAttribute("src") || image.src || "";
}

export default function PostContentImagePreview({
  children,
}: PostContentImagePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const getImages = useCallback((): PreviewImage[] => {
    const container = containerRef.current;
    if (!container) return [];

    return Array.from(container.querySelectorAll<HTMLImageElement>("img"))
      .filter((image) => image.dataset.customEmoji !== "true")
      .map((image) => ({
        src: getImageSource(image),
        alt: image.alt,
      }))
      .filter((image) => image.src.length > 0);
  }, []);

  const openImage = useCallback(
    (image: HTMLImageElement) => {
      const images = getImages();
      const src = getImageSource(image);
      const currentIndex = images.findIndex((item) => item.src === src);

      if (currentIndex < 0) return;

      setPreview({ images, currentIndex });
    },
    [getImages],
  );

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const image = target.closest("img");
    if (
      !(image instanceof HTMLImageElement)
      || image.dataset.customEmoji === "true"
      || !event.currentTarget.contains(image)
    ) {
      return;
    }

    event.preventDefault();
    openImage(image);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;

    event.preventDefault();
    openImage(image);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      if (image.dataset.customEmoji === "true") {
        return;
      }
      image.classList.add("post-content-image");
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      if (!image.getAttribute("aria-label")) {
        image.setAttribute(
          "aria-label",
          image.alt ? `View image: ${image.alt}` : "View image",
        );
      }
    });
  }, [children]);

  return (
    <>
      <div
        ref={containerRef}
        className="post-content-image-preview"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
      {preview && (
        <ImagePreviewLightbox
          images={preview.images}
          currentIndex={preview.currentIndex}
          onClose={() => setPreview(null)}
          onIndexChange={(currentIndex) =>
            setPreview((current) => (current ? { ...current, currentIndex } : current))
          }
        />
      )}
    </>
  );
}
