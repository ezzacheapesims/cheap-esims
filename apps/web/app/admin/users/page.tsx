"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AdminTable } from "@/components/admin/AdminTable";
import { Card, CardContent } from "@/components/ui/card";

interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  orderCount: number;
  esimCount: number;
}

export default function AdminUsersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/users`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user, apiUrl]);

  const columns = useMemo(() => [
    {
      header: "ID",
      accessor: (row: User) => row.id,
      className: "break-all min-w-[120px] font-mono text-xs font-bold text-gray-700",
    },
    {
      header: "Email",
      accessor: (row: User) => row.email,
      className: "text-black font-medium",
    },
    {
      header: "Name",
      accessor: (row: User) => row.name || "-",
      className: "text-gray-600",
    },
    {
      header: "eSIMs",
      accessor: (row: User) => row.esimCount,
      className: "text-center font-bold text-black",
    },
    {
      header: "Orders",
      accessor: (row: User) => row.orderCount,
      className: "text-center font-bold text-black",
    },
    {
      header: "Created",
      accessor: (row: User) =>
        new Date(row.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      className: "text-gray-600 font-mono text-xs",
    },
  ], []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 font-mono font-bold uppercase">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">Users</h1>
        <p className="text-gray-600 font-mono font-bold uppercase text-sm">
          Manage all platform users
        </p>
      </div>

      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardContent className="p-0">
          <AdminTable
            data={users}
            columns={columns}
            onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>
    </div>
  );
}
