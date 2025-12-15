"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Mail, Calendar, MessageCircle, User } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { useToast } from "@/components/ui/use-toast";

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

export default function SupportTicketDetailPage() {
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
    if (user?.primaryEmailAddress?.emailAddress && params.id) {
      fetchTicket();
    }
  }, [user, params.id]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const data = await safeFetch<SupportTicket>(
        `${apiUrl}/support/tickets/${params.id}`,
        {
          headers: {
            "x-user-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        }
      );
      setTicket(data);
    } catch (error: any) {
      console.error("Failed to fetch ticket:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load ticket. Please try again.",
        variant: "destructive",
      });
      router.push("/account/support");
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

    if (replyMessage.trim().length < 10) {
      toast({
        title: "Error",
        description: "Message must be at least 10 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (replyMessage.trim().length > 1000) {
      toast({
        title: "Error",
        description: "Message must be no more than 1000 characters long.",
        variant: "destructive",
      });
      return;
    }

    setReplying(true);
    try {
      await safeFetch(
        `${apiUrl}/support/tickets/${params.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          body: JSON.stringify({
            message: replyMessage.trim(),
          }),
          errorMessage: "Failed to send reply. Please try again.",
        }
      );

      toast({
        title: "Success",
        description: "Your reply has been sent successfully.",
      });

      setReplyMessage("");
      // Refresh ticket to show new reply
      await fetchTicket();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-500 font-mono font-bold uppercase text-sm">Loading ticket...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/account/support">
          <Button
            variant="outline"
            className="bg-white border-2 border-black text-black hover:bg-black hover:text-white rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Support Ticket</h1>
          <p className="text-gray-500 font-mono text-sm uppercase font-bold">ID: {ticket.id.substring(0, 8)}...</p>
        </div>
      </div>

      {/* Original Message */}
      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-secondary border-b-2 border-black p-6">
          <CardTitle className="text-black font-black uppercase flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Your Message
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gray-50 border-2 border-black p-4 mb-6 relative">
            <div className="absolute -top-3 -left-2 bg-black text-white px-2 py-0.5 text-xs font-bold uppercase transform -rotate-2">
              Original Inquiry
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <Badge className="bg-black text-white hover:bg-black rounded-none font-bold uppercase border border-black">You</Badge>
              <span className="text-xs font-mono font-bold text-gray-500 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-black font-mono whitespace-pre-wrap text-sm leading-relaxed">{ticket.message}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ticket.orderId && (
              <div className="p-3 bg-white border-2 border-black shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Order ID</p>
                <p className="text-black font-mono font-bold">{ticket.orderId}</p>
              </div>
            )}
            {ticket.device && (
              <div className="p-3 bg-white border-2 border-black shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Device</p>
                <p className="text-black font-mono font-bold">{ticket.device}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-white border-b-2 border-black p-6">
          <CardTitle className="text-black font-black uppercase flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversation History ({ticket.SupportTicketReply?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6 bg-gray-50/50">
          {ticket.SupportTicketReply && ticket.SupportTicketReply.length > 0 ? (
            ticket.SupportTicketReply.map((reply) => (
              <div
                key={reply.id}
                className={`flex flex-col ${reply.isAdmin ? "items-start" : "items-end"}`}
              >
                <div 
                  className={`max-w-[85%] border-2 border-black p-4 shadow-hard-sm ${
                    reply.isAdmin 
                      ? "bg-white rounded-tr-lg rounded-br-lg rounded-bl-lg" 
                      : "bg-primary text-black rounded-tl-lg rounded-bl-lg rounded-br-lg"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2 border-b border-black/10 pb-2">
                    <span className="font-black uppercase text-xs">
                      {reply.isAdmin ? (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-none h-5 px-1.5">SUPPORT</Badge>
                        </span>
                      ) : "You"}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{reply.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 bg-white">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-mono font-bold uppercase text-sm">No responses yet</p>
              <p className="text-gray-400 text-xs mt-1">Our team will get back to you shortly.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Form */}
      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-white border-b-2 border-black p-6">
          <CardTitle className="text-black font-black uppercase flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send a Reply
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="bg-white border-2 border-black text-black font-mono min-h-[150px] rounded-none focus:ring-0 focus:shadow-hard-sm transition-all p-4 resize-y"
              disabled={replying}
            />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className={`text-xs font-mono font-bold ${replyMessage.length > 1000 ? "text-red-500" : "text-gray-500"}`}>
                {replyMessage.length}/1000 characters
              </p>
              <Button
                onClick={handleReply}
                disabled={replying || !replyMessage.trim() || replyMessage.trim().length < 10}
                className="w-full sm:w-auto bg-black text-white hover:bg-white hover:text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all h-12 px-8"
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

