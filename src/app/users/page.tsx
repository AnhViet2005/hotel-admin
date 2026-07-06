"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Mail, Phone, Calendar, ShieldCheck, Shield,
  User as UserIcon, Loader2, ToggleLeft, ToggleRight, Trash2,
  Info, X, Building, MapPin, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminUsers, toggleUserStatus, deleteAdminUser, getMyCustomers, getOwnerDetails } from "@/utils/api";
import { isAdmin as checkIsAdmin, isOwner as checkIsOwner } from "@/lib/auth";

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
  GUEST: "bg-slate-100 text-slate-600 dark:bg-slate-900/30",
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  OWNER: "Chủ khách sạn",
  CUSTOMER: "Khách hàng",
  GUEST: "Khách vãng lai",
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeRole, setActiveRole] = useState("ALL");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const isAdmin = checkIsAdmin();
  const isOwner = checkIsOwner();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (isAdmin) {
        data = await getAdminUsers(
          debouncedSearch || undefined,
          activeRole === "ALL" ? undefined : activeRole
        );
      } else if (isOwner) {
        data = await getMyCustomers();
        // Manual filter for owner since API is simpler
        if (debouncedSearch) {
          const kw = debouncedSearch.toLowerCase();
          data = data.filter((u: any) =>
            u.fullName.toLowerCase().includes(kw) ||
            u.email.toLowerCase().includes(kw)
          );
        }
      }
      setUsers(data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeRole, isAdmin, isOwner]);

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

  const handleViewDetails = async (id: number) => {
    setDetailsLoading(true);
    try {
      const data = await getOwnerDetails(id);
      setSelectedOwner(data);
    } catch {
      alert("Không thể tải thông tin chi tiết chủ khách sạn.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatDate = (s: string) =>
    s ? new Date(s).toLocaleDateString("vi-VN") : "—";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">
            {loading ? "Đang tải..." : `${users.length} người dùng trong hệ thống.`}
          </p>
        </div>
      </div>

      {/* Filters - Only show for Admin */}
      {isAdmin && (
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
      )}

      {/* Basic Search for Owner */}
      {isOwner && !isAdmin && (
        <div className="bg-card p-4 rounded-xl border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm khách hàng của bạn..."
              className="w-full bg-muted border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

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

              {/* Status + Toggle - Only for Admin */}
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

                {isAdmin && (
                  <div className="flex gap-2">
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

                    {user.role === "OWNER" && (
                      <button
                        onClick={() => handleViewDetails(user.id)}
                        disabled={detailsLoading}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-accent-600 hover:bg-accent-100 dark:hover:bg-accent-900/30 transition-colors"
                      >
                        {detailsLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Info className="h-3.5 w-3.5" />
                        )}
                        Chi tiết
                      </button>
                    )}

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
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Owner Details Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center bg-muted/30">
              <div>
                <h2 className="text-2xl font-heading font-bold">Chi tiết Chủ khách sạn</h2>
                <p className="text-sm text-muted-foreground">{selectedOwner.user.fullName}</p>
              </div>
              <button
                onClick={() => setSelectedOwner(null)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Side: Owner Info */}
                <div className="md:col-span-1 space-y-6">
                  <div className="aspect-square rounded-3xl overflow-hidden bg-muted border relative">
                    {selectedOwner.user.avatarUrl ? (
                      <img
                        src={selectedOwner.user.avatarUrl}
                        alt={selectedOwner.user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="h-20 w-20 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Email</label>
                      <p className="font-bold text-sm truncate">{selectedOwner.user.email}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Số điện thoại</label>
                      <p className="font-bold text-sm">{selectedOwner.user.phone || "Chưa cập nhật"}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Ngày gia nhập</label>
                      <p className="font-bold text-sm">{formatDate(selectedOwner.user.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Hotels List */}
                <div className="md:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Building className="h-5 w-5 text-accent-500" />
                      Danh sách khách sạn ({selectedOwner.hotels.length})
                    </h3>
                  </div>

                  {selectedOwner.hotels.length === 0 ? (
                    <div className="py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                      <Building className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">Chủ khách sạn này chưa sở hữu khách sạn nào.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedOwner.hotels.map((hotel: any) => (
                        <div
                          key={hotel.id}
                          className="group p-4 bg-card rounded-2xl border hover:border-accent-500/50 hover:shadow-lg transition-all duration-300 flex items-center gap-5"
                        >
                          <div className="h-20 w-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                            {hotel.image ? (
                              <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-lg truncate group-hover:text-accent-500 transition-colors">{hotel.name}</h4>
                            <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {hotel.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> {hotel.rating} sao
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-accent-500">{hotel.price}/đêm</p>
                            <span className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block",
                              hotel.status === 'active' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                            )}>
                              {hotel.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-muted/30">
              <button
                onClick={() => setSelectedOwner(null)}
                className="w-full py-4 rounded-2xl bg-foreground text-background font-bold hover:opacity-90 transition-opacity"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
