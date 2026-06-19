"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { isAdmin, isOwner, getToken } from "@/lib/auth";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // const token = typeof window !== "undefined" ? localStorage.getItem('admin_auth_token') : null; // removed unused
  const isLoginPage = pathname === "/login";
  const isAuthenticated = !!getToken();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoginPage && isAuthenticated) {
      // User just logged in, redirect to dashboard
      router.replace('/');
      setIsChecking(false);
      return;
    }
    if (!isLoginPage && !isAdmin() && !isOwner()) {
      router.replace('/login');
      setIsChecking(false);
      return;
    }
    setIsChecking(false);
  }, [isLoginPage, isAuthenticated, router]);

  if (isChecking) {
    return <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="h-10 w-10 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!isLoginPage && !isAdmin() && !isOwner()) {
    return null; // Don't render content while redirecting to login
  }

  if (isLoginPage) {
    return <main className="h-screen w-screen overflow-hidden bg-background">{children}</main>;
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden font-inter">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
