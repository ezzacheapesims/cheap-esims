"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void;
      setAttributes?: (attrs: Record<string, unknown>, callback?: () => void) => void;
      [key: string]: unknown;
    };
    Tawk_LoadStart?: Date;
  }
}

const isEnabled =
  typeof process.env.NEXT_PUBLIC_LIVE_CHAT_ENABLED !== "undefined" &&
  process.env.NEXT_PUBLIC_LIVE_CHAT_ENABLED === "true";

const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

export function LiveChat() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  // Only render anything client-side; if not enabled or missing config, no-op
  useEffect(() => {
    if (!isEnabled) return;
    if (!propertyId || !widgetId) return;
    if (typeof window === "undefined" || typeof document === "undefined") return;

    // If Tawk is already present, don't inject again
    if (window.Tawk_API) {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src*="embed.tawk.to/${propertyId}/${widgetId}"]`,
    );
    if (existingScript) {
      return;
    }

    try {
      window.Tawk_LoadStart = new Date();
      window.Tawk_API = window.Tawk_API || {};

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
      script.charset = "UTF-8";
      script.setAttribute("crossorigin", "*");

      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.body.appendChild(script);
      }
    } catch {
      // Swallow errors – chat is non-critical
    }
  }, []);

  // Update page context (path + full URL) whenever route changes and Tawk is ready
  useEffect(() => {
    if (!isEnabled) return;
    if (typeof window === "undefined") return;

    const updateContext = () => {
      try {
        if (!window.Tawk_API || typeof window.Tawk_API.setAttributes !== "function") {
          return;
        }

        const url =
          typeof window.location !== "undefined" ? window.location.href : undefined;
        const path = pathname ?? "/";
        const query = searchParams?.toString();
        const fullUrl =
          url ??
          (typeof window !== "undefined"
            ? `${window.location.origin}${path}${query ? `?${query}` : ""}`
            : undefined);

        window.Tawk_API.setAttributes(
          {
            page: path,
            url: fullUrl ?? undefined,
          },
          () => {
            // optional callback, no-op
          },
        );
      } catch {
        // Fail silently – chat metadata is non-critical
      }
    };

    // If Tawk is already loaded, update immediately
    if (window.Tawk_API) {
      updateContext();
    }

    // Also attach to onLoad so that first load gets context too
    if (!window.Tawk_API) {
      window.Tawk_API = {};
    }
    const currentOnLoad = window.Tawk_API.onLoad;
    window.Tawk_API.onLoad = () => {
      if (typeof currentOnLoad === "function") {
        try {
          currentOnLoad();
        } catch {
          // ignore
        }
      }
      updateContext();
    };
  }, [pathname, searchParams]);

  // Identify logged-in user (if available) once Clerk is loaded
  useEffect(() => {
    if (!isEnabled) return;
    if (typeof window === "undefined") return;
    if (!isLoaded) return;

    const identifyUser = () => {
      try {
        if (!window.Tawk_API || typeof window.Tawk_API.setAttributes !== "function") {
          return;
        }

        if (!user) {
          // No authenticated user – nothing to identify
          return;
        }

        const userId = user.id;
        const email =
          user.primaryEmailAddress?.emailAddress ??
          user.emailAddresses?.[0]?.emailAddress ??
          undefined;

        window.Tawk_API.setAttributes(
          {
            userId,
            email,
          },
          () => {
            // optional callback, no-op
          },
        );
      } catch {
        // Fail silently – chat identity is non-critical
      }
    };

    // If widget already loaded, identify immediately
    if (window.Tawk_API) {
      identifyUser();
    }

    // Also hook into onLoad in case script loads after auth
    if (!window.Tawk_API) {
      window.Tawk_API = {};
    }
    const currentOnLoad = window.Tawk_API.onLoad;
    window.Tawk_API.onLoad = () => {
      if (typeof currentOnLoad === "function") {
        try {
          currentOnLoad();
        } catch {
          // ignore
        }
      }
      identifyUser();
    };
  }, [user, isLoaded]);

  // This component renders nothing – it just manages the Tawk script
  return null;
}




