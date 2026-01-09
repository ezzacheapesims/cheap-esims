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

