"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardNavigation() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Ctrl+H or Cmd+H: Go to home
      if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault();
        router.push('/');
      }

      // Ctrl+M or Cmd+M: Go to My eSIMs
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault();
        router.push('/my-esims');
      }

      // Ctrl+A or Cmd+A: Go to Account
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        router.push('/account');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}













