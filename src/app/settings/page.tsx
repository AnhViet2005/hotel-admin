"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Globe, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Save, 
  Loader2, 
  Percent,
  Share2,
  Link as LinkIcon,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contactId, setContactId] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const [form, setForm] = useState({
    siteName: "Cybertron Hotel Booking",
    siteDescription: "Hệ thống đặt phòng khách sạn trực tuyến hàng đầu Việt Nam",
    contactEmail: "support@cybertron.vn",
    contactPhone: "1900 1234",
    address: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
    commissionRate: 15,
    facebookUrl: "https://facebook.com/cybertron",
    instagramUrl: "https://instagram.com/cybertron",
    twitterUrl: "https://twitter.com/cybertron",
    seoKeywords: "đặt phòng khách sạn, du lịch, khách sạn giá rẻ, cybertron",
  });

  // Load settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log("Loading settings from backend...");
        const token = localStorage.getItem("admin_auth_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
        const response = await fetch(`${apiUrl}/contact-info`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        console.log("API Response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Loaded settings:", data);
          setContactId(data.id);
          setForm(prev => ({
            ...prev,
            siteName: data.siteName || prev.siteName,
            siteDescription: data.siteDescription || prev.siteDescription,
            contactEmail: data.email || prev.contactEmail,
            contactPhone: data.phone || prev.contactPhone,
            address: data.address || prev.address,
            commissionRate: data.commissionRate || prev.commissionRate,
            facebookUrl: data.facebookUrl || prev.facebookUrl,
            instagramUrl: data.instagramUrl || prev.instagramUrl,
            twitterUrl: data.twitterUrl || prev.twitterUrl,
            seoKeywords: data.seoKeywords || prev.seoKeywords,
          }));
          console.log("Settings loaded and form updated");
        } else {
          console.log("API returned status:", response.status);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const settingsPayload = {
        email: form.contactEmail,
        phone: form.contactPhone,
        address: form.address,
        siteName: form.siteName,
        siteDescription: form.siteDescription,
        seoKeywords: form.seoKeywords,
        commissionRate: form.commissionRate,
        facebookUrl: form.facebookUrl,
        instagramUrl: form.instagramUrl,
        twitterUrl: form.twitterUrl,
      };

      const token = localStorage.getItem("admin_auth_token");
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      let res;
      if (contactId) {
        // Update existing
        res = await fetch(`${apiUrl}/contact-info/${contactId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(settingsPayload),
        });
      } else {
        // Create new
        res = await fetch(`${apiUrl}/contact-info`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(settingsPayload),
        });
        
        if (res.ok) {
          const data = await res.json();
          setContactId(data.id);
        }
      }

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        console.log("Settings saved successfully!");
      } else {
        console.error("Save failed:", res.statusText);
        const errorData = await res.json().catch(() => ({}));
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "general", name: "Cài đặt chung", icon: Globe },
    { id: "contact", name: "Liên hệ & Mạng xã hội", icon: Mail },
    { id: "system", name: "Hệ thống & Chiết khấu", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">Cấu hình các thông tin hiển thị và tham số vận hành của toàn bộ website.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-accent-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-accent-500/20 hover:bg-accent-600 transition-all transform hover:-translate-y-1 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {success ? "Đã lưu thành công!" : "Lưu thay đổi"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-accent-500 text-white shadow-lg shadow-accent-500/20" 
                  : "bg-card hover:bg-muted text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.name}
            </button>
          ))}
          
          <div className="mt-8 p-6 bg-accent-500/5 rounded-3xl border border-accent-500/10">
            <div className="flex items-center gap-2 text-accent-600 mb-3">
              <Info className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">Lưu ý</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Các thay đổi tại đây sẽ ảnh hưởng trực tiếp đến giao diện người dùng trên trang đặt phòng và cách tính toán doanh thu. Hãy cẩn trọng khi chỉnh sửa.
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3">
          <div className="bg-card border rounded-[32px] p-8 lg:p-12 shadow-sm min-h-[500px]">
            {activeTab === "general" && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-muted-foreground ml-1 uppercase tracking-widest">Tên Website</label>
                    <input 
                      className="w-full bg-muted/40 border border-border rounded-2xl px-6 py-4 text-base focus:ring-2 focus:ring-accent-500/20 outline-none transition-all font-semibold" 
                      value={form.siteName}
                      onChange={e => setForm({...form, siteName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-muted-foreground ml-1 uppercase tracking-widest">Mô tả hệ thống (SEO)</label>
                    <textarea 
                      rows={3}
                      className="w-full bg-muted/40 border border-border rounded-2xl px-6 py-4 text-base focus:ring-2 focus:ring-accent-500/20 outline-none transition-all font-medium" 
                      value={form.siteDescription}
                      onChange={e => setForm({...form, siteDescription: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-muted-foreground ml-1 uppercase tracking-widest">Từ khóa tìm kiếm (SEO Keywords)</label>
                    <input 
                      className="w-full bg-muted/40 border border-border rounded-2xl px-6 py-4 text-base focus:ring-2 focus:ring-accent-500/20 outline-none transition-all" 
                      value={form.seoKeywords}
                      onChange={e => setForm({...form, seoKeywords: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "contact" && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-muted-foreground ml-1 uppercase tracking-widest">Email hỗ trợ</label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input 
                        className="w-full bg-muted/40 border border-border rounded-2xl pl-16 pr-6 py-4 text-base focus:ring-2 focus:ring-accent-500/20 outline-none transition-all font-semibold" 
                        value={form.contactEmail}
                        onChange={e => setForm({...form, contactEmail: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-muted-foreground ml-1 uppercase tracking-widest">Hotline liên hệ</label>
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input 
                        className="w-full bg-muted/40 border border-border rounded-2xl pl-16 pr-6 py-4 text-base focus:ring-2 focus:ring-accent-500/20 outline-none transition-all font-semibold" 
                        value={form.contactPhone}
                        onChange={e => setForm({...form, contactPhone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-black text-muted-foreground ml-1 uppercase tracking-widest">Địa chỉ văn phòng</label>
                    <input 
                      className="w-full bg-muted/40 border border-border rounded-2xl px-6 py-4 text-base focus:ring-2 focus:ring-accent-500/20 outline-none transition-all font-semibold" 
                      value={form.address}
                      onChange={e => setForm({...form, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-8 border-t space-y-6">
                  <h3 className="text-lg font-bold font-heading">Liên kết Mạng xã hội</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1877F2]" />
                      <input className="w-full bg-muted/40 border border-border rounded-xl pl-12 pr-4 py-3 text-sm" placeholder="Facebook URL" value={form.facebookUrl} onChange={e => setForm({...form, facebookUrl: e.target.value})} />
                    </div>
                    <div className="relative">
                      <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#E4405F]" />
                      <input className="w-full bg-muted/40 border border-border rounded-xl pl-12 pr-4 py-3 text-sm" placeholder="Instagram URL" value={form.instagramUrl} onChange={e => setForm({...form, instagramUrl: e.target.value})} />
                    </div>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1DA1F2]" />
                      <input className="w-full bg-muted/40 border border-border rounded-xl pl-12 pr-4 py-3 text-sm" placeholder="Twitter URL" value={form.twitterUrl} onChange={e => setForm({...form, twitterUrl: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-accent-500/5 rounded-3xl p-8 border border-accent-500/10 flex items-start gap-6">
                  <div className="h-14 w-14 bg-accent-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-accent-500/20">
                    <Percent className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading mb-2">Phí chiết khấu hệ thống</h3>
                    <p className="text-muted-foreground text-sm mb-6">Đây là tỷ lệ phần trăm Admin sẽ thu trên mỗi đơn đặt phòng thành công qua hệ thống.</p>
                    <div className="flex items-center gap-4">
                      <div className="relative w-40">
                        <input 
                          type="number"
                          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-accent-500/20" 
                          value={form.commissionRate}
                          onChange={e => setForm({...form, commissionRate: Number(e.target.value)})}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">%</span>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Áp dụng cho tất cả các khách sạn</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-lg font-bold font-heading">Bảo mật & Quy trình</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl border">
                        <div>
                          <p className="font-bold">Duyệt khách sạn thủ công</p>
                          <p className="text-xs text-muted-foreground">Yêu cầu Admin duyệt trước khi hiển thị</p>
                        </div>
                        <div className="w-12 h-6 bg-accent-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl border">
                        <div>
                          <p className="font-bold">Xác thực Email khách hàng</p>
                          <p className="text-xs text-muted-foreground">Yêu cầu xác thực khi đăng ký mới</p>
                        </div>
                        <div className="w-12 h-6 bg-muted rounded-full relative cursor-pointer">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
