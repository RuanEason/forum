"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const EDITOR_ROUTE_PREFIX = "/editor";
const EDITOR_BODY_CLASS = "editor-route";

export default function RouteChromeController() {
  const pathname = usePathname();

  useEffect(() => {
    const isEditorRoute = pathname?.startsWith(EDITOR_ROUTE_PREFIX);

    document.documentElement.classList.toggle(EDITOR_BODY_CLASS, Boolean(isEditorRoute));
    document.body.classList.toggle(EDITOR_BODY_CLASS, Boolean(isEditorRoute));

    return () => {
      document.documentElement.classList.remove(EDITOR_BODY_CLASS);
      document.body.classList.remove(EDITOR_BODY_CLASS);
    };
  }, [pathname]);

  return null;
}
