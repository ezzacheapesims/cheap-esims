"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { formatCurrency } from "@/lib/utils";

interface EmailPreviewProps {
  orderId: string;
  amount: number;
  currency: string;
}

interface EmailData {
  subject: string;
  html: string;
  text: string;
}

export function EmailPreview({ orderId, amount, currency }: EmailPreviewProps) {
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmailPreview = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const data = await safeFetch<EmailData>(
          `${apiUrl}/orders/${orderId}/email-preview`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency }),
            showToast: false,
          }
        );
        setEmailData(data);
      } catch (err: any) {
        // Handle 404 gracefully - endpoint not implemented yet
        if (err.status === 404 || err.message?.includes('404')) {
          setError('Email preview not available yet');
        } else {
          setError(err.message || 'Failed to load email preview');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmailPreview();
  }, [orderId, amount, currency]);

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500 text-center py-4">
            {error === 'Email preview not available yet' 
              ? 'Email preview feature is coming soon.'
              : error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!emailData) {
    return null;
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Email Preview
        </CardTitle>
        <p className="text-sm text-gray-500 font-normal mt-1">
          Subject: {emailData.subject}
        </p>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: emailData.html }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

