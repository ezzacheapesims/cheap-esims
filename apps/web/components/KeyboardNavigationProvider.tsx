"use client";

import { ReactNode } from "react";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

export function KeyboardNavigationProvider({ children }: { children: ReactNode }) {
  useKeyboardNavigation();
  return <>{children}</>;
}















