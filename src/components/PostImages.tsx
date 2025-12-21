"use client";

import Image from "next/image";
import { useState } from "react";

interface PostImagesProps {
  images: string[];
  isDetail?: boolean;
}

export default function PostImages({ images, isDetail = false }: PostImagesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    if (count === 1) return "aspect-auto max-h-[500px]";
    return "aspect-square";
  };

  return (
    <>
      <div className={`grid gap-1 mt-3 ${getGridClass(displayImages.length)}`}>
        {displayImages.map((url, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-lg cursor-pointer ${getImageAspectClass(
              displayImages.length
            )}`}
            style={displayImages.length === 1 ? { height: '500px' } : {}}
            onClick={() => setSelectedImage(url)}
          >
            <Image
              src={url}
              alt={`Post image ${index + 1}`}
              fill
              className="object-cover hover:opacity-90 transition-opacity"
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

      {/* Lightbox for full image view */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <Image
              src={selectedImage}
              alt="Full size"
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
