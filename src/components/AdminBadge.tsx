import { cn } from "@/lib/utils";

interface AdminBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-[10px]",
  md: "text-[11px]",
  lg: "text-xs",
} as const;

export default function AdminBadge({ size = "sm", className }: AdminBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 whitespace-nowrap font-bold tracking-[0.08em] text-transparent bg-clip-text bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600",
        sizeClasses[size],
        className,
      )}
      aria-label="ADMIN"
      title="ADMIN"
    >
      ADMIN
    </span>
  );
}
