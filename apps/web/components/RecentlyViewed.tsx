"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Package, Globe, X } from "lucide-react";
import { getRecentlyViewed, clearRecentlyViewed, type RecentlyViewedItem } from "@/lib/recently-viewed";
import { Button } from "@/components/ui/button";

export function RecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) {
    return null;
  }

  const handleClear = () => {
    clearRecentlyViewed();
    setItems([]);
  };

  return (
    <div className="bg-white border-2 border-black p-6 shadow-hard">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-black" />
          <h3 className="text-lg font-black uppercase text-black">Recently Viewed</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-xs font-mono font-bold uppercase text-gray-600 hover:text-black h-auto p-1"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-3 p-3 border border-gray-200 hover:bg-primary hover:border-black transition-colors group"
          >
            {item.type === 'plan' ? (
              <Package className="h-4 w-4 text-gray-500 group-hover:text-black flex-shrink-0" />
            ) : (
              <Globe className="h-4 w-4 text-gray-500 group-hover:text-black flex-shrink-0" />
            )}
            <span className="font-bold text-sm text-gray-700 group-hover:text-black truncate">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

