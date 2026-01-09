"use client";

import { useEffect, useState } from "react";
import { Star, Globe, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { generateReviews, ReviewData, isMediumOrLongReview } from "@/lib/mock-reviews";
import { safeFetch } from "@/lib/safe-fetch";
import { decodeHtmlEntities } from "@/lib/utils";

interface PlanTrustReviewsProps {
  planId: string;
}

interface ApiReview {
  id: string;
  planId: string | null;
  userName: string;
  rating: number;
  comment: string | null;
  language: string | null;
  source: string | null;
  verified: boolean;
  date: string;
}

export function PlanTrustReviews({ planId }: PlanTrustReviewsProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(3242);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        // Use the same data source as /reviews page
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        // Fetch real review count
        const countData = await safeFetch<{ count: number }>(`${apiUrl}/reviews/count`, { showToast: false });
        const realCount = countData?.count || 0;
        
        // Generate mock reviews (same as reviews page)
        const BASE_MOCK_COUNT = 3242;
        const mockReviews = generateReviews(BASE_MOCK_COUNT);
        
        // Fetch real reviews (same as reviews page)
        let realReviews: ReviewData[] = [];
        try {
          const apiData = await safeFetch<ApiReview[]>(`${apiUrl}/reviews/all`, { showToast: false });
          realReviews = (apiData || []).map((review): ReviewData => ({
            id: review.id,
            rating: review.rating,
            date: review.date,
            comment: review.comment || undefined,
            language: review.language || undefined,
            source: (review.source as 'purchase' | 'survey' | 'support') || 'purchase',
            verified: review.verified,
            author: review.userName || 'Anonymous'
          }));
        } catch (error) {
          console.error("Failed to fetch real reviews:", error);
        }
        
        // Merge and sort by date (same as reviews page)
        const allReviews = [...realReviews, ...mockReviews].sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        // Filter for medium/long reviews only
        const mediumLongReviews = allReviews.filter(r => isMediumOrLongReview(r));
        
        // Select 3 reviews with diverse usernames
        // Strategy: Randomize selection from top 20 latest reviews to show variety
        const topReviews = mediumLongReviews.slice(0, 20); // Get top 20 latest
        const selectedReviews: ReviewData[] = [];
        const seenAuthors = new Set<string>();
        
        // Shuffle the top reviews to get variety (but keep real reviews prioritized)
        const realTopReviews = topReviews.filter(r => !r.id.startsWith('mock-'));
        const mockTopReviews = topReviews.filter(r => r.id.startsWith('mock-'));
        
        // Combine: real reviews first, then shuffled mock reviews
        const shuffledMock = [...mockTopReviews].sort(() => Math.random() - 0.5);
        const pool = [...realTopReviews, ...shuffledMock];
        
        // Select 3 reviews ensuring diverse authors
        for (const review of pool) {
          if (selectedReviews.length >= 3) break;
          
          const authorKey = review.author?.toLowerCase() || 'anonymous';
          
          // Prefer reviews with different authors
          if (!seenAuthors.has(authorKey)) {
            selectedReviews.push(review);
            seenAuthors.add(authorKey);
          } else if (selectedReviews.length < 2) {
            // Allow one duplicate author if we need more reviews
            selectedReviews.push(review);
          }
        }
        
        // If we still need more reviews, fill with any from the pool
        if (selectedReviews.length < 3) {
          for (const review of pool) {
            if (selectedReviews.length >= 3) break;
            if (!selectedReviews.find(r => r.id === review.id)) {
              selectedReviews.push(review);
            }
          }
        }
        
        // Update total count (real + mock)
        setTotalCount(realCount + BASE_MOCK_COUNT);
        setReviews(selectedReviews.slice(0, 3));
      } catch (error) {
        console.error("Failed to load reviews:", error);
        // Fallback to mock reviews
        const allMockReviews = generateReviews(3242);
        const mediumLongReviews = allMockReviews
          .filter(r => isMediumOrLongReview(r))
          .slice(0, 3);
        setReviews(mediumLongReviews);
      } finally {
        setLoading(false);
      }
    };
    
    loadReviews();
    
    // Refresh every 30 seconds to get latest reviews
    const interval = setInterval(loadReviews, 30000);
    return () => clearInterval(interval);
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
                 <span className="text-xs font-bold text-gray-900">{review.author || "Anonymous"}</span>
                 {review.verified && (
                   <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">Verified</span>
                 )}
               </div>
               <p className="text-sm text-gray-600 leading-relaxed">
                 "{decodeHtmlEntities(review.comment || '')}"
               </p>
            </div>
         ))}
      </div>
    </div>
  );
}
