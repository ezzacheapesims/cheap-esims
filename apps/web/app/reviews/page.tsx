"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Star, CheckCircle2, Globe, MessageSquare, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateReviews, ReviewData } from "@/lib/mock-reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { safeFetch } from "@/lib/safe-fetch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TOTAL_REVIEWS_COUNT = 3242;
const ITEMS_PER_PAGE = 20;

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

export default function ReviewsPage() {
  const { user, isLoaded } = useUser();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterTextOnly, setFilterTextOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch and merge real reviews with generated ones
  useEffect(() => {
    const loadReviews = async () => {
      // Generate mock reviews
      const mockReviews = generateReviews(TOTAL_REVIEWS_COUNT);
      
      // Fetch real reviews from API
      let realReviews: ReviewData[] = [];
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const apiData = await safeFetch<ApiReview[]>(`${apiUrl}/reviews/all`, { showToast: false });
        
        // Convert API format to ReviewData format
        realReviews = (apiData || []).map((review): ReviewData => ({
          id: review.id,
          rating: review.rating,
          date: review.date, // Use actual date from database
          comment: review.comment || undefined,
          language: review.language || undefined,
          source: (review.source as 'purchase' | 'survey' | 'support') || 'purchase',
          verified: review.verified,
          author: review.userName || 'Anonymous'
        }));
      } catch (error) {
        console.error("Failed to fetch real reviews:", error);
        // Continue with just mock reviews if API fails
      }
      
      // Merge and sort by date (newest first)
      const allReviews = [...realReviews, ...mockReviews].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setReviews(allReviews);
    };
    
    loadReviews();
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

  const handleSubmitReview = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to leave a review.", variant: "destructive" });
      return;
    }

    // Comment is optional - star-only reviews are valid
    if (comment.trim() && comment.trim().length < 2) {
      toast({ title: "Invalid comment", description: "Comment must be at least 2 characters if provided.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const userEmail = user.primaryEmailAddress?.emailAddress;
      
      if (!userEmail) {
        toast({ title: "Error", description: "User email not found. Please try signing in again.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      
      const userName = user.fullName || userEmail.split('@')[0] || 'Anonymous';
      
      await safeFetch(`${apiUrl}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({
          userName,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      toast({ title: "Review submitted", description: "Thank you for your review!" });
      setShowReviewDialog(false);
      setComment("");
      setRating(5);
      
      // Reload reviews to include the new one
      const apiData = await safeFetch<ApiReview[]>(`${apiUrl}/reviews/all`, { showToast: false });
      const realReviews = (apiData || []).map((review): ReviewData => ({
        id: review.id,
        rating: review.rating,
        date: review.date,
        comment: review.comment || undefined,
        language: review.language || undefined,
        source: (review.source as 'purchase' | 'survey' | 'support') || 'purchase',
        verified: review.verified,
        author: review.userName || 'Anonymous'
      }));
      
      const mockReviews = generateReviews(TOTAL_REVIEWS_COUNT);
      const allReviews = [...realReviews, ...mockReviews].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setReviews(allReviews);
      setVisibleCount(ITEMS_PER_PAGE); // Reset to show from top
    } catch (error: any) {
      console.error("Review submission error:", error);
      const errorMessage = error?.message || error?.cause?.message || "Failed to submit review.";
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
            {isLoaded && user && (
              <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary-dark font-bold rounded-lg" style={{ color: '#111827' }}>
                    Write Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border border-gray-200 shadow-xl rounded-xl max-w-md sm:rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900">Write a Review</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block text-gray-900">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transform hover:scale-110 transition-transform"
                          >
                            <Star
                              className={cn(
                                "h-8 w-8 transition-colors",
                                star <= rating
                                  ? "fill-primary text-primary"
                                  : "text-gray-300"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block text-gray-900">
                        Comment <span className="text-gray-500 font-normal">(optional)</span>
                      </label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this plan... (optional)"
                        className="min-h-[120px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-gray-900"
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {comment.length}/1000 characters - Star-only reviews are welcome!
                      </p>
                    </div>
                    <Button
                      onClick={handleSubmitReview}
                      disabled={submitting}
                      className="w-full bg-primary hover:bg-primary-dark text-gray-900 font-bold rounded-lg"
                    >
                      {submitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
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
              Based on <span className="text-gray-900 font-bold">{reviews.length.toLocaleString()}+</span> ratings and feedback
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
