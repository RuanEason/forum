"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Ad() {
    const pathname = usePathname();
    const photoUrl = "https://cdn.zyg2024.top/act/AdPhoto.png";

    if (pathname?.startsWith("/music")) {
        return null;
    }

    return (
        <Link
            href="/music"
            aria-label="进入清明音乐活动页"
            className="hidden"
        >
            <div
                className="w-full h-22 bg-cover bg-center cursor-pointer"
                style={{ backgroundImage: `url(${photoUrl})` }}
            />
        </Link>
    )
} 
