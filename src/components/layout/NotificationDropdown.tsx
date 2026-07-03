"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, Clock, X, BellOff, MessageSquare, Star } from "lucide-react";
import { getAdminNotifications, getUnreadCount, markAllRead } from "@/utils/api";
import { cn } from "@/lib/utils";

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [data, count] = await Promise.all([
        getAdminNotifications(),
        getUnreadCount()
      ]);
      setNotifications(data);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60) ;
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  const getStatusBadge = (type: string) => {
    switch (type) {
      case "DEPOSIT_PAID":
        return <span className="bg-blue-500/10 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-blue-500/20">Xác nhận cọc</span>;
      case "FULL_PAYMENT_PAID":
      case "REMAINING_PAID":
        return <span className="bg-green-500/10 text-green-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-green-500/20">Đã thu đủ</span>;
      case "NEW_CHAT":
        return <span className="bg-orange-500/10 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-orange-500/20">Tin nhắn mới</span>;
      case "NEW_REVIEW":
        return <span className="bg-purple-500/10 text-purple-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-purple-500/20">Đánh giá mới</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-500/20">Thông báo</span>;
    }
  };

  const getHref = (type: string) => {
    if (type === "NEW_CHAT") return "/chat";
    if (type === "NEW_REVIEW") return "/reviews";
    return "/bookings";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-xl transition-all border group",
          isOpen ? "bg-accent-500 text-white border-accent-500 shadow-xl shadow-accent-500/30" : "bg-card hover:bg-muted text-muted-foreground border-border"
        )}
      >
        <Bell className={cn("h-5 w-5", unreadCount > 0 && !isOpen && "animate-[bell-ring_1s_infinite]")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-card shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-[420px] transform origin-top-right bg-card border rounded-[32px] shadow-2xl shadow-black/20 z-[100] animate-in fade-in zoom-in slide-in-from-top-4 duration-300 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b bg-muted/10">
            <div>
              <h3 className="font-heading font-black text-xs uppercase tracking-[0.2em] text-accent-500">Yêu cầu & Thông báo</h3>
              <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">{unreadCount} yêu cầu mới cần xử lý</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-black text-white bg-blue-500 hover:bg-blue-600 transition-all px-4 py-2 rounded-full shadow-md shadow-blue-500/20 uppercase tracking-tighter"
              >
                Đã đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6 border border-border/50">
                    <BellOff className="h-10 w-10 text-muted-foreground/20" />
                </div>
                <p className="text-base font-bold text-card-foreground">Hệ thống đang trống</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Chúng tôi sẽ tự động kéo (Pull) các yêu cầu mới về sau mỗi 5 giây.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-6 transition-all hover:bg-muted/30 group relative flex gap-4",
                      !n.isRead ? "bg-accent-500/[0.04]" : "opacity-70"
                    )}
                  >
                    {!n.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500 rounded-r-full" />
                    )}
                    
                    <div className={cn(
                      "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500",
                      !n.isRead ? "bg-accent-500 text-white shadow-accent-500/20" : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {n.type === "DEPOSIT_PAID" || n.type === "FULL_PAYMENT_PAID" || n.type === "REMAINING_PAID" ? (
                        <Check className="h-6 w-6" />
                      ) : n.type === "NEW_CHAT" ? (
                        <MessageSquare className="h-6 w-6" />
                      ) : n.type === "NEW_REVIEW" ? (
                        <Star className="h-6 w-6" />
                      ) : (
                        <Clock className="h-6 w-6" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                         {getStatusBadge(n.type)}
                         <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">{formatTime(n.createdAt)}</span>
                      </div>
                      
                      <p className={cn(
                        "text-[13px] leading-relaxed mb-3",
                        !n.isRead ? "text-card-foreground font-bold" : "text-muted-foreground font-medium"
                      )}>
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between">
                        {n.bookingCode ? (
                          <span className="text-[10px] font-black text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded-md font-mono">
                            #{n.bookingCode}
                          </span>
                        ) : <div />}
                        
                        <a 
                          href={getHref(n.type)} 
                          className="flex items-center gap-1.5 text-[10px] font-black text-accent-500 uppercase tracking-widest hover:gap-2.5 transition-all"
                        >
                          Xử lý ngay <Check className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-muted/20 text-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest animate-pulse">
               Đang theo dõi (Polling 5s) • Kết nối ổn định
            </p>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          60% { transform: rotate(10deg); }
          80% { transform: rotate(-10deg); }
        }
      `}</style>
    </div>
  );
}
