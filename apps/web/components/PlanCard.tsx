import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { useCurrency } from "./providers/CurrencyProvider";
import { getDiscount } from "@/lib/admin-discounts";
import { calculateFinalPrice, formatDataSize, calculateGB } from "@/lib/plan-utils";
import { Button } from "@/components/ui/button";

export interface Plan {
  packageCode: string;
  name: string;
  price: number;
  currencyCode?: string;
  volume: number;
  duration: number;
  durationUnit: string;
  speed: string;
  location: string;
  locationNetworkList?: { locationCode: string }[];
}

interface PlanCardProps {
  plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
  const { convert, formatCurrency } = useCurrency();
  const { value: sizeValue, unit: sizeUnit } = formatDataSize(plan.volume);
  const isUnlimited = plan.volume === -1;
  
  const sizeGB = calculateGB(plan.volume);
  const discountPercent = getDiscount(plan.packageCode, sizeGB);
  const basePriceUSD = plan.price || 0;
  const finalPriceUSD = calculateFinalPrice(basePriceUSD, discountPercent);
  const hasDiscount = discountPercent > 0;
  
  const convertedPrice = convert(finalPriceUSD);

  return (
    <Link href={`/plans/${plan.packageCode}`} className="block h-full group">
      <div className="h-full flex flex-col bg-white border-2 border-black shadow-hard hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all relative">
        
        {/* Discount Badge - Top Right */}
        {hasDiscount && (
           <div className="absolute -top-3 -right-3 bg-accent text-black border-2 border-black px-2 py-1 font-black text-xs transform rotate-3 shadow-sm z-10 animate-pulse">
              SAVE {discountPercent}%
           </div>
        )}

        {/* Top Section: Data Amount */}
        <div className="bg-secondary border-b-2 border-black p-4 text-center relative overflow-hidden">
           {hasDiscount && (
             <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 transform -rotate-2">
               HOT DEAL
             </div>
           )}
           <h3 className="text-4xl font-black tracking-tighter">
              {isUnlimited ? "UL" : sizeValue}<span className="text-xl">{sizeUnit}</span>
           </h3>
           <span className="text-xs font-mono uppercase text-gray-500 block mt-1">
              {plan.duration} {plan.durationUnit}s Validity
           </span>
        </div>

        {/* Middle Section: Details */}
        <div className="p-4 flex-grow flex flex-col justify-center text-center space-y-2">
           <p className="text-xs font-bold uppercase truncate px-2 bg-gray-100 py-1">
              {plan.name}
           </p>
           {plan.locationNetworkList && plan.locationNetworkList.length > 1 && (
             <p className="text-[10px] font-mono text-gray-500">
               + {plan.locationNetworkList.length} Regions
             </p>
           )}
        </div>

        {/* Bottom Section: Price & Action */}
        <div className="p-4 bg-black text-white group-hover:bg-primary group-hover:text-black transition-colors flex items-center justify-between relative overflow-hidden">
           {/* Background Pattern for Deal */}
           {hasDiscount && (
             <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-10 transition-opacity" />
           )}
           
           <div className="flex flex-col leading-none relative z-10 w-full">
              {hasDiscount ? (
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center gap-2 mb-1 w-full justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] line-through opacity-60">
                        {formatCurrency(convert(basePriceUSD))}
                        </span>
                        <span className="bg-accent text-black text-[9px] font-black px-1.5 rounded-sm uppercase tracking-tighter animate-bounce">
                        SALE
                        </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl font-bold text-white group-hover:text-black">
                        {formatCurrency(convertedPrice)}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase bg-white text-black px-1 border border-black transform rotate-2 group-hover:rotate-0 transition-transform">
                            -{discountPercent}%
                        </span>
                        <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                    <span className="text-xl font-bold">
                    {formatCurrency(convertedPrice)}
                    </span>
                    <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              )}
           </div>
        </div>
      </div>
    </Link>
  );
}
