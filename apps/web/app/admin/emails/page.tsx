"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/badge";

interface EmailLog {
  id: string;
  to: string;
  from: string;
  subject: string;
  template: string;
  providerId: string | null;
  status: string;
  error: string | null;
  createdAt: string;
}

export default function AdminEmailLogsPage() {
  const { user } = useUser();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, statusFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      params.append("limit", "100");

      const res = await fetch(`${apiUrl}/admin/email/logs?${params.toString()}`, {
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch email logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      sent: { label: "Sent", className: "bg-green-400 text-black border-green-600" },
      failed: { label: "Failed", className: "bg-red-500 text-white border-red-600" },
      mock: { label: "Mock", className: "bg-yellow-400 text-black border-yellow-600" },
      pending: { label: "Pending", className: "bg-blue-400 text-black border-blue-600" },
    };

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-200 text-gray-600 border-gray-400" };
    return <Badge className={`${statusInfo.className} rounded-none border uppercase font-bold text-[10px] shadow-sm`}>{statusInfo.label}</Badge>;
  };

  const columns = useMemo(() => [
    {
      header: "To",
      accessor: (row: EmailLog) => row.to,
      render: (row: EmailLog) => (
        <div className="truncate max-w-[180px] font-medium text-black" title={row.to}>
          {row.to}
        </div>
      ),
      className: "w-[150px]",
    },
    {
      header: "Subject",
      accessor: (row: EmailLog) => row.subject,
      render: (row: EmailLog) => (
        <div className="truncate max-w-[220px] text-gray-600" title={row.subject}>
          {row.subject}
        </div>
      ),
      className: "w-[150px]",
    },
    {
      header: "Template",
      accessor: (row: EmailLog) => row.template,
      className: "w-[100px] font-mono text-xs text-gray-500",
    },
    {
      header: "Status",
      accessor: (row: EmailLog) => row.status,
      render: (row: EmailLog) => getStatusBadge(row.status),
      className: "w-[80px]",
    },
    {
      header: "Provider ID",
      accessor: (row: EmailLog) => row.providerId || "",
      render: (row: EmailLog) =>
        row.providerId ? (
          <div className="font-mono text-xs truncate max-w-[120px] text-gray-500" title={row.providerId}>
            {row.providerId}
          </div>
        ) : (
          <span className="text-gray-300">—</span>
        ),
      className: "w-[120px]",
    },
    {
      header: "Error",
      accessor: (row: EmailLog) => row.error || "",
      render: (row: EmailLog) =>
        row.error ? (
          <div className="text-red-500 font-bold text-xs truncate max-w-[150px]" title={row.error}>
            {row.error}
          </div>
        ) : (
          <span className="text-gray-300">—</span>
        ),
      className: "w-[150px]",
    },
    {
      header: "Sent At",
      accessor: (row: EmailLog) =>
        new Date(row.createdAt).toLocaleString(),
      className: "w-[150px] text-xs font-mono text-gray-500",
    },
  ], []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 font-mono font-bold uppercase">Loading email logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">Email Logs</h1>
          <p className="text-gray-600 font-mono font-bold uppercase text-sm">
            View all email notification logs
          </p>
        </div>
        <div className="relative group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border-2 border-black rounded-none text-black font-mono uppercase font-bold focus:outline-none focus:border-primary shadow-hard-sm cursor-pointer appearance-none pr-8"
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="mock">Mock</option>
            <option value="pending">Pending</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
          </div>
        </div>
      </div>

      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-mono uppercase font-bold">No email logs found</p>
            </div>
          ) : (
            <AdminTable data={logs} columns={columns} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
