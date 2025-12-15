"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Send, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function ContactSupportPage() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: user?.fullName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    orderId: "",
    device: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const deviceModels = [
    "iPhone 15 Pro Max",
    "iPhone 15 Pro",
    "iPhone 15",
    "iPhone 14 Pro Max",
    "iPhone 14 Pro",
    "iPhone 14",
    "iPhone 13 Pro Max",
    "iPhone 13 Pro",
    "iPhone 13",
    "iPhone 12 Pro Max",
    "iPhone 12 Pro",
    "iPhone 12",
    "Samsung Galaxy S24 Ultra",
    "Samsung Galaxy S24",
    "Samsung Galaxy S23 Ultra",
    "Samsung Galaxy S23",
    "Google Pixel 8 Pro",
    "Google Pixel 8",
    "Google Pixel 7 Pro",
    "Google Pixel 7",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError("Name is required");
        setLoading(false);
        return;
      }
      if (!formData.email.trim()) {
        setError("Email is required");
        setLoading(false);
        return;
      }
      if (!formData.message.trim()) {
        setError("Message is required");
        setLoading(false);
        return;
      }
      if (formData.message.trim().length < 10) {
        setError("Message must be at least 10 characters long");
        setLoading(false);
        return;
      }
      if (formData.message.trim().length > 1000) {
        setError("Message must be no more than 1000 characters long");
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      };

      // Only include optional fields if they have values
      if (formData.orderId && formData.orderId.trim()) {
        payload.orderId = formData.orderId.trim();
      }
      if (formData.device && formData.device.trim()) {
        payload.device = formData.device.trim();
      }

      await safeFetch(`${apiUrl}/support/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        errorMessage: "Failed to send message. Please try again.",
      });

      setSuccess(true);
      setFormData({
        name: user?.fullName || "",
        email: user?.primaryEmailAddress?.emailAddress || "",
        orderId: "",
        device: "",
        message: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen py-10 bg-background text-foreground">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="bg-green-100 p-4 rounded-full border-2 border-black w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                 <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-black text-black uppercase tracking-tighter mb-4">Message Sent!</h2>
              <p className="text-gray-600 font-mono mb-8 max-w-md mx-auto">
                We've received your message and will get back to you as soon as possible, usually within 24-48 hours.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/support">
                  <Button variant="outline" className="border-2 border-black rounded-none font-bold uppercase hover:bg-secondary">
                    Back to Support
                  </Button>
                </Link>
                <Link href="/">
                  <Button className="bg-primary hover:bg-black hover:text-white text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
                    Go Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/support" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 font-mono font-bold uppercase text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Support
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-2">Contact Support</h1>
          <p className="text-gray-500 font-mono font-bold uppercase text-sm">
            Send us a message and we'll get back to you
          </p>
        </div>

        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase text-xl flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Support Form
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-2 border-black p-4 flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-900 font-mono text-sm font-bold uppercase">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-black uppercase text-black mb-2">
                  Name <span className="text-red-600">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white border-2 border-black rounded-none shadow-sm focus-visible:ring-0 focus-visible:border-primary text-black placeholder:text-gray-400 font-mono"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-black uppercase text-black mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white border-2 border-black rounded-none shadow-sm focus-visible:ring-0 focus-visible:border-primary text-black placeholder:text-gray-400 font-mono"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="orderId" className="block text-sm font-black uppercase text-black mb-2">
                  Order ID <span className="text-gray-400 text-xs font-mono font-normal lowercase">(optional)</span>
                </label>
                <Input
                  id="orderId"
                  type="text"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  className="bg-white border-2 border-black rounded-none shadow-sm focus-visible:ring-0 focus-visible:border-primary text-black placeholder:text-gray-400 font-mono"
                  placeholder="Order ID if related to a purchase"
                />
              </div>

              <div>
                <label htmlFor="device" className="block text-sm font-black uppercase text-black mb-2">
                  Device Model <span className="text-gray-400 text-xs font-mono font-normal lowercase">(optional)</span>
                </label>
                <select
                  id="device"
                  value={formData.device}
                  onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                  className="w-full h-10 px-3 border-2 border-black bg-white text-black font-mono focus:outline-none focus:border-primary rounded-none shadow-sm cursor-pointer appearance-none"
                >
                  <option value="">Select device model</option>
                  {deviceModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-black uppercase text-black mb-2">
                  Message <span className="text-red-600">*</span>
                </label>
                <Textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-white border-2 border-black rounded-none shadow-sm focus-visible:ring-0 focus-visible:border-primary text-black placeholder:text-gray-400 font-mono min-h-[200px]"
                  placeholder="Please describe your issue or question in detail..."
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-black hover:text-white text-black border-2 border-black rounded-none font-black uppercase shadow-hard-sm hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
