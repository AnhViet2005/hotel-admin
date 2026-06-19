"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, Hotel } from "lucide-react";
import { setToken, setUserInfo } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.message || body?.error || "Email hoặc mật khẩu không đúng!";
        throw new Error(message);
      }

      const data = await response.json();
      console.log('Login response data', data);
      setToken(data.token);
      setUserInfo({
        email: data.email,
        fullName: data.fullName,
        role: data.role,
      });

      // Redirect to dashboard using replace to avoid extra navigation
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden font-inter">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="h-16 w-16 bg-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-500/30 mb-6 transform hover:rotate-6 transition-transform">
            <Hotel className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2 tracking-tight">Cybertron Admin</h1>
          <p className="text-neutral-400 text-sm">Hệ thống quản trị khách sạn cao cấp</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Email quản trị</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-accent-500 transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="admin@hotel.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-accent-500 transition-colors" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-accent-500/20 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Đăng nhập hệ thống
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-neutral-500 text-xs">
              &copy; 2026 Cybertron Hotel Management. Protected by AI Security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
