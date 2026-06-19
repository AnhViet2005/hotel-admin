"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Hotel, 
  CalendarCheck, 
  DollarSign, 
  ArrowUpRight, 
  TrendingUp,
  MapPin,
  Loader2,
  Eye,
  X,
  Calendar,
  CheckCircle2,
  Clock
} from "lucide-react";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import RevenueBreakdown from "@/components/dashboard/RevenueBreakdown";
import { getDashboardStats, getRecentBookings, getRevenueBreakdown } from "@/utils/api";
import { formatCurrency } from "@/utils/format";
import { getToken } from "@/lib/auth";

export default function DashboardPage() {
  const [statsData, setStatsData] = useState({ totalRevenue: 0, totalBookings: 0, totalCustomers: 0, totalHotels: 0 });
  const [revenueData, setRevenueData] = useState({ totalAmount: 0, adminRevenue: 0, hotelOwnerRevenue: 0, revenueDistribution: "" });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewBooking, setViewBooking] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        // Since api.ts doesn't attach token automatically, we need to pass it or configure interceptors.
        // Wait, I should update api.ts to include the token interceptor. But for now I'll just rely on api.ts if I update it.
        const [stats, bookings, revenue] = await Promise.all([
          getDashboardStats(),
          getRecentBookings(),
          getRevenueBreakdown()
        ]);
        setStatsData(stats);
        setRecentBookings(bookings);
        setRevenueData(revenue);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { name: "Tổng doanh thu", value: formatCurrency(statsData.totalRevenue), change: "12.5", changeType: "increase", icon: DollarSign },
    { name: "Tổng đơn đặt phòng", value: statsData.totalBookings.toString(), change: "8.2", changeType: "increase", icon: CalendarCheck },
    { name: "Khách hàng mới", value: statsData.totalCustomers.toString(), change: "15.3", changeType: "increase", icon: Users },
    { name: "Khách sạn hoạt động", value: statsData.totalHotels.toString(), change: "2.1", changeType: "decrease", icon: Hotel },
  ];

  const formatStatus = (status: string) => {
    switch (status) {
      case "COMPLETED": return "Hoàn tất";
      case "PENDING": return "Đang xử lý";
      case "CONFIRMED": return "Đã xác nhận";
      case "CANCELLED": return "Đã hủy";
      default: return status;
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent-500" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">Tổng quan hệ thống</h1>
        <p className="text-muted-foreground">Chào mừng quay trở lại, đây là những gì đang diễn ra hôm nay.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat as any} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings Table */}
        <div className="lg:col-span-2 bg-card rounded-2xl border shadow-sm overflow-hidden text-card-foreground">
          <div className="p-6 border-b flex justify-between items-center bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-accent-500/10 rounded-xl flex items-center justify-center text-accent-500">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-heading font-bold">Đơn đặt phòng gần nhất</h2>
            </div>
            <Link href="/bookings" className="text-sm font-medium text-accent-500 hover:text-accent-600 transition-colors flex items-center gap-1">
              Xem tất cả <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Mã đơn</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Khách hàng</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap text-right">Tổng cộng</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap text-right">Đã cọc (30%)</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap text-right">Còn lại (70%)</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentBookings.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-heading font-bold text-accent-500 text-sm">#{booking.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm">{booking.customerName}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{booking.hotelName}</p>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">{formatCurrency(booking.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-accent-500 font-bold text-sm">{formatCurrency(booking.depositAmount)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-600 font-bold text-sm">{formatCurrency(booking.remainingAmount)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ${
                        booking.status === "COMPLETED" ? "bg-green-100 text-green-700 ring-green-600/20" : 
                        booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700 ring-yellow-600/20" :
                        booking.status === "CONFIRMED" ? "bg-blue-100 text-blue-700 ring-blue-600/20" :
                        "bg-red-100 text-red-700 ring-red-600/20"
                      }`}>
                        {formatStatus(booking.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setViewBooking(booking)}
                        className="p-2 hover:bg-accent-500 hover:text-white rounded-lg transition-all text-muted-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground italic">Không có đơn đặt phòng nào gần đây</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div>
          <RevenueBreakdown 
            adminRevenue={revenueData.adminRevenue}
            hotelOwnerRevenue={revenueData.hotelOwnerRevenue}
            totalAmount={revenueData.totalAmount}
            loading={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Destinations / Side Widget */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border shadow-sm p-6 text-card-foreground">
            <h2 className="text-xl font-heading font-bold mb-6">Điểm đến hàng đầu</h2>
            <div className="space-y-6">
              {[
                { city: "Đà Nẵng", bookings: 124, growth: 12 },
                { city: "Phú Quốc", bookings: 98, growth: 8 },
                { city: "Hà Nội", bookings: 76, growth: 15 },
                { city: "Sapa", bookings: 45, growth: 5 },
              ].map((city, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-accent-500" />
                    </div>
                    <div>
                      <p className="font-semibold">{city.city}</p>
                      <p className="text-xs text-muted-foreground">{city.bookings} đơn đặt phòng</p>
                    </div>
                  </div>
                  <div className={`flex items-center text-xs font-bold ${city.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {city.growth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : null}
                    {city.growth}%
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 rounded-xl border border-accent-500/20 text-accent-500 font-semibold hover:bg-accent-500/5 transition-colors">
              Xem báo cáo chi tiết
            </button>
          </div>

          <div className="bg-accent-500 rounded-2xl p-6 text-white shadow-lg shadow-accent-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-heading font-bold text-lg mb-2">Nâng cấp hệ thống?</h3>
              <p className="text-white/80 text-sm mb-4">Phiên bản 2.0 đã sẵn sàng với nhiều tính năng báo cáo mới.</p>
              <button className="bg-white text-accent-500 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-neutral-50 transition-colors">
                Tìm hiểu thêm
              </button>
            </div>
            <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-white/10 rounded-full blur-3xl opacity-50" />
          </div>
        </div>
      </div>
      {/* Detail Modal */}
      {viewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-[32px] border shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center p-8 border-b bg-card">
              <div>
                <h2 className="text-2xl font-bold font-heading text-card-foreground">Chi tiết đơn đặt phòng</h2>
                <p className="text-sm text-muted-foreground mt-1">Mã đơn: <span className="font-mono font-bold text-accent-500">#{viewBooking.id}</span></p>
              </div>
              <button 
                onClick={() => setViewBooking(null)} 
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
                    { label: "Khách sạn", value: viewBooking.hotelName, icon: Hotel },
                    { label: "Khách hàng", value: viewBooking.customerName, icon: Users },
                    { label: "Ngày đến", value: new Date(viewBooking.checkIn || Date.now()).toLocaleDateString("vi-VN"), icon: Calendar },
                    { label: "Ngày đi", value: new Date(viewBooking.checkOut || Date.now()).toLocaleDateString("vi-VN"), icon: Calendar },
                  ].map((item, i) => (
                    <div key={i} className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                        <item.icon className="h-3 w-3 text-accent-500" /> {item.label}
                      </p>
                      <p className="font-bold text-card-foreground truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-accent-500/5 border border-accent-500/20 rounded-3xl p-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-accent-600 mb-4">Trạng thái & Thanh toán</h3>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-muted-foreground font-medium">Trạng thái đơn hàng</span>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ring-1 ring-inset ${
                        viewBooking.status === "COMPLETED" ? "bg-green-100 text-green-700 ring-green-600/20" : 
                        viewBooking.status === "PENDING" ? "bg-yellow-100 text-yellow-700 ring-yellow-600/20" :
                        viewBooking.status === "CONFIRMED" ? "bg-blue-100 text-blue-700 ring-blue-600/20" :
                        "bg-red-100 text-red-700 ring-red-600/20"
                      }`}>
                      {formatStatus(viewBooking.status)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-semibold">TỔNG GIÁ TRỊ</span>
                      <span className="font-bold text-lg">{formatCurrency(viewBooking.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        Tiền cọc (30% - Đã thu)
                      </span>
                      <span className="font-bold text-orange-600">{formatCurrency(viewBooking.depositAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${viewBooking.status === "COMPLETED" ? "bg-green-500" : "bg-slate-300"}`} />
                        Phần còn lại (70% - {viewBooking.status === "COMPLETED" ? "Đã thu" : "Thanh toán tại KS"})
                      </span>
                      <span className={`font-bold ${viewBooking.status === "COMPLETED" ? "text-green-600" : "text-slate-500"}`}>{formatCurrency(viewBooking.remainingAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions or extra info */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Ghi chú hệ thống</h3>
                  <p className="text-sm text-muted-foreground italic">
                    Đơn hàng này được tạo vào lúc {new Date(viewBooking.bookingDate || Date.now()).toLocaleString("vi-VN")}. 
                    Tiền cọc 30% đã được ghi nhận vào doanh thu hệ thống.
                  </p>
                </div>
                
                <Link 
                  href="/bookings" 
                  className="w-full h-14 bg-accent-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent-500/20 hover:scale-[1.02] transition-all"
                >
                  Quản lý tất cả đơn hàng <ArrowUpRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
