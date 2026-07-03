import { Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserInfo } from "@/lib/auth";
import NotificationDropdown from "./NotificationDropdown";

export default function Topbar() {
  const [user, setUser] = useState<any>(null);

  const syncUser = () => {
    const info = getUserInfo();
    setUser(info);
  };

  useEffect(() => {
    syncUser();
    // Listen for storage changes (for multiple tabs) or custom events
    const handleStorage = () => syncUser();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <header className="flex h-20 items-center justify-between border-b bg-card px-8">
      <div className="flex w-96 items-center px-6 py-2.5 bg-muted/50 rounded-2xl border border-border/50 focus-within:border-accent-500/50 focus-within:bg-card transition-all group">
        <Search className="h-4 w-4 text-muted-foreground mr-3 group-focus-within:text-accent-500 transition-colors" />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="bg-transparent border-none focus:outline-none text-sm w-full font-medium"
        />
      </div>

      <div className="flex items-center space-x-6 relative">
        <NotificationDropdown />
        <div className="h-6 w-px bg-border mx-1" />
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-foreground leading-tight">{user?.fullName || (user?.role === "ADMIN" ? "Quản trị viên" : "Chủ khách sạn")}</p>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{user?.role === "ADMIN" ? "Hệ thống" : "Đối tác"}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-accent-500/10 flex items-center justify-center border border-accent-500/20 shadow-sm overflow-hidden group cursor-pointer hover:border-accent-500/50 transition-all">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <User className="h-5 w-5 text-accent-500 group-hover:scale-110 transition-transform" />
          )}
        </div>
      </div>
    </header>
  );
}
