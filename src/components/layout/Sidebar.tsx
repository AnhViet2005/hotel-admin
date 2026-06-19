"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Hotel, 
  CalendarDays, 
  Users, 
  Settings, 
  LogOut,
  Globe,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { removeAuth, isOwner } from "@/lib/auth";
import { useEffect, useState } from "react";

const navigation = [

  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Khách sạn", href: "/hotels", icon: Hotel },
  { name: "Đơn đặt phòng", href: "/bookings", icon: CalendarDays },
  { name: "Người dùng", href: "/users", icon: Users, adminOnly: true },
  { name: "Đánh giá", href: "/reviews", icon: MessageSquare, adminOnly: true },
  { name: "Cài đặt", href: "/settings", icon: Settings, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [owner, setOwner] = useState(false);

  useEffect(() => {
    setOwner(isOwner());
  }, []);

  const handleLogout = () => {
    removeAuth();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
      <div className="flex h-20 items-center px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/20 group-hover:scale-105 transition-transform">
            <Globe className="text-white w-6 h-6" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-foreground">
            Cybertron<span className="text-accent-500">Admin</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          if (item.adminOnly && owner) return null;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-accent-500 text-white shadow-md shadow-accent-500/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 rounded-lg dark:hover:bg-red-950/20"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
