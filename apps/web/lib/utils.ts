import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Decode HTML entities in a string
 * Converts entities like &#x27; back to their original characters
 * Works in both server and client environments
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  
  // Use a simple approach that works in both SSR and client
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/');
}

/**
 * Formats USD dollars to currency string (legacy function for backward compatibility)
 * @param dollars - Price in USD dollars (e.g. 0.25 = $0.25, 3.00 = $3.00)
 * @returns Formatted currency string (e.g. "$0.25", "$3.00")
 */
export function formatUsdDollars(dollars: number): string {
  return formatCurrency(dollars, "USD");
}

/**
 * Formats a price to currency string with the specified currency code
 * @param amount - Price amount (e.g. 0.25, 3.00)
 * @param currencyCode - ISO currency code (e.g. "USD", "PLN", "EUR")
 * @returns Formatted currency string (e.g. "$0.25", "10.50 zł", "€3.00")
 */
export function formatCurrency(amount: number, currencyCode: string = "USD"): string {
  // Get locale based on currency for proper formatting
  const localeMap: Record<string, string> = {
    PLN: "pl-PL",
    EUR: "de-DE",
    GBP: "en-GB",
    USD: "en-US",
  };
  
  const locale = localeMap[currencyCode.toUpperCase()] || "en-US";
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Detects the device type based on user agent
 * @returns 'ios' | 'android' | 'desktop' | null
 */
export function detectDeviceType(): 'ios' | 'android' | 'desktop' | null {
  if (typeof window === 'undefined') return null;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }
  
  // Android detection
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  // Default to desktop
  return 'desktop';
}

/**
 * Checks if the current device is mobile (iOS or Android)
 */
export function isMobileDevice(): boolean {
  const deviceType = detectDeviceType();
  return deviceType === 'ios' || deviceType === 'android';
}

/**
 * Generates a universal link for eSIM installation based on device type
 * @param activationCode - The LPA activation code (e.g., "LPA:1$rsp.example.com$ACTIVATION_CODE")
 * @returns The universal link URL or null if activation code is invalid
 * 
 * iOS format: https://esimsetup.apple.com/esim_qrcode_provisioning?carddata={encoded}
 * Android format: https://esimsetup.android.com/esim_qrcode_provisioning?carddata={encoded}
 */
export function generateEsimInstallLink(activationCode: string | null | undefined): string | null {
  if (!activationCode) return null;
  
  // Validate that it's a proper LPA format
  if (!activationCode.startsWith('LPA:1$')) {
    return null;
  }
  
  const deviceType = detectDeviceType();
  
  // URL encode the activation code for the carddata parameter
  const encodedCarddata = encodeURIComponent(activationCode);
  
  if (deviceType === 'ios') {
    return `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodedCarddata}`;
  } else if (deviceType === 'android') {
    return `https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${encodedCarddata}`;
  }
  
  // For desktop or unknown devices, return null (should not show install button)
  return null;
}

