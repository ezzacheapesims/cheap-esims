"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminTable } from "@/components/admin/AdminTable";
import { Search, Shield, AlertTriangle, XCircle, CheckCircle, User, Globe, CreditCard, Mail } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { safeFetch } from "@/lib/safe-fetch";

interface FraudSummary {
  affiliate: {
    id: string;
    referralCode: string;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  };
  fraudScore: {
    totalScore: number;
    riskLevel: string;
    updatedAt: string;
  };
  events: Array<{
    id: string;
    type: string;
    score: number;
    metadata: any;
    createdAt: string;
    userId: string | null;
    relatedId: string | null;
  }>;
  stats: {
    totalClicks: number;
    totalSignups: number;
    uniqueIPs: number;
    uniqueDevices: number;
    uniqueCountries: number;
    deviceCounts: Array<{ fingerprint: string; count: number }>;
    ips: string[];
    countries: string[];
  };
  signups: Array<{
    userId: string;
    userEmail: string;
    ipAddress: string | null;
    deviceFingerprint: string | null;
    country: string | null;
    createdAt: string;
  }>;
}

export default function AdminFraudDashboardPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [frozenFilter, setFrozenFilter] = useState<string>("");
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
  const [fraudDetails, setFraudDetails] = useState<FraudSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    searchAffiliates();
  }, [riskFilter, frozenFilter]);

  const searchAffiliates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.trim()) params.append("q", searchQuery.trim());
      if (riskFilter && riskFilter.trim()) params.append("riskLevel", riskFilter.trim());
      if (frozenFilter && frozenFilter.trim()) params.append("frozen", frozenFilter.trim());

      const queryString = params.toString();
      const url = queryString 
        ? `${apiUrl}/admin/affiliate/fraud/search?${queryString}`
        : `${apiUrl}/admin/affiliate/fraud/search`;

      const data = await safeFetch<{ affiliates: any[] }>(
        url,
        {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        },
      );

      setAffiliates(data.affiliates || []);
    } catch (error) {
      console.error("Failed to search affiliates:", error);
      toast({
        title: "Error",
        description: "Failed to search affiliates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFraudDetails = async (affiliateId: string) => {
    setDetailsLoading(true);
    setSelectedAffiliate(affiliateId);
    try {
      const data = await safeFetch<FraudSummary>(`${apiUrl}/admin/affiliate/fraud/${affiliateId}`, {
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      setFraudDetails(data);
    } catch (error) {
      console.error("Failed to load fraud details:", error);
      toast({
        title: "Error",
        description: "Failed to load fraud details",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const freezeAffiliate = async (affiliateId: string) => {
    try {
      await safeFetch(`${apiUrl}/admin/affiliate/fraud/${affiliateId}/freeze`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      toast({
        title: "Success",
        description: "Affiliate frozen",
      });

      if (selectedAffiliate === affiliateId) {
        loadFraudDetails(affiliateId);
      }
      searchAffiliates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to freeze affiliate",
        variant: "destructive",
      });
    }
  };

  const unfreezeAffiliate = async (affiliateId: string) => {
    try {
      await safeFetch(`${apiUrl}/admin/affiliate/fraud/${affiliateId}/unfreeze`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      toast({
        title: "Success",
        description: "Affiliate unfrozen",
      });

      if (selectedAffiliate === affiliateId) {
        loadFraudDetails(affiliateId);
      }
      searchAffiliates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unfreeze affiliate",
        variant: "destructive",
      });
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "frozen":
        return "bg-red-500 text-white border-red-600";
      case "high":
        return "bg-orange-500 text-white border-orange-600";
      case "medium":
        return "bg-yellow-400 text-black border-yellow-500";
      default:
        return "bg-green-500 text-white border-green-600";
    }
  };

  const formatFraudEventType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatFraudEventDetails = (metadata: any): string => {
    if (!metadata || typeof metadata !== 'object') {
      return 'No details available';
    }

    const details: string[] = [];
    
    if (metadata.deviceFingerprint) {
      details.push(`Device: ${metadata.deviceFingerprint.substring(0, 8)}...`);
    }
    
    if (metadata.ipAddress) {
      details.push(`IP: ${metadata.ipAddress}`);
    }
    
    if (metadata.otherAffiliateIds && Array.isArray(metadata.otherAffiliateIds)) {
      details.push(`Other Affiliates: ${metadata.otherAffiliateIds.length}`);
      if (metadata.otherAffiliateIds.length > 0) {
        details.push(`IDs: ${metadata.otherAffiliateIds.slice(0, 2).join(', ')}${metadata.otherAffiliateIds.length > 2 ? '...' : ''}`);
      }
    }
    
    if (metadata.email) {
      details.push(`Email: ${metadata.email}`);
    }
    
    if (metadata.cardLast4) {
      details.push(`Card: ****${metadata.cardLast4}`);
    }
    
    if (metadata.country) {
      details.push(`Country: ${metadata.country}`);
    }
    
    if (metadata.reason) {
      details.push(`Reason: ${metadata.reason}`);
    }
    
    if (metadata.count !== undefined) {
      details.push(`Count: ${metadata.count}`);
    }
    
    if (metadata.threshold !== undefined) {
      details.push(`Threshold: ${metadata.threshold}`);
    }

    // If we have other fields not covered above, include them
    const coveredKeys = ['deviceFingerprint', 'ipAddress', 'otherAffiliateIds', 'email', 'cardLast4', 'country', 'reason', 'count', 'threshold'];
    const otherKeys = Object.keys(metadata).filter(key => !coveredKeys.includes(key));
    
    if (otherKeys.length > 0 && details.length === 0) {
      // If no standard fields found, show a simplified version of the object
      return JSON.stringify(metadata, null, 2).substring(0, 150) + (JSON.stringify(metadata).length > 150 ? '...' : '');
    }

    return details.length > 0 ? details.join(' • ') : 'No details available';
  };

  const columns = useMemo(() => [
    {
      header: "Email",
      accessor: (row: any) => row.userEmail,
      className: "text-black",
    },
    {
      header: "Referral Code",
      accessor: (row: any) => row.referralCode,
      className: "font-mono font-bold text-black",
    },
    {
      header: "Risk Level",
      accessor: (row: any) => row.riskLevel.toUpperCase(),
      className: (row: any) => `${getRiskBadgeColor(row.riskLevel)} rounded-none border uppercase font-bold text-[10px] shadow-sm px-2 py-0.5 inline-block`,
    },
    {
      header: "Fraud Score",
      accessor: (row: any) => row.fraudScore.toString(),
      className: (row: any) => row.fraudScore >= 60 ? "text-red-600 font-black" : row.fraudScore >= 40 ? "text-orange-500 font-bold" : "text-green-600 font-bold",
    },
    {
      header: "Status",
      accessor: (row: any) => row.isFrozen ? "Frozen" : "Active",
      className: (row: any) => row.isFrozen ? "text-red-600 font-bold" : "text-green-600 font-bold",
    },
    {
      header: "Actions",
      accessor: (row: any) => row.isFrozen ? "Frozen - Click to manage" : "Active - Click to manage",
      className: "text-xs text-gray-500 font-mono",
    },
  ], []);

  const handleRowClick = useCallback((row: any) => {
    loadFraudDetails(row.id);
  }, [loadFraudDetails]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">Affiliate Fraud Dashboard</h1>
        <p className="text-gray-600 font-mono font-bold uppercase text-sm">Monitor and manage affiliate fraud detection</p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-secondary border-b-2 border-black p-6">
          <CardTitle className="text-black font-black uppercase">Search Affiliates</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by email, user ID, or referral code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchAffiliates();
                  }
                }}
                className="bg-white border-2 border-black rounded-none font-mono"
              />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-4 py-2 rounded-none bg-white border-2 border-black text-black font-mono uppercase font-bold focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="frozen">Frozen</option>
            </select>
            <select
              value={frozenFilter}
              onChange={(e) => setFrozenFilter(e.target.value)}
              className="px-4 py-2 rounded-none bg-white border-2 border-black text-black font-mono uppercase font-bold focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="true">Frozen Only</option>
              <option value="false">Active Only</option>
            </select>
            <Button onClick={searchAffiliates} className="bg-primary text-black hover:bg-black hover:text-white border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates List */}
      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-secondary border-b-2 border-black p-6">
          <CardTitle className="text-black font-black uppercase">Affiliates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-gray-500 py-12 font-mono uppercase font-bold">Loading...</p>
          ) : affiliates.length === 0 ? (
            <p className="text-center text-gray-500 py-12 font-mono uppercase font-bold">No affiliates found</p>
          ) : (
            <AdminTable
              data={affiliates}
              columns={columns}
              onRowClick={handleRowClick}
              emptyMessage="No affiliates found"
            />
          )}
        </CardContent>
      </Card>

      {/* Fraud Details */}
      {selectedAffiliate && (
        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase flex items-center justify-between">
              <span>Fraud Details</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedAffiliate(null);
                  setFraudDetails(null);
                }}
                className="hover:bg-black hover:text-white rounded-none"
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {detailsLoading ? (
              <p className="text-center text-gray-500 py-8 font-mono uppercase font-bold">Loading details...</p>
            ) : fraudDetails ? (
              <div className="space-y-6">
                {/* Fraud Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white border-2 border-black rounded-none shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Fraud Score</p>
                      <p className={`text-4xl font-black ${fraudDetails.fraudScore.totalScore >= 60 ? "text-red-600" : fraudDetails.fraudScore.totalScore >= 40 ? "text-orange-500" : "text-green-600"}`}>
                        {fraudDetails.fraudScore.totalScore}
                      </p>
                      <Badge className={`mt-2 rounded-none border uppercase font-bold text-[10px] shadow-sm ${getRiskBadgeColor(fraudDetails.fraudScore.riskLevel)}`}>
                        {fraudDetails.fraudScore.riskLevel.toUpperCase()}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-2 border-black rounded-none shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Total Events</p>
                      <p className="text-4xl font-black text-black">{fraudDetails.events.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-2 border-black rounded-none shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Signups</p>
                      <p className="text-4xl font-black text-black">{fraudDetails.stats.totalSignups}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Stats */}
                <div>
                  <h3 className="text-lg font-black text-black uppercase mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 border-2 border-black p-4">
                      <p className="text-xs font-mono font-bold text-gray-500 uppercase">Unique IPs</p>
                      <p className="text-xl font-black text-black">{fraudDetails.stats.uniqueIPs}</p>
                    </div>
                    <div className="bg-gray-50 border-2 border-black p-4">
                      <p className="text-xs font-mono font-bold text-gray-500 uppercase">Unique Devices</p>
                      <p className="text-xl font-black text-black">{fraudDetails.stats.uniqueDevices}</p>
                    </div>
                    <div className="bg-gray-50 border-2 border-black p-4">
                      <p className="text-xs font-mono font-bold text-gray-500 uppercase">Countries</p>
                      <p className="text-xl font-black text-black">{fraudDetails.stats.uniqueCountries}</p>
                    </div>
                    <div className="bg-gray-50 border-2 border-black p-4">
                      <p className="text-xs font-mono font-bold text-gray-500 uppercase">Total Clicks</p>
                      <p className="text-xl font-black text-black">{fraudDetails.stats.totalClicks}</p>
                    </div>
                  </div>
                </div>

                {/* Device Fingerprints */}
                {fraudDetails.stats.deviceCounts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-black text-black uppercase mb-4">Device Fingerprints</h3>
                    <div className="bg-white border-2 border-black p-4 space-y-2">
                      {fraudDetails.stats.deviceCounts
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10)
                        .map((device, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm border-b border-gray-100 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                            <code className="text-gray-600 font-mono text-xs truncate flex-1">
                              {device.fingerprint.substring(0, 32)}...
                            </code>
                            <Badge variant="outline" className="ml-4 rounded-none border-black font-mono">
                              {device.count} {device.count === 1 ? "use" : "uses"}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Fraud Events */}
                <div>
                  <h3 className="text-lg font-black text-black uppercase mb-4">Fraud Events</h3>
                  <div className="bg-white border-2 border-black overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-secondary border-b-2 border-black">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-black uppercase text-black">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-black uppercase text-black">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-black uppercase text-black">Score</th>
                          <th className="px-4 py-2 text-left text-xs font-black uppercase text-black">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {fraudDetails.events.slice(0, 50).map((event) => (
                          <tr key={event.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-xs font-mono text-gray-500">
                              {new Date(event.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <Badge variant="outline" className="text-[10px] rounded-none border-black uppercase font-bold">
                                {formatFraudEventType(event.type)}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-sm font-black text-black">{event.score}</td>
                            <td className="px-4 py-2 text-xs text-gray-600 font-mono max-w-md">
                              <div className="whitespace-normal break-words">
                                {formatFraudEventDetails(event.metadata)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signups List */}
                {fraudDetails.signups.length > 0 && (
                  <div>
                    <h3 className="text-lg font-black text-black uppercase mb-4">Recent Signups</h3>
                    <div className="bg-white border-2 border-black overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-secondary border-b-2 border-black">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-black uppercase text-black">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-black uppercase text-black">IP</th>
                            <th className="px-4 py-2 text-left text-xs font-black uppercase text-black">Country</th>
                            <th className="px-4 py-2 text-left text-xs font-black uppercase text-black">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {fraudDetails.signups.slice(0, 20).map((signup) => (
                            <tr key={signup.userId} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-black font-medium">{signup.userEmail}</td>
                              <td className="px-4 py-2 text-xs font-mono text-gray-500">
                                {signup.ipAddress || "N/A"}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">{signup.country || "N/A"}</td>
                              <td className="px-4 py-2 text-xs font-mono text-gray-500">
                                {new Date(signup.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8 font-mono uppercase font-bold">Failed to load fraud details</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
