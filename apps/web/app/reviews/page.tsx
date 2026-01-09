"use client";

import { useState, useMemo, useEffect } from "react";
import { Star, CheckCircle2, Globe, MessageSquare, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateReviews, ReviewData } from "@/lib/mock-reviews";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TOTAL_REVIEWS_COUNT = 3242;
const ITEMS_PER_PAGE = 20;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterTextOnly, setFilterTextOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Initialize reviews on mount (client-side only to avoid hydration mismatch with randoms)
  useEffect(() => {
    setReviews(generateReviews(TOTAL_REVIEWS_COUNT));
  }, []);

  const averageRating = 4.8; // Hardcoded to match the "Trust" requirement

  // Filter Logic
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (filterRating && review.rating !== filterRating) return false;
      if (filterTextOnly && !review.comment) return false;
      return true;
    });
  }, [reviews, filterRating, filterTextOnly]);

  const displayedReviews = filteredReviews.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
          
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-5xl font-bold text-gray-900">{averageRating}</span>
              <div className="flex flex-col items-start">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-6 h-6 fill-current",
                        star <= Math.round(averageRating)
                          ? "text-primary"
                          : "text-gray-200"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">out of 5 stars</span>
              </div>
            </div>
            <p className="text-gray-600 font-medium">
              Based on <span className="text-gray-900 font-bold">{TOTAL_REVIEWS_COUNT.toLocaleString()}+</span> ratings and feedback
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm sticky top-4 z-10">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterRating === null && !filterTextOnly ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilterRating(null); setFilterTextOnly(false); }}
              className="rounded-full"
            >
              All Reviews
            </Button>
            <Button
              variant={filterTextOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterTextOnly(!filterTextOnly)}
              className="rounded-full space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>With Text</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Star Rating {filterRating ? `(${filterRating}★)` : ""}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterRating(null)}>All Ratings</DropdownMenuItem>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <DropdownMenuItem key={rating} onClick={() => setFilterRating(rating)}>
                    {rating} Stars
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="text-sm text-gray-500">
            Showing {displayedReviews.length} of {filteredReviews.length}
          </div>
        </div>

        {/* Review List */}
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {displayedReviews.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No reviews found matching your filters.
            </div>
          )}
        </div>

        {/* Load More */}
        {visibleCount < filteredReviews.length && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadMore}
              className="min-w-[200px]"
            >
              Load More Reviews
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewData }) {
  // Format date: "Jan 9, 2024"
  const dateFormatted = new Date(review.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4 fill-current",
                  star <= review.rating ? "text-primary" : "text-gray-200"
                )}
              />
            ))}
          </div>
          {review.verified && (
            <div className="flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified Purchase
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400">{dateFormatted}</span>
      </div>

      {review.comment ? (
        <div className="space-y-2">
          <p className="text-gray-800 leading-relaxed text-sm md:text-base">
            {review.comment}
          </p>
          {review.language && review.language !== 'en' && (
            <div className="flex items-center text-xs text-gray-400 mt-2">
              <Globe className="w-3 h-3 mr-1" />
              <span className="uppercase">{review.language}</span>
              <span className="mx-2">•</span>
              <span className="cursor-pointer hover:text-gray-600 underline decoration-dotted">
                Translate
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">
          Customer rated this product but did not leave a comment.
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
         <span className="text-xs font-medium text-gray-500">
            {review.author}
         </span>
         {review.source === 'support' && (
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
               Via Support Survey
            </span>
         )}
      </div>
    </div>
  );
}
