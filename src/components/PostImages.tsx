"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface PostImagesProps {
  images: string[];
  isDetail?: boolean;
}

export default function PostImages({ images, isDetail = false }: PostImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // 当图片预览打开时，锁定滚动，并确保没有任何其他元素（包括 Navbar）能挡住
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden';
      // 强制隐藏可能遮挡的元素
      document.body.classList.add('image-preview-active');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('image-preview-active');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('image-preview-active');
    };
  }, [selectedIndex]);

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

  // 键盘导航
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

  const lightbox = currentImageUrl && mounted ? createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/98"
      style={{ zIndex: 2147483647, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={handleClose}
    >
      <style jsx global>{`
        /* 彻底解决遮挡问题：预览打开时隐藏导航栏和其他置顶元素 */
        .image-preview-active header,
        .image-preview-active .sticky,
        .image-preview-active nav {
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }
      `}</style>

      {/* 关闭按钮 - 放在正上方右侧一点，确保好点 */}
      <button
        className="absolute top-8 right-8 text-gray bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-full p-4 transition-all duration-200 border border-white/30 shadow-2xl group"
        style={{ zIndex: 2147483647 }}
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        aria-label="关闭预览"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 group-hover:scale-110 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* 左右导航 */}
      {images.length > 1 && selectedIndex !== null && (
        <>
          {selectedIndex > 0 && (
            <button
              className="absolute left-8 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full p-5 transition-all border border-white/20 shadow-2xl"
              style={{ zIndex: 2147483647 }}
              onClick={handlePrev}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {selectedIndex < images.length - 1 && (
            <button
              className="absolute right-8 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full p-5 transition-all border border-white/20 shadow-2xl"
              style={{ zIndex: 2147483647 }}
              onClick={handleNext}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* 图片展示区 */}
      <div 
        className="w-full h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit={true}
          key={currentImageUrl}
        >
          <TransformComponent
            wrapperStyle={{ width: "100vw", height: "100vh" }}
            contentStyle={{ width: "100vw", height: "100vh" }}
          >
            <div className="relative w-full h-full flex items-center justify-center p-4">
                <Image
                src={currentImageUrl}
                alt="预览图片"
                fill
                className="object-contain select-none shadow-2xl"
                sizes="100vw"
                priority
                draggable={false}
                />
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* 底部计数 */}
      {images.length > 1 && (
        <div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md text-white px-8 py-3 rounded-full text-xl font-bold border border-white/10 shadow-2xl"
          style={{ zIndex: 2147483647 }}
        >
          {selectedIndex !== null ? selectedIndex + 1 : 0} / {images.length}
        </div>
      )}
    </div>,
    document.body
  ) : null;

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
              alt={`图片 ${index + 1}`}
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

      {lightbox}
    </>
  );
}
