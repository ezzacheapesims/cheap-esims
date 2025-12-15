/**
 * Pricing management - fetches from backend API
 * Individual plan prices override global markup
 * Prices are stored in backend (AdminSettings.pricingJson) and visible to all users
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface PricingMap {
  [planCode: string]: number; // planCode -> price in USD
}

// Cache for pricing (cleared after updates). Always a valid map (possibly empty)
let pricingCache: PricingMap = {};
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Fetch pricing from backend API (with caching)
 */
export async function fetchPricing(): Promise<PricingMap> {
  // Return cached if valid
  const now = Date.now();
  if (cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    return pricingCache;
  }

  try {
    const response = await fetch(`${API_URL}/admin/pricing`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pricing: ${response.statusText}`);
    }
    const data = await response.json();
    
    pricingCache = data || {};
    cacheTimestamp = now;
    
    return pricingCache;
  } catch (error) {
    console.error("[PRICING] Failed to fetch pricing from backend:", error);
    // Return empty on error
    return {};
  }
}

/**
 * Clear pricing cache (call after updating)
 */
export function clearPricingCache(): void {
  pricingCache = {};
  cacheTimestamp = 0;
}

/**
 * Save pricing to backend (admin only)
 * @param pricing - Pricing data to save (planCode -> price in USD)
 * @param adminEmail - Admin email for authentication (required for POST)
 */
export async function savePricing(
  pricing: PricingMap,
  adminEmail?: string
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add admin email header if provided (required for admin-only POST endpoint)
    if (adminEmail) {
      headers['x-admin-email'] = adminEmail;
    }
    
    const response = await fetch(`${API_URL}/admin/pricing`, {
      method: 'POST',
      headers,
      body: JSON.stringify(pricing),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save pricing: ${error}`);
    }
    
    // Clear cache after update
    clearPricingCache();
  } catch (error) {
    console.error("[PRICING] Failed to save pricing:", error);
    throw error;
  }
}

/**
 * Get price for a specific plan (synchronous, uses cache)
 * Returns the individual price if set, otherwise null
 * 
 * Note: This uses cached pricing. Call fetchPricing() first to ensure cache is populated.
 * 
 * @param planCode - Plan code/ID
 * @returns Price in USD, or null if no individual price is set
 */
export function getIndividualPrice(planCode: string): number | null {
  if (!pricingCache) {
    return null;
  }
  
  return pricingCache[planCode] !== undefined && pricingCache[planCode] !== null
    ? pricingCache[planCode]
    : null;
}

/**
 * Set price for a specific plan (saves to backend)
 */
export async function setPrice(planCode: string, priceUSD: number, adminEmail?: string): Promise<void> {
  const current = await fetchPricing();
  const pricing = { ...current };
  
  if (priceUSD > 0) {
    pricing[planCode] = priceUSD;
  } else {
    delete pricing[planCode];
  }
  
  await savePricing(pricing, adminEmail);
}

/**
 * Remove price for a specific plan (saves to backend)
 */
export async function removePrice(planCode: string, adminEmail?: string): Promise<void> {
  const current = await fetchPricing();
  const pricing = { ...current };
  delete pricing[planCode];
  await savePricing(pricing, adminEmail);
}

/**
 * Clear all pricing (saves to backend)
 * @param adminEmail - Admin email for authentication (required for POST)
 */
export async function clearPricing(adminEmail?: string): Promise<void> {
  await savePricing({}, adminEmail);
}

/**
 * Export pricing as JSON string
 */
export function exportPricing(): string {
  const pricing = pricingCache || {};
  return JSON.stringify(pricing, null, 2);
}

/**
 * Import pricing from JSON string and save to backend
 * @param jsonString - JSON string to import
 * @param adminEmail - Admin email for authentication (required for POST)
 */
export async function importPricing(
  jsonString: string,
  adminEmail?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { success: false, error: "Invalid format: must be an object" };
    }
    
    const validated: PricingMap = {};
    for (const [planCode, price] of Object.entries(parsed)) {
      if (typeof planCode !== "string") {
        return { success: false, error: `Invalid plan code: ${planCode} must be a string` };
      }
      const num = Number(price);
      if (isNaN(num) || num < 0) {
        return { success: false, error: `Invalid price for ${planCode}: must be a positive number` };
      }
      validated[planCode] = num;
    }
    
    await savePricing(validated, adminEmail);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}


