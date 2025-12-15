"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";

export default function AdminPayoutsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user, page, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const data = await safeFetch<any>(`${apiUrl}/admin/affiliate/payouts?${params}`, {
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
        showToast: false,
      });

      setRequests(data.requests || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error("Failed to fetch payout requests:", error);
      toast({
        title: "Error",
        description: "Failed to load payout requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm("Approve this payout request?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      await safeFetch(`${apiUrl}/admin/affiliate/payouts/${requestId}/approve`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      toast({
        title: "Success",
        description: "Payout request approved",
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve payout",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (requestId: string, note?: string) => {
    const adminNote = prompt("Enter decline reason (optional):");
    if (adminNote === null) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      await safeFetch(`${apiUrl}/admin/affiliate/payouts/${requestId}/decline`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNote: adminNote || undefined }),
      });

      toast({
        title: "Success",
        description: "Payout request declined",
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline payout",
        variant: "destructive",
      });
    }
  };

  const handleMarkPaid = async (requestId: string) => {
    if (!confirm("Mark this payout as paid? This action cannot be undone.")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      await safeFetch(`${apiUrl}/admin/affiliate/payouts/${requestId}/mark-paid`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      toast({
        title: "Success",
        description: "Payout marked as paid",
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark payout as paid",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-400 text-black border-yellow-500",
      approved: "bg-blue-400 text-black border-blue-500",
      declined: "bg-red-500 text-white border-red-600",
      paid: "bg-green-500 text-white border-green-600",
    };
    return (
      <Badge className={`${colors[status] || "bg-gray-500"} rounded-none border uppercase font-bold text-[10px] shadow-sm`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">Affiliate Payout Requests</h1>
        <p className="text-gray-600 font-mono font-bold uppercase text-sm">Manage affiliate payout requests</p>
      </div>

      <div className="mb-4 flex gap-4 items-center">
        <div className="relative group">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-white border-2 border-black rounded-none text-black font-mono uppercase font-bold focus:outline-none focus:border-primary shadow-hard-sm cursor-pointer appearance-none pr-8"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="paid">Paid</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
          </div>
        </div>
      </div>

      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-gray-500 py-12 font-mono uppercase font-bold">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-500 py-12 font-mono uppercase font-bold">No payout requests found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-black bg-secondary">
                      <th className="text-left py-3 px-4 text-xs font-black uppercase text-black">Affiliate</th>
                      <th className="text-left py-3 px-4 text-xs font-black uppercase text-black">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-black uppercase text-black">Payout Method</th>
                      <th className="text-left py-3 px-4 text-xs font-black uppercase text-black">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-black uppercase text-black">Requested</th>
                      <th className="text-left py-3 px-4 text-xs font-black uppercase text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {requests.map((request: any) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-black font-bold">
                              {request.affiliate?.user?.name || request.affiliate?.user?.email}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {request.affiliate?.user?.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-black font-black font-mono">
                          {formatCurrency(request.amountCents)}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs font-mono">
                          {request.affiliate?.payoutMethods?.[0] ? (
                            request.affiliate.payoutMethods[0].type === "paypal" ? (
                              `PayPal: ${request.affiliate.payoutMethods[0].paypalEmail}`
                            ) : (
                              `Bank: ${request.affiliate.payoutMethods[0].bankHolderName}`
                            )
                          ) : (
                            "Not configured"
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs font-mono">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(request.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-none font-bold uppercase text-[10px] h-8"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDecline(request.id)}
                                  className="border-red-500 text-red-500 hover:bg-red-50 rounded-none font-bold uppercase text-[10px] h-8"
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                            {request.status === "approved" && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkPaid(request.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-none font-bold uppercase text-[10px] h-8"
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                          {request.adminNote && (
                            <p className="text-xs text-red-500 mt-2 font-bold font-mono">
                              Note: {request.adminNote}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="p-4 border-t-2 border-black flex justify-between items-center bg-gray-50">
                  <p className="text-xs font-mono font-bold text-gray-500 uppercase">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="border-2 border-black rounded-none font-bold uppercase text-xs h-8 hover:bg-black hover:text-white"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                      className="border-2 border-black rounded-none font-bold uppercase text-xs h-8 hover:bg-black hover:text-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
