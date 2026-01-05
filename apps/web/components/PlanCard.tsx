import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { useCurrency } from "./providers/CurrencyProvider";
import { getDiscount } from "@/lib/admin-discounts";
import { calculateFinalPrice, formatDataSize, calculateGB, isDailyUnlimitedPlan } from "@/lib/plan-utils";
import { Button } from "@/components/ui/button";
import { getPlanFlagLabels } from "@/lib/plan-flags";
import { PlanFlags } from "./PlanFlags";
import { FlagIcon } from "./FlagIcon";

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
  const isUnlimitedPlan = isDailyUnlimitedPlan(plan); // 2GB + FUP1Mbps plans
  
  const sizeGB = calculateGB(plan.volume);
  const discountPercent = getDiscount(plan.packageCode, sizeGB);
  const basePriceUSD = plan.price || 0;
  
  // For Unlimited/Day Pass plans: plan.price is daily price, total = daily × duration
  // For regular plans: plan.price is total price
  const dailyPriceUSD = isUnlimitedPlan ? basePriceUSD : (basePriceUSD / (plan.duration || 1));
  const totalPriceUSD = isUnlimitedPlan ? (dailyPriceUSD * (plan.duration || 1)) : basePriceUSD;
  
  // Apply discount to daily price for Unlimited plans, then calculate total
  // For regular plans, apply discount to total price
  const discountedDailyPriceUSD = isUnlimitedPlan ? calculateFinalPrice(dailyPriceUSD, discountPercent) : dailyPriceUSD;
  const finalPriceUSD = isUnlimitedPlan 
    ? (discountedDailyPriceUSD * (plan.duration || 1))
    : calculateFinalPrice(totalPriceUSD, discountPercent);
  const hasDiscount = discountPercent > 0;
  
  const convertedPrice = convert(finalPriceUSD);

  // Extract flags and get cleaned name
  const flagInfo = getPlanFlagLabels(plan);
  let displayName = flagInfo.cleanedName || plan.name;
  
  // Replace "2GB" with "Unlimited" for unlimited plans (2GB + FUP1Mbps)
  if (isUnlimitedPlan) {
    displayName = displayName
      .replace(/\b2\s*gb\b/gi, 'Unlimited')
      .replace(/\b2gb\b/gi, 'Unlimited')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return (
    <Link href={`/plans/${plan.packageCode}`} className="block h-full group">
      <div className="h-full flex flex-col bg-white border-2 border-black rounded-xl overflow-hidden shadow-hard hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all relative">
        
        {/* Top Section: Data Amount & Validity */}
        <div className="bg-white p-6 text-center relative">
           {/* Hot Deal Badge */}
           {hasDiscount && (
             <div className="absolute top-4 left-0 bg-red-600 text-white text-[10px] font-black px-2 py-1 uppercase transform -rotate-2 shadow-sm z-10">
               HOT DEAL
             </div>
           )}

           {/* Save Percentage Badge */}
           {hasDiscount && (
             <div className="absolute -top-1 -right-1 bg-yellow-400 text-black border-2 border-black px-2 py-1 font-black text-xs transform rotate-3 z-10">
               SAVE {discountPercent}%
             </div>
           )}

           <h3 className="text-5xl font-black tracking-tighter text-black mb-1">
              {isUnlimited || isUnlimitedPlan ? "Unlimited" : `${sizeValue} ${sizeUnit}`}
           </h3>
           <span className="text-xs font-bold uppercase text-gray-400 tracking-widest">
              {plan.duration} Days Validity
           </span>
        </div>

        {/* Middle Section: Plan Name */}
        <div className="bg-gray-100 py-3 px-4 border-y-2 border-black/5 flex items-center justify-center">
           <p className="text-sm font-black uppercase truncate tracking-tight text-black">
              {displayName}
           </p>
        </div>

        {/* Bottom Section: Price & Action */}
        <div className={`p-4 ${hasDiscount ? 'bg-primary' : 'bg-black'} transition-colors flex items-center justify-between mt-auto`}>
           <div className="flex flex-col leading-none">
              {hasDiscount ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] line-through font-bold ${hasDiscount ? 'text-black/60' : 'text-gray-500'}`}>
                      {formatCurrency(convert(basePriceUSD))}
                    </span>
                    <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                      SALE
                    </span>
                  </div>
                  <span className={`text-2xl font-black ${hasDiscount ? 'text-black' : 'text-white'}`}>
                    {formatCurrency(convertedPrice)}
                  </span>
                </>
              ) : (
                 <span className="text-2xl font-black text-white">
                    {formatCurrency(convertedPrice)}
                 </span>
              )}
           </div>

           <div className="flex items-center gap-3">
              {hasDiscount && (
                <span className="bg-white border border-black text-black text-[10px] font-black px-1.5 py-0.5 transform -rotate-2">
                    -{discountPercent}%
                </span>
              )}
              <ArrowRight className={`h-6 w-6 ${hasDiscount ? 'text-black' : 'text-white'} transform group-hover:translate-x-1 transition-transform`} />
           </div>
        </div>
      </div>
    </Link>
  );
}
