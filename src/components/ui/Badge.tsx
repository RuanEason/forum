import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-full";

    const variants = {
      default:
        "bg-gray-100 text-gray-800",
      primary:
        "bg-blue-100 text-blue-800",
      secondary:
        "bg-purple-100 text-purple-800",
      success:
        "bg-green-100 text-green-800",
      danger:
        "bg-red-100 text-red-800",
      warning:
        "bg-yellow-100 text-yellow-800",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-0.5 text-sm",
      lg: "px-3 py-1 text-base",
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
