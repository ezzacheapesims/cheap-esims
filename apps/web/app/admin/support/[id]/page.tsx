"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Mail, Smartphone, Calendar, User } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface SupportTicketReply {
  id: string;
  message: string;
  isAdmin: boolean;
  adminEmail?: string | null;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  orderId: string | null;
  device: string | null;
  message: string;
  createdAt: string;
  SupportTicketReply: SupportTicketReply[];
}

export default function AdminSupportTicketDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    if (user && params.id) {
      fetchTicket();
    }
  }, [user, params.id]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const data = await safeFetch<SupportTicket>(
        `${apiUrl}/admin/support/tickets/${params.id}`,
        {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        }
      );
      setTicket(data);
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
      toast({
        title: "Error",
        description: "Failed to load ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    setReplying(true);
    try {
      await safeFetch(
        `${apiUrl}/admin/support/tickets/${params.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          body: JSON.stringify({
            message: replyMessage,
          }),
        }
      );

      toast({
        title: "Reply sent",
        description: "Your reply has been sent to the customer.",
      });

      setReplyMessage("");
      fetchTicket(); // Refresh ticket to show new reply
    } catch (error: any) {
      console.error("Failed to send reply:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReplying(false);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 font-mono font-bold uppercase">Loading ticket...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/support")}
          className="text-gray-500 hover:text-black font-mono uppercase font-bold text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">Support Ticket</h1>
          <p className="text-gray-600 font-mono font-bold uppercase text-sm">Ticket ID: {ticket.id.substring(0, 8)}...</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                Name
              </p>
              <p className="text-black font-bold text-lg">{ticket.name}</p>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </p>
              <a href={`mailto:${ticket.email}`} className="text-primary hover:text-black hover:underline font-bold text-lg">
                {ticket.email}
              </a>
            </div>
            {ticket.orderId && (
              <div>
                <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Order ID</p>
                <Link href={`/admin/orders/${ticket.orderId}`} className="text-primary hover:text-black hover:underline font-mono font-bold text-sm">
                  {ticket.orderId}
                </Link>
              </div>
            )}
            {ticket.device && (
              <div>
                <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Device
                </p>
                <p className="text-black font-bold">{ticket.device}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Submitted
              </p>
              <p className="text-black font-mono text-sm">{new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase">Original Message</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gray-50 p-4 border-2 border-black rounded-none shadow-sm">
              <p className="text-black whitespace-pre-wrap font-medium">{ticket.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Thread */}
      {ticket.SupportTicketReply && ticket.SupportTicketReply.length > 0 && (
        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase">Conversation ({ticket.SupportTicketReply.length} replies)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {ticket.SupportTicketReply.map((reply) => (
              <div
                key={reply.id}
                className={`p-4 border-2 shadow-sm ${
                  reply.isAdmin
                    ? "bg-primary/10 border-primary ml-12 rounded-tl-lg rounded-bl-lg rounded-br-lg"
                    : "bg-gray-50 border-black mr-12 rounded-tr-lg rounded-bl-lg rounded-br-lg"
                }`}
              >
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-black/10">
                  <div className="flex items-center gap-2">
                    <Badge className={`rounded-none border-black font-bold uppercase text-[10px] ${reply.isAdmin ? "bg-primary text-black" : "bg-black text-white"}`}>
                      {reply.isAdmin ? `Admin${reply.adminEmail ? ` (${reply.adminEmail})` : ""}` : "Customer"}
                    </Badge>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-black whitespace-pre-wrap font-medium text-sm">{reply.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reply Form */}
      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-secondary border-b-2 border-black p-6">
          <CardTitle className="text-black font-black uppercase">Reply to Customer</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply here..."
            className="bg-white border-2 border-black rounded-none text-black min-h-[150px] font-medium shadow-inner p-4 focus:ring-primary"
          />
          <Button
            onClick={handleReply}
            disabled={replying || !replyMessage.trim()}
            className="bg-primary hover:bg-black hover:text-white text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all"
          >
            {replying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
