// Recently Viewed functionality using localStorage

const STORAGE_KEY = 'cheap-esims-recently-viewed';
const MAX_ITEMS = 10;

export interface RecentlyViewedItem {
  id: string;
  type: 'plan' | 'country';
  name: string;
  href: string;
  viewedAt: number;
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const items = JSON.parse(stored) as RecentlyViewedItem[];
    // Sort by viewedAt descending (most recent first)
    return items.sort((a, b) => b.viewedAt - a.viewedAt).slice(0, MAX_ITEMS);
  } catch (error) {
    console.error('Failed to get recently viewed:', error);
    return [];
  }
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getRecentlyViewed();
    
    // Remove duplicate if exists
    const filtered = existing.filter(i => i.id !== item.id);
    
    // Add new item at the beginning
    const updated: RecentlyViewedItem[] = [
      { ...item, viewedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to add recently viewed:', error);
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear recently viewed:', error);
  }
}

