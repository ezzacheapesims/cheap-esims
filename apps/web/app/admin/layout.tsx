"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Smartphone,
  CreditCard,
  Users,
  Settings,
  FileText,
  Shield,
  ShieldX,
  Mail,
  MessageSquare,
  Wallet,
  Percent,
  ChevronDown,
  ChevronRight,
  Store,
  ChevronLeft,
  Menu
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Group expansion state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Store": true,
    "Affiliates": true,
    "System": true,
    "Users": true
  });

  const toggleGroup = (group: string) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      setExpandedGroups(prev => ({
        ...prev,
        [group]: true
      }));
    } else {
      setExpandedGroups(prev => ({
        ...prev,
        [group]: !prev[group]
      }));
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Check if user is admin via API (checks database first, then env vars)
    const checkAdmin = async () => {
      try {
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(`${apiUrl}/admin/check?email=${encodeURIComponent(userEmail)}`);

        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin === true);
        } else {
          // Fallback to env var check if API fails
          const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
          setIsAdmin(adminEmails.includes(userEmail.toLowerCase()));
        }
      } catch (error) {
        console.error("Admin check error:", error);
        // Fallback to env var check on error
        try {
          const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
          const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
          setIsAdmin(userEmail ? adminEmails.includes(userEmail) : false);
        } catch (fallbackError) {
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, isLoaded, router]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 font-mono font-bold uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md mx-auto p-8 border-2 border-black shadow-hard bg-white">
          <ShieldX className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-black uppercase mb-2">Access Denied</h1>
          <p className="text-gray-600 font-mono mb-6">
            You do not have permission to access the admin panel.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-black hover:bg-white hover:text-black hover:border-black text-white rounded-none border-2 border-transparent font-bold uppercase transition-all shadow-hard-sm hover:shadow-none"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const navStructure = [
    {
      type: "link",
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      type: "group",
      label: "Store",
      icon: Store,
      children: [
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
        { href: "/admin/esims", label: "eSIM Profiles", icon: Smartphone },
        { href: "/admin/topups", label: "Top-ups", icon: CreditCard },
      ]
    },
    {
      type: "group",
      label: "Users & Cash",
      icon: Users,
      children: [
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/vcash", label: "V-Cash", icon: Wallet },
      ]
    },
    {
      type: "group",
      label: "Affiliates",
      icon: Shield,
      children: [
        { href: "/admin/affiliates", label: "Overview", icon: Users },
        { href: "/admin/affiliate/payouts", label: "Payouts", icon: CreditCard },
        { href: "/admin/affiliate/fraud", label: "Fraud", icon: Shield },
      ]
    },
    {
      type: "group",
      label: "System",
      icon: Settings,
      children: [
        { href: "/admin/discounts", label: "Discounts", icon: Percent },
        { href: "/admin/pricing", label: "Pricing", icon: CreditCard },
        { href: "/admin/support", label: "Support Tickets", icon: MessageSquare },
        { href: "/admin/settings", label: "Settings", icon: Settings },
        { href: "/admin/emails", label: "Email Logs", icon: Mail },
        { href: "/admin/logs", label: "Logs", icon: FileText },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 bg-white border-r-2 border-black z-50 shadow-hard transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className={`p-4 border-b-2 border-black sticky top-0 bg-white z-10 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}>
          {!isSidebarCollapsed && (
            <Link
              href="/admin"
              className="text-xl font-black text-black uppercase tracking-tighter truncate"
            >
              Cheap eSIMs <span className="text-primary block text-xs font-mono tracking-widest">Admin</span>
            </Link>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
        
        <nav className="p-2 space-y-1 pb-24 font-mono text-sm overflow-y-auto h-[calc(100vh-80px)] scrollbar-hide">
          {navStructure.map((item, index) => {
            if (item.type === "link" && item.href) {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 border-2 border-transparent transition-all mb-1 uppercase font-bold group relative ${
                    isActive 
                      ? "bg-primary text-black border-black shadow-hard-sm" 
                      : "text-gray-600 hover:bg-gray-100 hover:text-black hover:border-black"
                  } ${isSidebarCollapsed ? "justify-center" : ""}`}
                  title={isSidebarCollapsed ? item.label : ""}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            } else if (item.type === "group" && item.children) {
              const Icon = item.icon;
              const isExpanded = expandedGroups[item.label];
              const isActiveGroup = item.children.some(child => pathname === child.href);
              
              return (
                <div key={item.label} className="mb-2">
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-3 border-2 border-transparent transition-all uppercase font-bold ${
                      isActiveGroup && !isExpanded
                        ? "text-black bg-gray-100 border-black"
                        : "text-gray-600 hover:bg-gray-100 hover:text-black hover:border-black"
                    } ${isSidebarCollapsed ? "justify-center" : ""}`}
                    title={isSidebarCollapsed ? item.label : ""}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!isSidebarCollapsed && <span className="font-bold">{item.label}</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )
                    )}
                  </button>
                  
                  {isExpanded && !isSidebarCollapsed && (
                    <div className="ml-4 pl-4 border-l-2 border-black mt-2 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center gap-3 px-4 py-2 border-2 border-transparent text-xs transition-all uppercase font-bold ${
                              isChildActive
                                ? "bg-black text-white border-black shadow-sm"
                                : "text-gray-500 hover:text-black hover:bg-gray-100 hover:border-black"
                            }`}
                          >
                            <ChildIcon className="h-4 w-4" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </nav>
        
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t-2 border-black bg-secondary transition-all duration-300 ${isSidebarCollapsed ? "px-2" : "p-4"}`}>
          <Link
            href="/"
            className={`block text-center border-2 border-black bg-white text-black font-bold uppercase text-xs hover:bg-black hover:text-white transition-all shadow-hard-sm hover:shadow-none flex items-center justify-center gap-2 ${isSidebarCollapsed ? "p-2" : "px-4 py-2"}`}
            title="Back to Site"
          >
            {isSidebarCollapsed ? <ArrowLeftIcon className="h-4 w-4" /> : "← Back to Site"}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 bg-background min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  );
}
