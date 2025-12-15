"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Settings {
  mockMode: boolean;
  defaultMarkupPercent: number;
  defaultCurrency: string;
  adminEmails: string[];
  emailFrom?: string;
  emailProvider?: string;
  emailEnabled?: boolean;
}

export default function AdminSettingsPage() {
  const { user } = useUser();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/settings`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSettings();
    }
  }, [user, apiUrl]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        alert("Settings saved successfully");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 font-mono font-bold uppercase">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">Settings</h1>
        <p className="text-gray-600 font-mono font-bold uppercase text-sm">
          Configure admin panel and system settings
        </p>
      </div>

      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-secondary border-b-2 border-black p-6">
          <CardTitle className="text-black font-black uppercase">System Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.mockMode}
                onChange={(e) =>
                  setSettings({ ...settings, mockMode: e.target.checked })
                }
                className="w-5 h-5 border-2 border-black rounded-none text-black focus:ring-0 checked:bg-black checked:border-black appearance-none cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-1.5 after:w-1.5 after:h-3 after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:hidden checked:after:block"
              />
              <div>
                <p className="text-black font-bold uppercase text-sm">Mock Mode</p>
                <p className="text-xs text-gray-500 font-mono">
                  Enable mock mode for testing
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase mb-2">
              Default Markup Percent
            </label>
            <Input
              type="number"
              value={settings.defaultMarkupPercent}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultMarkupPercent: parseFloat(e.target.value) || 0,
                })
              }
              className="bg-white border-2 border-black rounded-none text-black shadow-sm font-mono"
              step="0.01"
            />
            <p className="text-xs text-gray-500 font-mono mt-1">
              Default markup percentage for pricing
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase mb-2">
              Default Currency
            </label>
            <Input
              type="text"
              value={settings.defaultCurrency}
              onChange={(e) =>
                setSettings({ ...settings, defaultCurrency: e.target.value })
              }
              className="bg-white border-2 border-black rounded-none text-black shadow-sm font-mono"
              placeholder="USD"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase mb-2">
              Admin Emails (comma-separated)
            </label>
            <textarea
              value={settings.adminEmails.join(", ")}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  adminEmails: e.target.value
                    .split(",")
                    .map((email) => email.trim())
                    .filter(Boolean),
                })
              }
              className="w-full px-3 py-2 bg-white border-2 border-black rounded-none text-black font-mono text-sm shadow-sm focus:outline-none focus:border-primary"
              rows={4}
            />
            <p className="text-xs text-gray-500 font-mono mt-1">
              List of admin email addresses
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-black hover:text-white text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-secondary border-b-2 border-black p-6">
          <CardTitle className="text-black font-black uppercase">Email Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.emailEnabled !== false}
                onChange={(e) =>
                  setSettings({ ...settings, emailEnabled: e.target.checked })
                }
                className="w-5 h-5 border-2 border-black rounded-none text-black focus:ring-0 checked:bg-black checked:border-black appearance-none cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-1.5 after:w-1.5 after:h-3 after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:hidden checked:after:block"
              />
              <div>
                <p className="text-black font-bold uppercase text-sm">Enable Email Notifications</p>
                <p className="text-xs text-gray-500 font-mono">
                  Send transactional emails for orders, eSIMs, and top-ups
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase mb-2">
              Email From Address
            </label>
            <Input
              type="email"
              value={settings.emailFrom || ""}
              onChange={(e) =>
                setSettings({ ...settings, emailFrom: e.target.value })
              }
              className="bg-white border-2 border-black rounded-none text-black shadow-sm font-mono"
              placeholder="no-reply@voyage.app"
            />
            <p className="text-xs text-gray-500 font-mono mt-1">
              Default sender email address for all notifications
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase mb-2">
              Email Provider
            </label>
            <select
              value={settings.emailProvider || "resend"}
              onChange={(e) =>
                setSettings({ ...settings, emailProvider: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border-2 border-black rounded-none text-black font-mono text-sm shadow-sm focus:outline-none focus:border-primary"
            >
              <option value="resend">Resend</option>
            </select>
            <p className="text-xs text-gray-500 font-mono mt-1">
              Email service provider for sending transactional emails
            </p>
          </div>

          <div className="pt-4 border-t-2 border-black">
            <h3 className="text-black font-black uppercase text-sm mb-4">Test Email</h3>
            <div className="flex gap-2">
              <Input
                type="email"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                placeholder="Enter email address to test"
                className="bg-white border-2 border-black rounded-none text-black flex-1 shadow-sm font-mono"
              />
              <Button
                onClick={async () => {
                  if (!testEmailTo) {
                    alert("Please enter an email address");
                    return;
                  }

                  // Validate email format
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(testEmailTo)) {
                    alert("Please enter a valid email address");
                    return;
                  }

                  setTestEmailSending(true);
                  try {
                    const res = await fetch(`${apiUrl}/admin/email/test`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
                      },
                      body: JSON.stringify({
                        to: testEmailTo,
                        template: "test-email",
                      }),
                    });

                    const data = await res.json();
                    if (res.ok) {
                      alert(
                        data.mock
                          ? "Test email sent (mock mode - no actual email)"
                          : data.success === false
                          ? `Email failed: ${data.error || "Unknown error"}`
                          : "Test email sent successfully!"
                      );
                    } else {
                      alert(`Failed to send test email: ${data.error || data.message || "Unknown error"}`);
                    }
                  } catch (error: any) {
                    console.error("Failed to send test email:", error);
                    alert(`Failed to send test email: ${error.message || "Unknown error"}`);
                  } finally {
                    setTestEmailSending(false);
                  }
                }}
                disabled={testEmailSending || !testEmailTo}
                className="bg-primary hover:bg-black hover:text-white text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all"
              >
                {testEmailSending ? "Sending..." : "Send Test Email"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
