"use client";

import Image from "next/image";
import { useState } from "react";
import ImagePreviewLightbox from "@/components/ImagePreviewLightbox";

interface PostImagesProps {
  images: string[];
  isDetail?: boolean;
}

export default function PostImages({
  images,
  isDetail = false,
}: PostImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const displayImages = isDetail ? images : images.slice(0, 9);
  const remainingCount = images.length - 9;

  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 4) return "grid-cols-2";
    return "grid-cols-3";
  };

  const getImageAspectClass = (count: number) => {
    if (count === 1) {
      return isDetail ? "h-80 sm:h-96 md:h-[500px]" : "h-48 sm:h-56 md:h-64";
    }

    return "aspect-square";
  };

  const getSingleImageWidthClass = () => {
    if (isDetail) {
      return "w-full max-w-3xl mx-auto";
    }

    return "w-full max-w-[260px] sm:max-w-[320px] justify-self-start";
  };

  return (
    <>
      <div className={`grid gap-1 mt-3 ${getGridClass(displayImages.length)}`}>
        {displayImages.map((url, index) => (
          <div
            key={url || index}
            className={`relative overflow-hidden cursor-pointer ${
              displayImages.length === 1 ? "rounded-2xl" : "rounded-lg"
            } ${getImageAspectClass(displayImages.length)} ${
              displayImages.length === 1 ? getSingleImageWidthClass() : ""
            }`}
            onClick={() => setSelectedIndex(index)}
          >
            <Image
              src={url}
              alt={`Image ${index + 1}`}
              fill
              className={
                displayImages.length === 1
                  ? "object-cover rounded-2xl hover:opacity-95 transition-opacity"
                  : "object-cover hover:opacity-90 transition-opacity"
              }
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {!isDetail && index === 8 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-bold">
                +{remainingCount}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <ImagePreviewLightbox
          images={images.map((src, index) => ({
            src,
            alt: `Image ${index + 1}`,
          }))}
          currentIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onIndexChange={setSelectedIndex}
        />
      )}
    </>
  );
}
