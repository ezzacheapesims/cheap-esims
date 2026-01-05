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
 * Check if plan should go to Unlimited tab
 * Requirements: 2GB and FUP1Mbps
 */
export function isDailyUnlimitedPlan(plan: Plan): boolean {
  // Must be exactly 2GB (not unlimited -1)
  if (plan.volume === -1) {
    return false;
  }
  const volumeGB = plan.volume / (1024 * 1024 * 1024);
  // Check if it's exactly 2GB (allow small tolerance for rounding)
  if (volumeGB < 1.95 || volumeGB > 2.05) {
    return false;
  }
  
  // Must have FUP1Mbps flag
  const nameLower = (plan.name || '').toLowerCase();
  const hasFUP1Mbps = nameLower.includes('fup1mbps') || 
                     nameLower.includes('fup 1mbps') ||
                     (plan as any).fup === true ||
                     ((plan as any).fupSpeed && (plan as any).fupSpeed === 1) ||
                     (typeof (plan as any).fup === 'string' && /fup1mbps?/i.test((plan as any).fup));
  
  return hasFUP1Mbps;
}

/**
 * Check if plan should be visible (>= 2GB and not 1 day, OR 2GB + FUP1Mbps)
 * All plans >= 2GB (except 1 day plans, unless 2GB + FUP1Mbps) are visible regardless of price
 */
export function isPlanVisible(
  plan: Plan,
  discountPercent?: number
): boolean {
  // 2GB + FUP1Mbps plans are always visible (they go to Unlimited tab)
  if (isDailyUnlimitedPlan(plan)) {
    return true;
  }
  
  // Check minimum size (2GB = 2 * 1024 * 1024 * 1024 bytes)
  if (plan.volume === -1) {
    // Unlimited plans are visible, but check duration
    const duration = plan.duration;
    const durationUnit = plan.durationUnit?.toLowerCase() || 'day';
    if (duration === 1 && durationUnit === 'day') {
      return false; // 1 day plan, exclude (unless 2GB + FUP1Mbps)
    }
    return true; // Unlimited plans (except 1 day) are visible
  }
  
  const minSizeBytes = 2 * 1024 * 1024 * 1024; // 2GB in bytes
  const volumeGB = plan.volume / (1024 * 1024 * 1024);
  if (volumeGB <= 1.5) {
    return false; // 1.5GB or less, exclude
  }
  
  // Check duration: must not be 1 day (unless Daily Unlimited)
  const duration = plan.duration;
  const durationUnit = plan.durationUnit?.toLowerCase() || 'day';
  if (duration === 1 && durationUnit === 'day') {
      return false; // 1 day plan, exclude (unless 2GB + FUP1Mbps)
  }
  
  // All plans >= 2GB (except 1 day) are visible (no price filter)
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
  
  // Filter to only visible plans (>= 2GB and not 1 day)
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
 * Filter plans to only those >= 2GB and not 1 day
 */
export function filterVisiblePlans(plans: Plan[]): Plan[] {
  return plans.filter((plan) => {
    const gb = calculateGB(plan.volume);
    const discountPercent = getDiscount(plan.packageCode, gb);
    return isPlanVisible(plan, discountPercent);
  });
}

/**
 * Check if a plan has nonhkip flag
 */
function hasNonHKIP(plan: Plan): boolean {
  const nameLower = (plan.name || '').toLowerCase();
  return nameLower.includes('nonhkip') || 
         nameLower.includes('nonhk') ||
         (plan as any).nonhkip === true ||
         (plan as any).ipType === 'nonhkip' ||
         (typeof (plan as any).nonhkip === 'string' && (plan as any).nonhkip.toLowerCase() === 'nonhkip');
}

/**
 * Check if a plan has IIJ flag
 */
function hasIIJ(plan: Plan): boolean {
  const nameUpper = (plan.name || '').toUpperCase();
  return nameUpper.includes('(IIJ)') || nameUpper.includes('IIJ');
}

/**
 * Deduplicate plans: if multiple plans have the same location, duration, and data size,
 * - For Japan: prefer the one with "(IIJ)" in the name
 * - For all other countries: prefer the one with "nonhkip" flag
 * If no preferred version exists, keep the first one.
 * 
 * @param plans - Array of plans to deduplicate
 * @returns Deduplicated array of plans
 */
export function deduplicatePlans(plans: Plan[]): Plan[] {
  // Create a map keyed by location, duration, and data size
  const planMap = new Map<string, Plan[]>();
  
  for (const plan of plans) {
    // Normalize location (handle multi-country plans)
    const location = (plan.location || '').split(',')[0].trim().toUpperCase();
    
    // Create a key: location_duration_durationUnit_volume
    const key = `${location}_${plan.duration}_${plan.durationUnit || 'day'}_${plan.volume}`;
    
    if (!planMap.has(key)) {
      planMap.set(key, []);
    }
    planMap.get(key)!.push(plan);
  }
  
  // For each group, prefer IIJ for Japan, nonhkip for others
  const deduplicated: Plan[] = [];
  
  for (const [key, group] of planMap.entries()) {
    if (group.length === 1) {
      // Only one plan, keep it
      deduplicated.push(group[0]);
    } else {
      // Get location from first plan in group (all have same location)
      const location = (group[0].location || '').split(',')[0].trim().toUpperCase();
      const isJapan = location === 'JP' || location === 'JAPAN';
      
      let preferredPlan: Plan | undefined;
      
      if (isJapan) {
        // For Japan: prefer IIJ version
        preferredPlan = group.find(plan => hasIIJ(plan));
      } else {
        // For all other countries: prefer nonhkip version
        preferredPlan = group.find(plan => hasNonHKIP(plan));
      }
      
      if (preferredPlan) {
        deduplicated.push(preferredPlan);
      } else {
        // No preferred version, keep the first one
        deduplicated.push(group[0]);
      }
    }
  }
  
  return deduplicated;
}
