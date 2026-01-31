import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface FileIconProps extends HTMLAttributes<SVGElement> {
  mimeType: string;
  size?: "sm" | "md" | "lg";
}

const FileIcon = forwardRef<SVGSVGElement, FileIconProps>(
  ({ mimeType, size = "md", className, ...props }, ref) => {
    const sizes = {
      sm: "h-5 w-5",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    };

    const getIconForMimeType = (type: string) => {
      if (type.startsWith("image/")) {
        return (
          <svg
            ref={ref}
            className={cn(sizes[size], className)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      }

      if (type.startsWith("video/")) {
        return (
          <svg
            ref={ref}
            className={cn(sizes[size], className)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
      }

      if (type.startsWith("audio/")) {
        return (
          <svg
            ref={ref}
            className={cn(sizes[size], className)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        );
      }

      if (type === "application/pdf") {
        return (
          <svg
            ref={ref}
            className={cn(sizes[size], className)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      }

      if (
        type === "application/zip" ||
        type === "application/x-zip-compressed" ||
        type === "application/x-rar-compressed" ||
        type === "application/x-7z-compressed" ||
        type === "application/x-tar" ||
        type === "application/x-gzip"
      ) {
        return (
          <svg
            ref={ref}
            className={cn(sizes[size], className)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
        );
      }

      if (
        type.includes("word") ||
        type.includes("document") ||
        type === "text/plain" ||
        type === "text/markdown" ||
        type === "text/html" ||
        type === "text/css"
      ) {
        return (
          <svg
            ref={ref}
            className={cn(sizes[size], className)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      }

      if (
        type.includes("excel") ||
        type.includes("spreadsheet") ||
        type === "text/csv"
      ) {
        return (
          <svg
            ref={ref}
            className={cn(sizes[size], className)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
      }

      if (type.includes("presentation") || type.includes("powerpoint")) {
        return (
          <svg
            ref={ref}
            className={cn(sizes[size], className)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
        );
      }

      if (type === "application/json" || type.includes("javascript")) {
        return (
          <svg
            ref={ref}
            className={cn(sizes[size], className)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        );
      }

      return (
        <svg
          ref={ref}
          className={cn(sizes[size], className)}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          {...props}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    };

    return getIconForMimeType(mimeType);
  }
);

FileIcon.displayName = "FileIcon";

export default FileIcon;
