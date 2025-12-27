"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface PostImagesProps {
  images: string[];
  isDetail?: boolean;
}

export default function PostImages({ images, isDetail = false }: PostImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => 
      prev !== null && prev < images.length - 1 ? prev + 1 : prev
    );
  }, [selectedIndex, images.length]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => 
      prev !== null && prev > 0 ? prev - 1 : prev
    );
  }, [selectedIndex]);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, handleNext, handlePrev, handleClose]);

  if (!images || images.length === 0) return null;

  const displayImages = isDetail ? images : images.slice(0, 9);
  const remainingCount = images.length - 9;
  const currentImageUrl = selectedIndex !== null ? images[selectedIndex] : null;

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
            onClick={() => setSelectedIndex(index)}
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
      {currentImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={handleClose}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 z-[60] text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
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

          {/* Navigation Buttons */}
          {images.length > 1 && selectedIndex !== null && (
            <>
              {selectedIndex > 0 && (
                <button
                  className="absolute left-4 z-[60] text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
                  onClick={handlePrev}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {selectedIndex < images.length - 1 && (
                <button
                  className="absolute right-4 z-[60] text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
                  onClick={handleNext}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Zoomable Image */}
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the wrapper
          >
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              centerOnInit={true}
              key={currentImageUrl} // Force reset transform on image change
            >
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <div className="relative w-full h-full max-w-[90vw] max-h-[90vh]">
                    <Image
                    src={currentImageUrl}
                    alt="Full size"
                    fill
                    className="object-contain"
                    sizes="90vw"
                    priority
                    />
                </div>
              </TransformComponent>
            </TransformWrapper>
          </div>
        </div>
      )}
    </>
  );
}
