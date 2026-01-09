"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Star, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "@/components/ui/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useRouter } from "next/navigation";

interface Review {
  id: string;
  planId: string;
  userName: string;
  rating: number;
  comment: string;
  verified: boolean;
  date: string;
}

export default function AdminReviewsPage() {
  const { user, isLoaded } = useUser();
  const { isAdmin } = useIsAdmin();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push('/');
      return;
    }

    const fetchReviews = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const data = await safeFetch<Review[]>(`${apiUrl}/admin/reviews`, {
          headers: {
            'x-admin-email': user?.primaryEmailAddress?.emailAddress || '',
          },
          showToast: false,
        });
        setReviews(data || []);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && isAdmin) {
      fetchReviews();
    }
  }, [user, isLoaded, isAdmin, router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await safeFetch(`${apiUrl}/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': user?.primaryEmailAddress?.emailAddress || '',
        },
        errorMessage: 'Failed to delete review',
      });

      setReviews(reviews.filter(r => r.id !== id));
      toast({
        title: "Review deleted",
        description: "The review has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Reviews Management</h1>
      </div>

      <Card className="bg-white border-2 border-black shadow-hard">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase">All Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-gray-500 font-mono">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-gray-500 font-mono">No reviews found.</div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="flex items-start justify-between p-4 bg-gray-50 border-2 border-gray-200 hover:border-black transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-lg text-black">{review.userName}</span>
                      <span className="text-xs text-gray-500 font-mono">({review.date})</span>
                      {review.verified && (
                        <span className="flex items-center gap-1 text-green-600 text-xs bg-green-100 px-2 py-0.5 border border-green-600 font-bold uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex text-primary">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-current" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <p className="text-gray-700 mt-2 font-mono text-sm">{review.comment}</p>
                    <p className="text-xs text-gray-500 font-mono uppercase">Plan: {review.planId}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(review.id)}
                    className="flex items-center gap-2 border-2 border-red-600 rounded-none font-bold uppercase"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}










