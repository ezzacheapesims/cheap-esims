/**
 * Plan utility functions for frontend-only transformations
 * All business logic here is client-side only
 */

import { Plan } from "@/components/PlanCard";
import { getDiscount } from "./admin-discounts";

/**
 * Calculate GB from volume in bytes
 */
export function calculateGB(volumeBytes: number): number {
  return volumeBytes / 1024 / 1024 / 1024;
}

/**
 * Calculate MB from volume in bytes
 */
export function calculateMB(volumeBytes: number): number {
  return volumeBytes / 1024 / 1024;
}

/**
 * Format data size for display
 * Shows MB for sizes < 1GB, GB for sizes >= 1GB
 * @param volumeBytes - Volume in bytes
 * @returns Formatted string like "100 MB" or "1.5 GB"
 */
export function formatDataSize(volumeBytes: number): { value: string; unit: string } {
  if (volumeBytes === -1) {
    return { value: "UL", unit: "" };
  }
  
  const gb = calculateGB(volumeBytes);
  
  if (gb < 1) {
    const mb = calculateMB(volumeBytes);
    // Round to nearest 10MB for cleaner display
    const roundedMB = Math.round(mb / 10) * 10;
    return { value: roundedMB.toString(), unit: "MB" };
  } else {
    // Round to 1 decimal for GB
    const roundedGB = Math.round(gb * 10) / 10;
    return { value: roundedGB.toFixed(1), unit: "GB" };
  }
}

/**
 * Calculate final price with discount (frontend only)
 * This does NOT modify backend data
 * 
 * @param basePriceUSD - Price in USD (already includes backend markup)
 * @param discountPercent - Discount percentage (0-100)
 * @returns Final price in USD after discount
 */
export function calculateFinalPrice(
  basePriceUSD: number,
  discountPercent: number = 0
): number {
  if (discountPercent <= 0) {
    return basePriceUSD;
  }
  
  const discountAmount = basePriceUSD * (discountPercent / 100);
  return Math.max(0, basePriceUSD - discountAmount);
}

/**
 * Convert any currency amount to USD equivalent
 * Uses existing currency conversion logic from CurrencyProvider
 * 
 * @param amount - Amount in source currency
 * @param sourceCurrency - Source currency code
 * @param rates - Exchange rates object (USD = 1.0)
 * @returns USD equivalent
 */
export function convertToUSD(
  amount: number,
  sourceCurrency: string,
  rates: Record<string, number>
): number {
  if (sourceCurrency === "USD") {
    return amount;
  }
  
  const rate = rates[sourceCurrency];
  if (!rate || rate === 0) {
    // If rate not available, assume 1:1 (not ideal but safe)
    return amount;
  }
  
  // Convert from source currency to USD
  // If rate is 3.5, then 3.5 EUR = 1 USD, so 7 EUR = 2 USD
  // So: amount / rate = USD
  return amount / rate;
}

/**
 * Get final price in USD for a plan (with discount applied frontend-only)
 * Backend already returns price in USD after markup
 */
export function getFinalPriceUSD(
  plan: Plan,
  discountPercent?: number
): number {
  // Get base price in USD (backend already applied markup)
  // plan.price is already in USD from backend
  const basePriceUSD = plan.price || 0;
  
  // Apply frontend discount if provided
  const finalPrice = discountPercent !== undefined && discountPercent > 0
    ? calculateFinalPrice(basePriceUSD, discountPercent)
    : basePriceUSD;
  
  return finalPrice;
}

/**
 * Check if plan should be visible (>= 100MB)
 * All plans >= 100MB are visible regardless of price
 */
export function isPlanVisible(
  plan: Plan,
  discountPercent?: number
): boolean {
  // Check minimum size (100MB = 100 * 1024 * 1024 bytes)
  if (plan.volume === -1) {
    return true; // Unlimited plans are always visible
  }
  
  const minSizeBytes = 100 * 1024 * 1024; // 100MB in bytes
  if (plan.volume < minSizeBytes) {
    return false;
  }
  
  // All plans >= 100MB are visible (no price filter)
  return true;
}

/**
 * Group plans by data size
 * Groups by GB (rounded to 1 decimal) for >= 1GB, or MB (rounded to nearest 10) for < 1GB
 */
export function groupPlansByDataSize(plans: Plan[]): Map<string, Plan[]> {
  const grouped = new Map<string, Plan[]>();
  
  for (const plan of plans) {
    const { value, unit } = formatDataSize(plan.volume);
    const key = `${value} ${unit}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(plan);
  }
  
  return grouped;
}

/**
 * Get unique durations for a given data size
 */
export function getDurationsForSize(
  plans: Plan[],
  targetSize: string // Format: "100 MB" or "1.5 GB"
): Array<{ duration: number; durationUnit: string; plan: Plan }> {
  const matches = plans.filter((plan) => {
    const { value, unit } = formatDataSize(plan.volume);
    const planKey = `${value} ${unit}`;
    return planKey === targetSize;
  });
  
  // Filter to only visible plans (>= 100MB)
  const visible = matches.filter((plan) => {
    const gb = calculateGB(plan.volume);
    const discountPercent = getDiscount(plan.packageCode, gb);
    return isPlanVisible(plan, discountPercent);
  });
  
  // Get unique duration combinations
  const seen = new Set<string>();
  const durations: Array<{ duration: number; durationUnit: string; plan: Plan }> = [];
  
  for (const plan of visible) {
    const key = `${plan.duration}-${plan.durationUnit}`;
    if (!seen.has(key)) {
      seen.add(key);
      durations.push({
        duration: plan.duration,
        durationUnit: plan.durationUnit,
        plan,
      });
    }
  }
  
  // Sort by duration (ascending)
  return durations.sort((a, b) => {
    // Normalize to days for comparison
    const aDays = a.durationUnit.toLowerCase() === "day" ? a.duration : a.duration * 30;
    const bDays = b.durationUnit.toLowerCase() === "day" ? b.duration : b.duration * 30;
    return aDays - bDays;
  });
}

/**
 * Filter plans to only those >= 100MB
 */
export function filterVisiblePlans(plans: Plan[]): Plan[] {
  return plans.filter((plan) => {
    const gb = calculateGB(plan.volume);
    const discountPercent = getDiscount(plan.packageCode, gb);
    return isPlanVisible(plan, discountPercent);
  });
}
