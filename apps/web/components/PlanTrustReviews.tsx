"use client";

import { useEffect, useState } from "react";
import { Star, Globe, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { generateReviews, ReviewData } from "@/lib/mock-reviews";

interface PlanTrustReviewsProps {
  planId: string;
}

export function PlanTrustReviews({ planId }: PlanTrustReviewsProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const totalCount = 3242; // Consistent total count

  useEffect(() => {
    // In a real app, you would filter by planId if available, 
    // or fallback to global reviews.
    // Since we are standardizing on the trustworthy global set:
    const allReviews = generateReviews(totalCount);
    
    // Pick 3 high quality reviews to show
    // Deterministic slice based on planId would be better, but random is okay for now
    // Let's filter for English and high rating for the widget
    const highQuality = allReviews
      .filter(r => r.rating >= 4 && r.comment && r.comment.length > 30 && r.language === 'en')
      .slice(0, 3);
      
    setReviews(highQuality);
    setLoading(false);
  }, [planId]);

  if (loading) {
    return (
      <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <div className="mt-8 bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Trusted Worldwide
          </h3>
          <div className="flex items-center gap-2 mt-1">
             <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
             </div>
             <span className="text-sm font-bold text-gray-900">4.8/5</span>
             <span className="text-xs text-gray-500">
               ({totalCount.toLocaleString()} reviews)
             </span>
          </div>
        </div>
        <Link 
          href="/reviews" 
          className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="space-y-3">
         {reviews.map(review => (
            <div key={review.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center gap-2 mb-2">
                 <div className="bg-gray-100 p-1 rounded-full">
                   <User className="w-3 h-3 text-gray-500" />
                 </div>
                 <span className="text-xs font-bold text-gray-900">{review.author || "Verified Customer"}</span>
                 {review.verified && (
                   <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">Verified</span>
                 )}
               </div>
               <p className="text-sm text-gray-600 leading-relaxed">
                 "{review.comment}"
               </p>
            </div>
         ))}
      </div>
    </div>
  );
}
