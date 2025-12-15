"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { AdminTable } from "@/components/admin/AdminTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FileText } from "lucide-react";

interface Affiliate {
  id: string;
  referralCode: string;
  totalCommission: number;
  createdAt: string;
  User: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  _count: {
    referrals: number;
    commissions: number;
  };
}

export default function AdminAffiliatesPage() {
  const { user } = useUser();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/affiliates?page=${pagination.page}&limit=${pagination.limit}`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setAffiliates(data.affiliates || []);
          setPagination(data.pagination || pagination);
        }
      } catch (error) {
        console.error("Failed to fetch affiliates:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAffiliates();
    }
  }, [user, pagination.page, apiUrl]);

  const columns = useMemo(() => {
    const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return [
      {
        header: "User Email",
        accessor: (row: Affiliate) => row.User?.email || "N/A",
        className: "text-black",
      },
      {
        header: "Name",
        accessor: (row: Affiliate) => row.User?.name || "N/A",
        className: "text-gray-600",
      },
      {
        header: "Referral Code",
        accessor: (row: Affiliate) => row.referralCode || "N/A",
        className: "font-mono font-bold text-black",
      },
      {
        header: "Total Commission",
        accessor: (row: Affiliate) => formatCurrency(row.totalCommission || 0),
        className: "font-black text-green-600",
      },
      {
        header: "Referrals",
        accessor: (row: Affiliate) => (row._count?.referrals || 0).toString(),
        className: "text-center font-bold text-black",
      },
      {
        header: "Commissions",
        accessor: (row: Affiliate) => (row._count?.commissions || 0).toString(),
        className: "text-center font-bold text-black",
      },
      {
        header: "Created",
        accessor: (row: Affiliate) => row.createdAt ? formatDate(row.createdAt) : "N/A",
        className: "text-xs font-mono text-gray-500",
      },
    ];
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 font-mono font-bold uppercase">Loading affiliates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">Affiliates</h1>
          <p className="text-gray-600 font-mono font-bold uppercase text-sm">View all affiliates and their performance</p>
        </div>
        <Link 
          href="/support/affiliate-terms" 
          target="_blank"
          className="text-sm text-primary hover:underline flex items-center gap-1 font-bold uppercase"
        >
          <FileText className="h-4 w-4" />
          Affiliate Terms
        </Link>
      </div>

      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-secondary border-b-2 border-black p-6">
          <CardTitle className="text-black font-black uppercase">All Affiliates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {affiliates.length === 0 ? (
            <p className="text-center text-gray-500 py-8 font-mono uppercase font-bold">No affiliates found</p>
          ) : (
            <AdminTable data={affiliates} columns={columns} emptyMessage="No affiliates found" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
