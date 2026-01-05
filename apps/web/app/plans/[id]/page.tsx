"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanDetails } from "@/components/PlanDetails";
import { PlanDetailsSkeleton } from "@/components/skeletons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { safeFetch } from "@/lib/safe-fetch";
import { useParams, useRouter } from "next/navigation";
import { fetchDiscounts } from "@/lib/admin-discounts";
import { getSlugFromCode } from "@/lib/country-slugs";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { isDailyUnlimitedPlan } from "@/lib/plan-utils";
import { getPlanFlagLabels } from "@/lib/plan-flags";

export default function PlanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch discounts on mount
  useEffect(() => {
    fetchDiscounts().catch(console.error);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchPlan = async () => {
      try {
        const data = await safeFetch<any>(`${apiUrl}/plans/${id}`, { showToast: false });
        setPlan(data);
        
        // Add to recently viewed
        if (data) {
          addRecentlyViewed({
            id: data.packageCode || id,
            type: 'plan',
            name: data.name || id,
            href: `/plans/${id}`,
          });
        }
      } catch (error) {
        console.error("Failed to fetch plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id, apiUrl]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PlanDetailsSkeleton />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h1 className="text-2xl font-bold text-black mb-4">Plan Not Found</h1>
          <p className="text-gray-500 mb-6">The plan you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <Button className="font-bold uppercase rounded-full bg-black hover:bg-gray-800 text-white px-8">Browse Plans</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Determine back URL: if location is multi-country (has comma), use router.back()
  // Otherwise, convert single country code to slug
  const getBackUrl = () => {
    if (!plan.location) return '/';
    
    // If location contains comma, it's multi-country - use router.back()
    if (plan.location.includes(',')) {
      return null; // Will use router.back() instead
    }
    
    // Single country - convert to slug
    const slug = getSlugFromCode(plan.location);
    return slug ? `/countries/${slug}` : '/';
  };

  const backUrl = getBackUrl();
  const useBackNavigation = backUrl === null;

  const handleBackClick = (e: React.MouseEvent) => {
    if (useBackNavigation) {
      e.preventDefault();
      router.back();
    }
  };

  // Format breadcrumb label - remove "2GB" and replace with "Unlimited" for unlimited plans
  const getBreadcrumbLabel = () => {
    if (!plan) return id;
    
    const isUnlimitedPlan = isDailyUnlimitedPlan(plan);
    const flagInfo = getPlanFlagLabels(plan);
    let name = flagInfo.cleanedName || plan.name;
    
    if (isUnlimitedPlan) {
      name = name
        .replace(/\b2\s*gb\b/gi, 'Unlimited')
        .replace(/\b2gb\b/gi, 'Unlimited')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return name;
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Plans', href: '/' },
          { label: getBreadcrumbLabel() },
        ]}
      />
      
      <PlanDetails plan={plan} />
    </div>
  );
}
