"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdminLog {
  id: string;
  action: string;
  adminEmail: string;
  entityType: string;
  entityId: string;
  data: any;
  createdAt: string;
}

interface WebhookEvent {
  id: string;
  source: string;
  payload: any;
  processed: boolean;
  createdAt: string;
}

interface LogsData {
  adminLogs: AdminLog[];
  webhookEvents: WebhookEvent[];
}

export default function AdminLogsPage() {
  const { user } = useUser();
  const [logs, setLogs] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"admin" | "webhooks">("admin");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/logs?limit=100`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLogs();
    }
  }, [user, apiUrl]);

  if (loading || !logs) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 font-mono font-bold uppercase">Loading logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">Logs</h1>
        <p className="text-gray-600 font-mono font-bold uppercase text-sm">
          View admin actions and webhook events
        </p>
      </div>

      <div className="flex gap-2 border-b-2 border-black bg-white">
        <button
          onClick={() => setActiveTab("admin")}
          className={`px-6 py-3 font-black uppercase text-sm transition-all border-b-4 ${
            activeTab === "admin"
              ? "text-black border-primary bg-secondary"
              : "text-gray-500 border-transparent hover:text-black hover:bg-gray-50"
          }`}
        >
          Admin Logs ({logs.adminLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`px-6 py-3 font-black uppercase text-sm transition-all border-b-4 ${
            activeTab === "webhooks"
              ? "text-black border-primary bg-secondary"
              : "text-gray-500 border-transparent hover:text-black hover:bg-gray-50"
          }`}
        >
          Webhook Events ({logs.webhookEvents.length})
        </button>
      </div>

      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {activeTab === "admin" ? (
              <div className="space-y-2 p-4">
                {logs.adminLogs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 font-mono uppercase font-bold">
                    No admin logs found
                  </p>
                ) : (
                  logs.adminLogs.map((log) => (
                    <details
                      key={log.id}
                      className="p-4 bg-white border-2 border-black shadow-sm group open:bg-secondary transition-colors"
                    >
                      <summary className="cursor-pointer flex items-center justify-between list-none">
                        <div>
                          <span className="text-black font-black uppercase text-sm">{log.action}</span>
                          <span className="text-gray-500 text-xs font-mono ml-2">
                            {log.entityType} • {log.entityId.substring(0, 8)}...
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-[10px] rounded-none border border-black bg-white text-black uppercase font-bold shadow-sm">{log.adminEmail}</Badge>
                          <span className="text-[10px] text-gray-500 font-mono uppercase">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </summary>
                      <div className="mt-4 pt-4 border-t-2 border-dashed border-black">
                        <pre className="text-xs text-black font-mono overflow-auto p-4 bg-gray-50 border border-gray-200 rounded-none">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </div>
                    </details>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {logs.webhookEvents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 font-mono uppercase font-bold">
                    No webhook events found
                  </p>
                ) : (
                  logs.webhookEvents.map((event) => (
                    <details
                      key={event.id}
                      className="p-4 bg-white border-2 border-black shadow-sm group open:bg-secondary transition-colors"
                    >
                      <summary className="cursor-pointer flex items-center justify-between list-none">
                        <div>
                          <span className="text-black font-black uppercase text-sm">{event.source}</span>
                          <Badge
                            className={`ml-2 rounded-none border uppercase font-bold text-[10px] shadow-sm ${
                              event.processed
                                ? "bg-green-400 text-black border-green-600"
                                : "bg-yellow-400 text-black border-yellow-600"
                            }`}
                          >
                            {event.processed ? "Processed" : "Pending"}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono uppercase">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </summary>
                      <div className="mt-4 pt-4 border-t-2 border-dashed border-black">
                        <pre className="text-xs text-black font-mono overflow-auto p-4 bg-gray-50 border border-gray-200 rounded-none">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </div>
                    </details>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
