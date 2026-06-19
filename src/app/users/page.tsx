"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Mail, Phone, Calendar, ShieldCheck, Shield,
  User as UserIcon, Loader2, ToggleLeft, ToggleRight, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminUsers, toggleUserStatus, deleteAdminUser } from "@/utils/api";

interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
}

const ROLES = [
  { key: "ALL", label: "Tất cả" },
  { key: "ADMIN", label: "Quản trị viên" },
  { key: "OWNER", label: "Chủ khách sạn" },
  { key: "CUSTOMER", label: "Khách hàng" },
];

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-600 dark:bg-red-900/30",
  OWNER: "bg-accent-500/10 text-accent-600",
  CUSTOMER: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  OWNER: "Chủ khách sạn",
  CUSTOMER: "Khách hàng",
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeRole, setActiveRole] = useState("ALL");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers(
        debouncedSearch || undefined,
        activeRole === "ALL" ? undefined : activeRole
      );
      setUsers(data);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggle = async (id: number) => {
    setTogglingId(id);
    try {
      const updated = await toggleUserStatus(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: updated.isActive } : u))
      );
    } catch {
      /* empty */
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}" không?`)) return;

    setDeletingId(id);
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert("Xóa người dùng thành công.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Không thể xóa người dùng. Có thể tài khoản này đã có dữ liệu liên quan (booking, review...)");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (s: string) =>
    s ? new Date(s).toLocaleDateString("vi-VN") : "—";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Người dùng</h1>
          <p className="text-muted-foreground">
            {loading ? "Đang tải..." : `${users.length} người dùng trong hệ thống.`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-card p-4 rounded-xl border">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            className="w-full bg-muted border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Role Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl border flex-shrink-0 overflow-x-auto">
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => setActiveRole(r.key)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                activeRole === r.key
                  ? "bg-card shadow-sm border"
                  : "text-muted-foreground hover:bg-card/50"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Không tìm thấy người dùng nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-card rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow relative group"
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-4 mb-5">
                <div className="h-14 w-14 rounded-full bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                  ) : user.role === "ADMIN" ? (
                    <ShieldCheck className="h-7 w-7 text-accent-500" />
                  ) : user.role === "OWNER" ? (
                    <Shield className="h-7 w-7 text-accent-500" />
                  ) : (
                    <UserIcon className="h-7 w-7 text-accent-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base leading-tight truncate">{user.fullName}</h3>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 inline-block",
                      ROLE_BADGE[user.role] ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2.5 mb-5">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{user.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Tham gia: {formatDate(user.createdAt)}</span>
                </div>
              </div>

              {/* Status + Toggle */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      user.isActive ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                  <span className="text-xs font-medium">
                    {user.isActive ? "Hoạt động" : "Bị khóa"}
                  </span>
                </div>

                <button
                  onClick={() => handleToggle(user.id)}
                  disabled={togglingId === user.id}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors",
                    user.isActive
                      ? "text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                      : "text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                  )}
                >
                  {togglingId === user.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : user.isActive ? (
                    <ToggleLeft className="h-3.5 w-3.5" />
                  ) : (
                    <ToggleRight className="h-3.5 w-3.5" />
                  )}
                  {user.isActive ? "Khóa" : "Mở khóa"}
                </button>

                {user.role !== "ADMIN" && (
                  <button
                    onClick={() => handleDelete(user.id, user.fullName)}
                    disabled={deletingId === user.id}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    {deletingId === user.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
