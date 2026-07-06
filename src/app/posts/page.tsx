"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Hotel
} from "lucide-react";
import {
  getAdminPosts,
  createAdminPost,
  updateAdminPost,
  deleteAdminPost,
  getAdminHotels,
  uploadFile
} from "@/utils/api";
import { cn } from "@/lib/utils";

interface Post {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  hotels: {
    id: number;
    hotelName: string;
  }[];
}

interface PostForm {
  title: string;
  subtitle: string;
  content: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  hotels: { id: number; hotelName: string }[];
}

const EMPTY_POST: PostForm = {
  title: "",
  subtitle: "",
  content: "",
  imageUrl: "",
  displayOrder: 0,
  isActive: true,
  hotels: []
};


export default function PostManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isHotelsOpen, setIsHotelsOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [form, setForm] = useState<PostForm>(EMPTY_POST);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosts();
    fetchHotels();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getAdminPosts();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const data = await getAdminHotels();
      setHotels(data);
    } catch (err) {
      console.error("Failed to fetch hotels:", err);
    }
  };

  const handleOpenAdd = () => {
    setEditingPost(null);
    setForm(EMPTY_POST);
    setError("");
    setShowModal(true);
    setIsHotelsOpen(false);
  };

  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      subtitle: post.subtitle,
      content: post.content,
      imageUrl: post.imageUrl,
      displayOrder: post.displayOrder,
      isActive: post.isActive,
      hotels: post.hotels || []
    });
    setError("");
    setShowModal(true);
    setIsHotelsOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const result = await uploadFile(file);
      setForm(f => ({ ...f, imageUrl: result.url }));
    } catch (err: any) {
      setError("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.imageUrl) {
      setError("Vui lòng nhập tiêu đề và tải lên hình ảnh.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editingPost) {
        await updateAdminPost(editingPost.id, form);
      } else {
        await createAdminPost(form);
      }
      setShowModal(false);
      fetchPosts();
    } catch (err: any) {
      setError("Đã xảy ra lỗi khi lưu bài viết.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await deleteAdminPost(id);
      fetchPosts();
    } catch (err) {
      alert("Không thể xóa bài viết.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Status</h1>
          <p className="text-muted-foreground">Các bài viết này sẽ hiển thị cho người dùng, kèm theo thông tin khách sạn liên quan.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-accent-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-accent-500/20 hover:bg-accent-600 transition-all transform hover:-translate-y-1"
        >
          <Plus className="h-5 w-5" />
          Thêm bài viết mới
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-accent-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-[32px] p-20 text-center space-y-4">
          <div className="h-20 w-20 bg-muted rounded-[28px] flex items-center justify-center mx-auto text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
          </div>
          <div>
            <p className="text-xl font-bold">Chưa có bài viết nào</p>
            <p className="text-muted-foreground">Nhấp vào nút phía trên để bắt đầu tạo nội dung.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="group bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                  <h3 className="text-xl font-heading font-bold text-white mb-1">{post.title}</h3>
                  <p className="text-white/80 text-sm font-medium">{post.subtitle}</p>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => handleOpenEdit(post)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-blue-600 shadow-lg hover:bg-white transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-red-600 shadow-lg hover:bg-white transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="absolute top-4 left-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    post.isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  )}>
                    {post.isActive ? "Đang bật" : "Đang tắt"}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold mb-2 uppercase tracking-widest">
                    <GripVertical className="h-3 w-3" />
                    Thứ tự: {post.displayOrder}
                  </div>
                  {post.hotels && post.hotels.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.hotels.map(h => (
                        <div key={h.id} className="flex items-center gap-2 text-accent-500 text-[10px] font-bold bg-accent-500/10 p-1 px-2 rounded-lg border border-accent-500/20 truncate">
                          <Hotel className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{h.hotelName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card rounded-[32px] border shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col">
            <div className="flex justify-between items-center p-8 border-b">
              <div>
                <h2 className="text-2xl font-bold font-heading">
                  {editingPost ? "Cập nhật bài viết" : "Thêm bài viết mới"}
                </h2>
                <p className="text-sm text-muted-foreground">Thiết lập thông tin hiển thị cho bài viết.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-muted rounded-2xl transition-all">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-2xl text-sm font-medium flex items-center gap-3">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground ml-1">Hình ảnh bìa *</label>
                  {form.imageUrl ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border bg-muted group">
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-neutral-100 transition-all">
                          Thay đổi ảnh
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                        <button
                          onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                          className="bg-red-600 text-white p-2 rounded-xl shadow-md hover:bg-red-700 transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className={cn(
                      "flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-2xl cursor-pointer hover:bg-muted/30 transition-all",
                      uploading ? "pointer-events-none opacity-60" : "hover:border-accent-500/50"
                    )}>
                      {uploading ? (
                        <Loader2 className="h-10 w-10 text-accent-500 animate-spin" />
                      ) : (
                        <>
                          <div className="p-3 bg-accent-500/10 rounded-xl mb-3 text-accent-500">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-bold text-foreground">Tải ảnh bìa lên</p>
                          <p className="text-xs text-muted-foreground">Kích thước gợi ý: 800x1000px</p>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">Tiêu đề *</label>
                    <input
                      className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-accent-500/20 outline-none transition-all"
                      placeholder="VD: Khám phá vẻ đẹp Phú Quốc"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">Phụ đề (Mô tả ngắn)</label>
                    <input
                      className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-accent-500/20 outline-none transition-all"
                      placeholder="VD: Những địa điểm không thể bỏ qua"
                      value={form.subtitle}
                      onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">Nội dung bài viết</label>
                    <textarea
                      className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-accent-500/20 outline-none transition-all min-h-[150px] resize-none"
                      placeholder="Nhập nội dung bài viết..."
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div
                      className="flex justify-between items-center ml-1 cursor-pointer group"
                      onClick={() => setIsHotelsOpen(!isHotelsOpen)}
                    >
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Các khách sạn liên quan</label>
                        <span className="text-[10px] bg-accent-500/10 text-accent-500 px-2 py-0.5 rounded-full font-bold">
                          Đã chọn {form.hotels.length}
                        </span>
                      </div>
                      <div className={cn(
                        "p-1.5 rounded-lg bg-muted/50 text-muted-foreground transition-all",
                        isHotelsOpen ? "rotate-180 bg-accent-500/10 text-accent-500" : ""
                      )}>
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>

                    {isHotelsOpen && (
                      <div className="border border-border rounded-2xl overflow-hidden bg-muted/20 animate-in slide-in-from-top-2 duration-300">
                        <div className="p-3 border-b border-border bg-muted/40 flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Tìm kiếm khách sạn..."
                            className="bg-transparent border-none outline-none text-sm w-full"
                          />
                        </div>

                        <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
                          {hotels.map((h: any) => {
                            const isSelected = form.hotels.some(selected => selected.id === h.id);
                            return (
                              <button
                                key={h.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setForm(f => ({ ...f, hotels: f.hotels.filter(sh => sh.id !== h.id) }));
                                  } else {
                                    setForm(f => ({ ...f, hotels: [...f.hotels, { id: h.id, hotelName: h.name }] }));
                                  }
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between p-3 rounded-xl text-sm transition-all",
                                  isSelected
                                    ? "bg-accent-500 text-white shadow-md shadow-accent-500/20"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                                    isSelected ? "bg-white border-white text-accent-500" : "border-border bg-white"
                                  )}>
                                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                                  </div>
                                  <span className="font-medium">{h.name}</span>
                                </div>
                                {isSelected && <span className="text-[10px] font-black uppercase opacity-70">Đang chọn</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!isHotelsOpen && form.hotels.length > 0 && (
                      <div className="flex flex-wrap gap-2 ml-1">
                        {form.hotels.map(h => (
                          <span key={h.id} className="text-[10px] font-bold text-accent-500 bg-accent-500/5 px-2 py-1 rounded-lg border border-accent-500/10 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {h.hotelName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">Thứ tự hiển thị</label>
                    <input
                      type="number"
                      className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-accent-500/20 outline-none transition-all"
                      value={form.displayOrder}
                      onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">Trạng thái</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setForm(f => ({ ...f, isActive: true }))}
                        className={cn(
                          "flex-1 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                          form.isActive ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        <Eye className="h-4 w-4" /> Bật
                      </button>
                      <button
                        onClick={() => setForm(f => ({ ...f, isActive: false }))}
                        className={cn(
                          "flex-1 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                          !form.isActive ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        <EyeOff className="h-4 w-4" /> Tắt
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex gap-4 p-8 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-4 rounded-2xl border border-border font-bold hover:bg-muted transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-[2] bg-accent-500 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-accent-500/20 hover:bg-accent-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {editingPost ? "Cập nhật bài viết" : "Lưu bài viết"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
