"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, Clock, X, BellOff } from "lucide-react";
import { getAdminNotifications, getUnreadCount, markAllRead } from "@/utils/api";
import { cn } from "@/lib/utils";

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-xl transition-all border",
          isOpen ? "bg-accent-500 text-white border-accent-500 shadow-lg shadow-accent-500/20" : "bg-card hover:bg-muted text-muted-foreground"
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-card group-hover:scale-110 transition-transform">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 transform origin-top-right bg-card border rounded-[24px] shadow-2xl shadow-black/10 z-[100] animate-in fade-in zoom-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b bg-muted/20">
            <h3 className="font-heading font-black text-sm uppercase tracking-widest text-card-foreground">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-accent-500 hover:text-accent-600 transition-colors bg-accent-500/10 px-3 py-1.5 rounded-full"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <BellOff className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-semibold text-card-foreground">Chưa có thông báo nào</p>
                <p className="text-xs text-muted-foreground mt-1">Khi có cập nhật mới về thanh toán hoặc đặt phòng, chúng tôi sẽ báo cho bạn.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-5 transition-all hover:bg-muted/50 group relative cursor-default",
                      !n.isRead && "bg-accent-500/[0.03]"
                    )}
                  >
                    {!n.isRead && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-500 rounded-full" />
                    )}
                    <div className="flex gap-4">
                      <div className={cn(
                        "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center shadow-sm",
                        !n.isRead ? "bg-accent-500 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {n.message.includes("cọc") ? <Check className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={cn(
                          "text-sm leading-relaxed",
                          !n.isRead ? "text-card-foreground font-bold" : "text-muted-foreground"
                        )}>
                          {n.message}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                          <span>{formatTime(n.createdAt)}</span>
                          {n.bookingCode && (
                            <>
                              <span>•</span>
                              <span className="text-accent-500 font-black">#{n.bookingCode}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-muted/10">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
