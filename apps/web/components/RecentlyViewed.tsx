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
      <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 border-2 border-black">
            <Clock className="h-5 w-5 text-black" />
          </div>
          <h3 className="text-xl font-black uppercase text-black tracking-tighter">Recently Viewed</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-[10px] font-mono font-bold uppercase text-gray-500 hover:text-red-600 hover:bg-red-50 h-8 px-2 border border-transparent hover:border-red-200"
        >
          Clear History <X className="h-3 w-3 ml-1" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-3 p-3 border-2 border-gray-100 hover:border-black hover:bg-gray-50 hover:shadow-hard-sm transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gray-200 group-hover:bg-primary transition-colors" />
            
            {item.type === 'plan' ? (
              <Package className="h-5 w-5 text-gray-400 group-hover:text-black flex-shrink-0 ml-2" />
            ) : (
              <Globe className="h-5 w-5 text-gray-400 group-hover:text-black flex-shrink-0 ml-2" />
            )}
            
            <div className="min-w-0">
              <span className="block font-black text-sm text-gray-700 group-hover:text-black truncate uppercase tracking-tight">
                {item.name}
              </span>
              <span className="text-[10px] font-mono text-gray-400 group-hover:text-gray-600 uppercase">
                {item.type}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

