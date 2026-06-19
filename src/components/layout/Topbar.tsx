import { Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserInfo } from "@/lib/auth";
import NotificationDropdown from "./NotificationDropdown";

export default function Topbar() {
  const [userName, setUserName] = useState<string>("Admin Cybertron");
  const [userRole, setUserRole] = useState<string>("Quản trị viên");

  useEffect(() => {
    const user = getUserInfo();
    if (user?.role === "OWNER") {
      setUserName(user?.fullName || "Chủ khách sạn");
      setUserRole("Chủ khách sạn");
    } else {
      setUserName("Admin Cybertron");
      setUserRole("Quản trị viên");
    }
  }, []);

  return (
    <header className="flex h-20 items-center justify-between border-b bg-card px-8">
      <div className="flex w-96 items-center px-4 py-2 bg-muted rounded-full border">
        <Search className="h-5 w-5 text-muted-foreground mr-3" />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="bg-transparent border-none focus:outline-none text-sm w-full"
        />
      </div>

      <div className="flex items-center space-x-6 relative">
        <NotificationDropdown />
        <div className="h-8 w-px bg-border mx-2" />
        <div className="text-right">
          <p className="text-sm font-semibold">{userName}</p>
          <p className="text-xs text-muted-foreground font-medium">{userRole}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-accent-500/10 flex items-center justify-center border border-accent-500/20 shadow-sm">
          <User className="h-6 w-6 text-accent-500" />
        </div>
      </div>
    </header>
  );
}
