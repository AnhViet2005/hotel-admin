"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Download, Eye, CheckCircle2, XCircle, Clock, Loader2, X, ChevronRight, Trash2, Calendar, Users, Hotel, ArrowUpRight, CheckSquare, Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminBookings, updateBookingStatus, deleteAdminBooking, bulkDeleteAdminBookings } from "@/utils/api";

interface Booking {
  id: number;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  remainingPaymentStatus: string;
  status: string;
  createdAt: string;
}

const STATUS_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xử lý" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "COMPLETED", label: "Hoàn tất" },
  { key: "CANCELLED", label: "Đã hủy" },
];

const STATUS_TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  PENDING: [
    { label: "Xác nhận", next: "CONFIRMED", color: "text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30" },
    { label: "Hủy đơn", next: "CANCELLED", color: "text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30" },
  ],
  CONFIRMED: [
    { label: "Hoàn tất", next: "COMPLETED", color: "text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30" },
    { label: "Hủy đơn", next: "CANCELLED", color: "text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAdminBookings(
        debouncedSearch || undefined,
        activeTab === "ALL" ? undefined : activeTab
      );
      setBookings(data);
    } catch { /* empty */ }
    finally { if (!silent) setLoading(false); }
  }, [debouncedSearch, activeTab]);

  useEffect(() => { 
    fetchBookings(); 
    const interval = setInterval(() => fetchBookings(true), 5000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const handleStatusChange = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const updated = await updateBookingStatus(id, status);
      setBookings(bs => bs.map(b => b.id === id ? { ...b, status: updated.status } : b));
      if (detailBooking?.id === id) setDetailBooking(d => d ? { ...d, status: updated.status } : null);
    } catch { /* empty */ }
    finally { setUpdatingId(null); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn đặt phòng này? Hành động này không thể hoàn tác.")) return;
    setUpdatingId(id);
    try {
      await deleteAdminBooking(id);
      setBookings(bs => bs.filter(b => b.id !== id));
      if (detailBooking?.id === id) setDetailBooking(null);
    } catch { alert("Không thể xóa đơn đặt phòng."); }
    finally { setUpdatingId(null); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn ${selectedIds.length} đơn đã chọn?`)) return;
    
    setLoading(true);
    try {
      await bulkDeleteAdminBookings(selectedIds);
      setBookings(bs => bs.filter(b => !selectedIds.includes(b.id)));
      setSelectedIds([]);
    } catch { alert("Lỗi khi xóa hàng loạt."); }
    finally { setLoading(false); }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === bookings.length) setSelectedIds([]);
    else setSelectedIds(bookings.map(b => b.id));
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  const formatDate = (s: string) =>
    s ? new Date(s).toLocaleDateString("vi-VN") : "—";

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; textClass: string; bgClass: string }> = {
    PENDING: { label: "Chờ xử lý", icon: <Clock className="h-3.5 w-3.5" />, textClass: "text-yellow-600", bgClass: "bg-yellow-100 dark:bg-yellow-900/30" },
    CONFIRMED: { label: "Đã xác nhận", icon: <CheckCircle2 className="h-3.5 w-3.5" />, textClass: "text-blue-600", bgClass: "bg-blue-100 dark:bg-blue-900/30" },
    COMPLETED: { label: "Hoàn tất", icon: <CheckCircle2 className="h-3.5 w-3.5" />, textClass: "text-green-600", bgClass: "bg-green-100 dark:bg-green-900/30" },
    CANCELLED: { label: "Đã hủy", icon: <XCircle className="h-3.5 w-3.5" />, textClass: "text-red-600", bgClass: "bg-red-100 dark:bg-red-900/30" },
  };

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status] ?? { label: status, icon: null, textClass: "text-muted-foreground", bgClass: "bg-muted" };
    return (
      <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold", cfg.textClass, cfg.bgClass)}>
        {cfg.icon}{cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Đơn đặt phòng</h1>
          <p className="text-muted-foreground">
            {loading ? "Đang tải..." : `${bookings.length} đơn hiển thị.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm shadow-lg shadow-red-500/20 hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4" /> Xóa ({selectedIds.length}) đơn đã chọn
            </button>
          )}
          <button className="flex items-center gap-2 border border-accent-500/20 text-accent-500 hover:bg-accent-500/5 px-5 py-2.5 rounded-xl font-bold transition-all text-sm">
            <Download className="h-4 w-4" /> Xuất CSV
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-1 p-1 bg-muted rounded-xl border overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                activeTab === tab.key ? "bg-card shadow-sm border" : "text-muted-foreground hover:bg-card/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Mã đơn / Tên khách / Khách sạn..."
            className="w-full bg-card border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Không có đơn đặt phòng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-5 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-accent-500 transition-colors">
                      {selectedIds.length === bookings.length && bookings.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-accent-500" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mã đơn</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Khách hàng</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Khách sạn</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-in → Out</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tổng tiền</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cọc (30%)</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Còn lại (70%)</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trạng thái</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map(b => (
                  <tr key={b.id} className={cn("hover:bg-muted/30 transition-colors group", selectedIds.includes(b.id) && "bg-accent-500/[0.02]")}>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleSelect(b.id)} className="text-muted-foreground hover:text-accent-500 transition-colors">
                        {selectedIds.includes(b.id) ? (
                          <CheckSquare className="h-5 w-5 text-accent-500" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-heading font-bold text-accent-500 text-sm">{b.bookingCode}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(b.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-sm">{b.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">{b.customerEmail}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground max-w-[160px] truncate">{b.hotelName}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded border">{formatDate(b.checkIn)}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="bg-muted px-2 py-1 rounded border">{formatDate(b.checkOut)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-sm">{formatCurrency(b.totalAmount)}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className="text-orange-600 font-bold">{formatCurrency(b.depositAmount ?? b.totalAmount * 0.3)}</span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className="text-green-600 font-bold">{formatCurrency(b.remainingAmount ?? b.totalAmount * 0.7)}</span>
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(b.status)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetailBooking(b)}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                          title="Chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {(STATUS_TRANSITIONS[b.status] ?? []).map(action => (
                          <button
                            key={action.next}
                            onClick={() => handleStatusChange(b.id, action.next)}
                            disabled={updatingId === b.id}
                            className={cn("text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors", action.color)}
                          >
                            {updatingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : action.label}
                          </button>
                        ))}
                        {(b.status === "CANCELLED" || b.status === "COMPLETED") && (
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-[32px] border shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center p-8 border-b bg-card">
              <div>
                <h2 className="text-2xl font-bold font-heading text-card-foreground">Chi tiết đơn đặt phòng</h2>
                <p className="text-sm text-muted-foreground mt-1">Mã đơn: <span className="font-mono font-bold text-accent-500">#{detailBooking.bookingCode}</span></p>
              </div>
              <button 
                onClick={() => setDetailBooking(null)} 
                className="p-3 hover:bg-muted rounded-2xl transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto max-h-[70vh]">
              {/* Left Column: Basic Info */}
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Khách sạn", value: detailBooking.hotelName, icon: Eye }, // Reuse icons or find better ones
                    { label: "Khách hàng", value: detailBooking.customerName, icon: Eye },
                    { label: "Check-in", value: formatDate(detailBooking.checkIn), icon: Eye },
                    { label: "Check-out", value: formatDate(detailBooking.checkOut), icon: Eye },
                  ].map((item, i) => (
                    <div key={i} className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                         {item.label}
                      </p>
                      <p className="font-bold text-card-foreground truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                  <div className={cn("bg-accent-500/5 border rounded-3xl p-6 transition-all", detailBooking.remainingPaymentStatus === "PAID" ? "border-green-500/40 bg-green-500/[0.02]" : "border-accent-500/20")}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-accent-600">Trạng thái & Thanh toán</h3>
                      {detailBooking.remainingPaymentStatus === "PAID" && (
                        <span className="bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">Đã thanh toán đủ 100%</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-muted-foreground font-medium text-sm">Trạng thái đơn hàng</span>
                      {getStatusBadge(detailBooking.status)}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-semibold">TỔNG CỘNG</span>
                        <span className="font-bold text-xl">{formatCurrency(detailBooking.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          Tiền cọc (30% - Đã thu)
                        </span>
                        <span className="font-bold text-orange-600 text-sm">{formatCurrency(detailBooking.depositAmount ?? detailBooking.totalAmount * 0.3)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${detailBooking.remainingPaymentStatus === "PAID" ? "bg-green-500" : "bg-slate-300"}`} />
                          Phần còn lại (70%)
                        </span>
                        <span className={cn("font-bold text-sm", detailBooking.remainingPaymentStatus === "PAID" ? "text-green-600" : "text-slate-500")}>
                          {formatCurrency(detailBooking.remainingAmount ?? detailBooking.totalAmount * 0.7)}
                          {detailBooking.remainingPaymentStatus === "PAID" ? " (Đã thu)" : " (Chưa thu)"}
                        </span>
                      </div>
                    </div>
                  </div>
              </div>

              {/* Right Column: Actions */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Thao tác nhanh</h3>
                  
                  {(STATUS_TRANSITIONS[detailBooking.status] ?? []).length > 0 ? (
                    <div className="space-y-3">
                      {STATUS_TRANSITIONS[detailBooking.status].map(action => (
                        <button
                          key={action.next}
                          onClick={() => handleStatusChange(detailBooking.id, action.next)}
                          disabled={updatingId === detailBooking.id}
                          className={cn("w-full py-3.5 rounded-2xl text-sm font-bold border transition-all flex items-center justify-center gap-2", action.color)}
                        >
                          {updatingId === detailBooking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : action.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      Không có thao tác nào khả dụng cho trạng thái này.
                    </p>
                  )}
                </div>

                <div className="bg-muted/20 border border-border rounded-2xl p-5">
                   <p className="text-xs text-muted-foreground text-center">
                    Bạn đang xem thông tin chi tiết của đơn đặt phòng từ hệ thống quản trị.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
