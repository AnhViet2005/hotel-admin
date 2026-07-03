"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Star, MapPin, Hotel as HotelIcon, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, X, Check, Upload, Bed
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAdminHotels, createAdminHotel, updateAdminHotel, deleteAdminHotel, uploadFile, approveAdminHotel,
  getRoomTypes, createRoomType, updateRoomType, deleteRoomType
} from "@/utils/api";
import { isAdmin } from "@/lib/auth";

interface Hotel {
  id: number;
  name: string;
  location: string;
  rating: number;
  price: string;
  basePrice?: number;
  status: string;
  rooms: number;
  isApproved?: boolean;
  image: string;
  description: string;
  addressLine: string;
  phone: string;
  email: string;
}

const EMPTY_FORM = {
  name: "", description: "", addressLine: "", city: "", district: "", ward: "",
  rating: 4, phone: "", email: "", imageUrl: "", isActive: true, basePrice: 0,
};

const EMPTY_ROOM_FORM = {
  typeName: "", description: "", basePrice: 1000000, maxAdults: 2, maxChildren: 1, totalRooms: 5, roomSize: 28.5, imageUrls: [] as string[]
};

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Confirm delete
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const result = await uploadFile(file);
      setForm(f => ({ ...f, imageUrl: result.url }));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  // Room Type states
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<any | null>(null);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM_FORM);
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [roomUploading, setRoomUploading] = useState(false);

  const handleRoomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (roomForm.imageUrls.length >= 4) {
      setRoomError("Chỉ được tải lên tối đa 4 ảnh cho mỗi loại phòng.");
      return;
    }

    setRoomUploading(true);
    setRoomError("");
    try {
      const result = await uploadFile(file);
      setRoomForm(rf => ({ ...rf, imageUrls: [...rf.imageUrls, result.url] }));
    } catch (err: any) {
      setRoomError(err?.response?.data?.message || "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setRoomUploading(false);
    }
  };

  const removeRoomImage = (index: number) => {
    setRoomForm(rf => ({
      ...rf,
      imageUrls: rf.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const openRoomManagement = async (h: Hotel) => {
    setSelectedHotel(h);
    setShowRoomModal(true);
    setEditingRoomType(null);
    setRoomError("");
    await fetchRoomTypes(h.id);
  };

  const fetchRoomTypes = async (hotelId: number) => {
    console.log("Fetching room types for hotel ID:", hotelId);
    setLoadingRooms(true);
    try {
      const data = await getRoomTypes(hotelId);
      console.log("API returned room types:", data);
      if (Array.isArray(data)) {
        setRoomTypes(data);
      } else {
        console.error("API returned non-array data:", data);
        setRoomTypes([]);
      }
    } catch (err) {
      console.error("Error in getRoomTypes API call:", err);
      setRoomTypes([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleEditRoomType = (rt: any) => {
    setEditingRoomType(rt);
    setRoomForm({
      typeName: rt.typeName,
      description: rt.description || "",
      basePrice: rt.basePrice || 0,
      maxAdults: rt.maxAdults || 2,
      maxChildren: rt.maxChildren || 0,
      totalRooms: rt.totalRooms || 0,
      roomSize: rt.roomSize || 0,
      imageUrls: rt.imageUrls || []
    });
    setRoomError("");
  };

  const handleAddRoomTypeClick = () => {
    setEditingRoomType({});
    setRoomForm(EMPTY_ROOM_FORM);
    setRoomError("");
  };

  const handleSaveRoomType = async () => {
    if (!roomForm.typeName.trim()) { setRoomError("Tên loại phòng không được để trống."); return; }
    if (roomForm.basePrice <= 0) { setRoomError("Giá cơ bản phải lớn hơn 0."); return; }
    if (roomForm.totalRooms <= 0) { setRoomError("Số lượng phòng phải lớn hơn 0."); return; }
    if (!selectedHotel) return;

    setSavingRoom(true);
    setRoomError("");
    try {
      if (editingRoomType?.id) {
        await updateRoomType(editingRoomType.id, roomForm);
      } else {
        await createRoomType(selectedHotel.id, roomForm);
      }
      setEditingRoomType(null);
      await fetchRoomTypes(selectedHotel.id);
      fetchHotels(); // Refresh main list to show updated total rooms and min price
    } catch (err: any) {
      setRoomError(err?.response?.data?.message || "Đã xảy ra lỗi khi lưu loại phòng.");
    } finally {
      setSavingRoom(false);
    }
  };

  const handleDeleteRoomType = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa loại phòng này?")) return;
    if (!selectedHotel) return;
    try {
      await deleteRoomType(id);
      await fetchRoomTypes(selectedHotel.id);
      fetchHotels(); // Refresh main list
    } catch (err: any) {
      alert(err?.response?.data?.message || "Không thể xóa loại phòng.");
    }
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminHotels(debouncedSearch || undefined);
      setHotels(data);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  const openAdd = () => {
    setEditingHotel(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (h: Hotel) => {
    setEditingHotel(h);
    const [city, district] = h.location.split(", ");
    setForm({
      name: h.name, description: h.description || "",
      addressLine: h.addressLine || "", city: city || "",
      district: district || "", ward: "",
      rating: h.rating || 4, phone: h.phone || "",
      email: h.email || "", imageUrl: h.image || "", isActive: h.status === "active",
      basePrice: h.basePrice || 0,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Tên khách sạn không được để trống."); return; }
    setSaving(true);
    setError("");
    try {
      if (editingHotel) {
        await updateAdminHotel(editingHotel.id, form);
      } else {
        await createAdminHotel(form);
      }
      setShowModal(false);
      fetchHotels();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      console.log('Xóa hotel id:', id);
      await deleteAdminHotel(id, 'hard');
      setDeletingId(null);
      fetchHotels();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Không thể xóa khách sạn. Có thể khách sạn này đang có dữ liệu liên quan (phòng, đặt phòng) không thể xóa vĩnh viễn.";
      alert(msg);
      setDeletingId(null);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveAdminHotel(id);
      fetchHotels();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Không thể phê duyệt khách sạn.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Quản lý khách sạn</h1>
          <p className="text-muted-foreground">
            {loading ? "Đang tải..." : `${hotels.length} khách sạn trong hệ thống.`}
          </p>
        </div>
        {!isAdmin() && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-accent-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-accent-500/20 hover:bg-accent-600 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Thêm khách sạn
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center bg-card p-4 rounded-xl border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên khách sạn hoặc thành phố..."
            className="w-full bg-muted border-none rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Hotel List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Không tìm thấy khách sạn nào.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              className="bg-card rounded-2xl border p-4 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex gap-6">
                {/* Image */}
                <div className="w-48 h-36 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
                  {hotel.image ? (
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HotelIcon className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3 text-accent-500 fill-accent-500" />
                    {hotel.rating}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold font-heading mb-1">{hotel.name}</h2>
                      <div className="flex items-center text-muted-foreground text-sm gap-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" /> {hotel.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <HotelIcon className="h-4 w-4" /> {hotel.rooms} phòng
                        </span>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openRoomManagement(hotel)}
                        className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 rounded-lg transition-colors"
                        title="Quản lý loại phòng"
                      >
                        <Bed className="h-4 w-4" />
                      </button>
                      {!isAdmin() && (
                        <button
                          onClick={() => openEdit(hotel)}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      
                      {isAdmin() && !hotel.isApproved && (
                        <button
                          onClick={() => handleApprove(hotel.id)}
                          className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded-lg transition-colors"
                          title="Duyệt khách sạn"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      )}

                      {isAdmin() && !hotel.isApproved && (
                        <button
                          onClick={() => handleApprove(hotel.id)}
                          className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded-lg transition-colors"
                          title="Duyệt khách sạn"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      )}

                      <button
                        onClick={() => setDeletingId(hotel.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Từ</p>
                      <p className="text-xl font-bold text-accent-500">
                        {hotel.price}<span className="text-sm font-medium text-muted-foreground">/đêm</span>
                      </p>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
                      hotel.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30"
                    )}>
                      {hotel.status === "active" ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      {hotel.status === "active" ? "Hoạt động" : "Vô hiệu hóa"}
                    </span>

                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
                      hotel.isApproved
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                    )}>
                      {hotel.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold font-heading">
                {editingHotel ? "Sửa khách sạn" : "Thêm khách sạn mới"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-xl text-sm">{error}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Tên khách sạn *</label>
                  <input className="input-field w-full" placeholder="VD: Sofitel Legend Metropole Hanoi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Thành phố</label>
                  <input className="input-field w-full" placeholder="VD: Hà Nội" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Quận / Huyện</label>
                  <input className="input-field w-full" placeholder="VD: Hoàn Kiếm" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Địa chỉ</label>
                  <input className="input-field w-full" placeholder="VD: 15 Ngô Quyền" value={form.addressLine} onChange={e => setForm(f => ({ ...f, addressLine: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Số điện thoại</label>
                  <input className="input-field w-full" placeholder="VD: 0901234567" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
                  <input className="input-field w-full" type="email" placeholder="VD: info@hotel.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Đánh giá sao</label>
                  <select className="input-field w-full" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} sao</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Trạng thái</label>
                  <select className="input-field w-full" value={form.isActive ? "true" : "false"} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === "true" }))}>
                    <option value="true">Hoạt động</option>
                    <option value="false">Vô hiệu hóa</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Giá khởi điểm (VNĐ)</label>
                  <input 
                    className="input-field w-full font-bold text-accent-500" 
                    type="number" 
                    placeholder="VD: 4500000" 
                    value={form.basePrice} 
                    onChange={e => setForm(f => ({ ...f, basePrice: Number(e.target.value) }))} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Ảnh đại diện khách sạn *</label>
                  
                  {form.imageUrl ? (
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden border bg-muted group">
                      <img 
                        src={form.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-neutral-100 transition-colors">
                          Thay đổi ảnh
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload} 
                            disabled={uploading}
                          />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                          className="bg-red-600 text-white p-2 rounded-xl shadow-md hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className={cn(
                      "flex flex-col items-center justify-center h-48 w-full border-2 border-dashed rounded-2xl cursor-pointer hover:bg-muted/30 transition-all",
                      uploading ? "pointer-events-none opacity-60" : "hover:border-accent-500/50"
                    )}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                        {uploading ? (
                          <>
                            <Loader2 className="h-10 w-10 text-accent-500 animate-spin mb-3" />
                            <p className="text-sm font-bold text-neutral-300">Đang tải ảnh lên...</p>
                          </>
                        ) : (
                          <>
                            <div className="p-3 bg-accent-500/10 rounded-xl mb-3 text-accent-500">
                              <Upload className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-bold text-foreground mb-1">Tải ảnh đại diện lên</p>
                            <p className="text-xs text-muted-foreground">Kéo thả hoặc nhấp để chọn tệp (Hỗ trợ JPG, PNG, WEBP)</p>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Mô tả</label>
                  <textarea className="input-field w-full resize-none" rows={3} placeholder="Mô tả ngắn về khách sạn..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-muted transition-colors">
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl bg-accent-500 text-white font-bold hover:bg-accent-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editingHotel ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="h-14 w-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold">Xóa khách sạn?</h3>
            <p className="text-sm text-muted-foreground">Khách sạn sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2.5 rounded-xl border font-bold hover:bg-muted transition-colors">Hủy</button>
              <button onClick={() => handleDelete(deletingId)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Room Type Management Modal */}
      {showRoomModal && selectedHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-bold font-heading">Quản lý loại phòng</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedHotel.name}</p>
              </div>
              <button 
                onClick={() => setShowRoomModal(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Form to Add/Edit */}
              {editingRoomType !== null ? (
                <div className="bg-muted/40 border rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2">
                    <Bed className="h-5 w-5 text-accent-500" />
                    {editingRoomType.id ? "Sửa loại phòng" : "Thêm loại phòng mới"}
                  </h4>
                  
                  {roomError && (
                    <div className="p-3 bg-red-100 border border-red-200 dark:bg-red-900/30 dark:border-red-900 text-red-600 rounded-xl text-sm font-medium">
                      {roomError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Tên loại phòng *</label>
                      <input 
                        className="input-field w-full" 
                        placeholder="VD: Phòng Deluxe Giường Đôi" 
                        value={roomForm.typeName} 
                        onChange={e => setRoomForm(r => ({ ...r, typeName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Giá cơ bản (VNĐ) *</label>
                      <input 
                        className="input-field w-full" 
                        type="number" 
                        placeholder="VD: 1200000" 
                        value={roomForm.basePrice} 
                        onChange={e => setRoomForm(r => ({ ...r, basePrice: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Số lượng phòng *</label>
                      <input 
                        className="input-field w-full" 
                        type="number" 
                        placeholder="VD: 10" 
                        value={roomForm.totalRooms} 
                        onChange={e => setRoomForm(r => ({ ...r, totalRooms: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Diện tích (m²)</label>
                      <input 
                        className="input-field w-full" 
                        type="number" 
                        step="0.1" 
                        placeholder="VD: 32" 
                        value={roomForm.roomSize} 
                        onChange={e => setRoomForm(r => ({ ...r, roomSize: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Số người lớn tối đa</label>
                      <input 
                        className="input-field w-full" 
                        type="number" 
                        placeholder="VD: 2" 
                        value={roomForm.maxAdults} 
                        onChange={e => setRoomForm(r => ({ ...r, maxAdults: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Số trẻ em tối đa</label>
                      <input 
                        className="input-field w-full" 
                        type="number" 
                        placeholder="VD: 1" 
                        value={roomForm.maxChildren} 
                        onChange={e => setRoomForm(r => ({ ...r, maxChildren: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-sm font-medium text-muted-foreground mb-1 block">Mô tả loại phòng</label>
                       <textarea 
                         className="input-field w-full resize-none" 
                         rows={2} 
                         placeholder="Mô tả tiện nghi phòng..." 
                         value={roomForm.description} 
                         onChange={e => setRoomForm(r => ({ ...r, description: e.target.value }))}
                       />
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-muted-foreground">Ảnh loại phòng</label>
                        <span className="text-xs text-muted-foreground">{roomForm.imageUrls.length}/4</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {roomForm.imageUrls.map((url, idx) => (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border bg-muted group">
                            <img src={url} alt={`Room ${idx}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                type="button" 
                                onClick={() => removeRoomImage(idx)}
                                className="bg-red-600 text-white p-1.5 rounded-lg shadow-md hover:bg-red-700 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            {idx === 0 && (
                              <div className="absolute top-1 left-1 bg-accent-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase">
                                Chính
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {roomForm.imageUrls.length < 4 && (
                          <label className={cn(
                            "flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition-all",
                            roomUploading ? "pointer-events-none opacity-60" : "hover:border-accent-500/50"
                          )}>
                            {roomUploading ? (
                              <Loader2 className="h-5 w-5 text-accent-500 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-5 w-5 text-accent-500 mb-1" />
                                <span className="text-[10px] font-bold text-muted-foreground">Thêm ảnh</span>
                              </>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={handleRoomImageUpload} disabled={roomUploading} />
                          </label>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setEditingRoomType(null)} 
                      className="px-4 py-2 rounded-xl border text-sm font-bold hover:bg-muted transition-colors"
                    >
                      Hủy form
                    </button>
                    <button 
                      type="button" 
                      onClick={handleSaveRoomType}
                      disabled={savingRoom || roomUploading}
                      className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-bold hover:bg-accent-600 transition-colors flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {savingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            ) : (
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-base">Danh sách loại phòng ({roomTypes.length})</h4>
                  {!isAdmin() && (
                    <button 
                      onClick={handleAddRoomTypeClick}
                      className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-bold hover:bg-accent-600 transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Thêm loại phòng
                    </button>
                  )}
                </div>
              )}

              {/* Room Types Table */}
              {loadingRooms ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-accent-500 animate-spin" />
                </div>
              ) : roomTypes.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/20">
                  <Bed className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-bold text-muted-foreground text-sm">Chưa có loại phòng nào</p>
                  <p className="text-xs text-muted-foreground/80 mt-1">Hãy thêm loại phòng đầu tiên để người dùng có thể đặt phòng.</p>
                </div>
              ) : (
                <div className="border rounded-2xl overflow-hidden bg-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b text-xs font-bold text-muted-foreground uppercase">
                        <th className="p-4">Ảnh</th>
                        <th className="p-4">Tên loại phòng</th>
                        <th className="p-4">Số phòng</th>
                        <th className="p-4">Giá cơ bản</th>
                        <th className="p-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {Array.isArray(roomTypes) && roomTypes.map((rt: any) => (
                        <tr key={rt.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4">
                            <div className="w-16 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 border">
                              {rt.imageUrls && rt.imageUrls.length > 0 ? (
                                <img src={rt.imageUrls[0]} alt={rt.typeName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Bed className="h-5 w-5 text-muted-foreground/20" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-foreground">
                            <div>
                              {rt.typeName}
                              {rt.description && (
                                <p className="font-normal text-xs text-muted-foreground/80 mt-0.5 line-clamp-1">{rt.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-accent-500">{rt.totalRooms} phòng</td>
                          <td className="p-4 font-bold">
                            {String(rt.basePrice || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isAdmin() && (
                                <button 
                                  onClick={() => handleEditRoomType(rt)}
                                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                                  title="Sửa loại phòng"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteRoomType(rt.id)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                                title="Xóa loại phòng"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-muted/20 flex justify-end">
              <button 
                onClick={() => setShowRoomModal(false)}
                className="px-6 py-2.5 rounded-xl bg-foreground text-background font-bold hover:opacity-90 transition-opacity"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
