"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Filter, X, ChevronDown } from "lucide-react";

interface PlanBase {
  packageCode: string;
  price: number;
  volume: number;
  duration: number;
  [key: string]: any;
}

interface PlanListWithFiltersProps<T extends PlanBase> {
  plans: T[];
  renderItem: (plan: T) => React.ReactNode;
  emptyMessage?: string;
}

type SortOption = "price_asc" | "price_desc" | "data_asc" | "data_desc" | "duration_asc" | "duration_desc";
type DurationFilter = "all" | "1-7" | "8-15" | "16-30" | "30+";
type DataFilter = "all" | "under_3" | "3_10" | "10_plus" | "20_plus" | "50_plus";

export function PlanListWithFilters<T extends PlanBase>({ 
  plans, 
  renderItem, 
  emptyMessage = "No plans found matching your criteria." 
}: PlanListWithFiltersProps<T>) {
  const [sort, setSort] = useState<SortOption>("price_asc");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");
  const [dataFilter, setDataFilter] = useState<DataFilter>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const filteredPlans = useMemo(() => {
    let result = [...plans];

    // Filter by Duration
    if (durationFilter !== "all") {
      result = result.filter(plan => {
        const d = plan.duration;
        switch (durationFilter) {
          case "1-7": return d >= 1 && d <= 7;
          case "8-15": return d >= 8 && d <= 15;
          case "16-30": return d >= 16 && d <= 30;
          case "30+": return d > 30;
          default: return true;
        }
      });
    }

    // Filter by Data
    if (dataFilter !== "all") {
      result = result.filter(plan => {
        const gb = plan.volume / 1024 / 1024 / 1024;
        switch (dataFilter) {
          case "under_3": return gb < 3;
          case "3_10": return gb >= 3 && gb < 10;
          case "10_plus": return gb >= 10;
          case "20_plus": return gb >= 20;
          case "50_plus": return gb >= 50;
          default: return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "data_asc": return a.volume - b.volume;
        case "data_desc": return b.volume - a.volume;
        case "duration_asc": return a.duration - b.duration;
        case "duration_desc": return b.duration - a.duration;
        default: return 0;
      }
    });

    return result;
  }, [plans, sort, durationFilter, dataFilter]);

  const resetFilters = () => {
    setSort("price_asc");
    setDurationFilter("all");
    setDataFilter("all");
  };

  const activeFilterCount = (durationFilter !== "all" ? 1 : 0) + (dataFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Filter Bar - Modern Theme */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          
          {/* Sort Control */}
          <div className="flex items-center gap-2 min-w-fit">
            <ArrowDownUp className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">Sort by:</span>
            <div className="relative">
              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="appearance-none bg-white text-black text-sm font-medium border border-gray-200 pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="data_asc">Data: Low to High</option>
                <option value="data_desc">Data: High to Low</option>
                <option value="duration_asc">Duration: Short to Long</option>
                <option value="duration_desc">Duration: Long to Short</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            className="md:hidden flex items-center gap-2 ml-auto border border-gray-200 text-black font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="h-4 w-4" /> Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary text-black text-[10px] px-2 py-0.5 rounded-full font-medium">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Reset Button */}
        {(sort !== "price_asc" || durationFilter !== "all" || dataFilter !== "all") && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="text-gray-500 hover:text-black hover:bg-transparent font-medium text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <X className="h-4 w-4" /> Reset
          </Button>
        )}
      </div>

      {/* Mobile Filters Panel */}
      {isFiltersOpen && (
         <div className="md:hidden bg-white border border-gray-200 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 shadow-sm">
            <div className="space-y-2">
               <label className="text-xs text-gray-600 font-medium">Duration</label>
               <select 
                  value={durationFilter} 
                  onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
                  className="w-full bg-white text-black text-sm font-medium border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
               >
                  <option value="all">All Durations</option>
                  <option value="1-7">1 - 7 Days</option>
                  <option value="8-15">8 - 15 Days</option>
                  <option value="16-30">16 - 30 Days</option>
                  <option value="30+">30+ Days</option>
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-xs text-gray-600 font-medium">Data</label>
               <select 
                  value={dataFilter} 
                  onChange={(e) => setDataFilter(e.target.value as DataFilter)}
                  className="w-full bg-white text-black text-sm font-medium border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
               >
                  <option value="all">All Data Sizes</option>
                  <option value="under_3">&lt; 3 GB</option>
                  <option value="3_10">3 GB - 10 GB</option>
                  <option value="10_plus">10 GB+</option>
                  <option value="20_plus">20 GB+</option>
                  <option value="50_plus">50 GB+</option>
               </select>
            </div>
         </div>
      )}

      {/* Results Grid */}
      {filteredPlans.length === 0 ? (
         <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-500 font-medium">{emptyMessage}</p>
            <Button variant="link" onClick={resetFilters} className="mt-2 text-primary font-medium">
              Clear filters
            </Button>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredPlans.map((plan) => renderItem(plan))}
        </div>
      )}
    </div>
  );
}

