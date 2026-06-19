"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Loader2, EyeOff, Eye, Trash2, Star, Hotel, User as UserIcon,
  Calendar, MessageSquare, Send, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminReviews, toggleReviewPublish, deleteReview, replyToReview } from "@/utils/api";

interface Review {
  id: number;
  userName: string;
  hotelName: string;
  rating: number;
  comment: string;
  isPublished: boolean;
  adminReply?: string;
  adminRepliedAt?: string;
  createdAt: string;
}


export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Reply state
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminReviews();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggle = async (id: number) => {
    setTogglingId(id);
    try {
      const updated = await toggleReviewPublish(id);
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isPublished: updated.isPublished } : r))
      );
    } catch (error) {
      console.error("Failed to toggle review:", error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) return;
    setDeletingId(id);
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || "Không thể xóa đánh giá.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenReply = (review: Review) => {
    setReplyingId(review.id);
    setReplyText(review.adminReply || "");
  };

  const handleSendReply = async () => {
    if (!replyingId) return;
    setSendingReply(true);
    try {
      const updated = await replyToReview(replyingId, replyText);
      setReviews((prev) =>
        prev.map((r) => (r.id === replyingId ? { ...r, adminReply: updated.adminReply, adminRepliedAt: updated.adminRepliedAt } : r))
      );
      setReplyingId(null);
    } catch (error: any) {
      alert("Không thể gửi phản hồi.");
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (s: string) =>
    s ? new Date(s).toLocaleDateString("vi-VN") : "—";

  const filteredReviews = reviews.filter((r) => {
    const term = debouncedSearch.toLowerCase();
    return (
      (r.hotelName && r.hotelName.toLowerCase().includes(term)) ||
      (r.userName && r.userName.toLowerCase().includes(term)) ||
      (r.comment && r.comment.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Đánh giá</h1>
          <p className="text-muted-foreground">
            {loading ? "Đang tải..." : `${filteredReviews.length} đánh giá trong hệ thống.`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-card p-4 rounded-xl border">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo khách sạn, người dùng hoặc nội dung..."
            className="w-full bg-muted border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Không tìm thấy đánh giá nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-card rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Rating + Status */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 px-2.5 py-1 rounded-lg text-sm font-bold">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{review.rating}/5</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", review.isPublished ? "bg-green-500" : "bg-red-500")} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {review.isPublished ? "Hiển thị" : "Đã ẩn"}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div className="flex-1 mb-4">
                {review.comment ? (
                  <p className="text-sm text-foreground line-clamp-4 italic">"{review.comment}"</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Không có nhận xét.</p>
                )}
              </div>

              {/* Admin Reply */}
              {review.adminReply && (
                <div className="mb-4 bg-accent-50 dark:bg-accent-950/20 border border-accent-200 dark:border-accent-800 rounded-xl p-3">
                  <p className="text-xs font-bold text-accent-600 mb-1">Phản hồi của quản trị viên:</p>
                  <p className="text-sm text-foreground">{review.adminReply}</p>
                  {review.adminRepliedAt && (
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(review.adminRepliedAt)}</p>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="space-y-2 mb-5 pt-4 border-t">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Hotel className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate font-medium text-foreground">{review.hotelName || "—"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <UserIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{review.userName || "Khách ẩn danh"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{formatDate(review.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                {/* Reply */}
                <button
                  onClick={() => handleOpenReply(review)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {review.adminReply ? "Sửa phản hồi" : "Phản hồi"}
                </button>

                {/* Hide/Show */}
                <button
                  onClick={() => handleToggle(review.id)}
                  disabled={togglingId === review.id}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors",
                    review.isPublished
                      ? "text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                      : "text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                  )}
                >
                  {togglingId === review.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : review.isPublished ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {review.isPublished ? "Ẩn" : "Hiện"}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  {deletingId === review.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {replyingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-card rounded-2xl border shadow-2xl p-6 relative">
            <button
              onClick={() => setReplyingId(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-1">Phản hồi đánh giá</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Phản hồi của bạn sẽ được hiển thị công khai dưới đánh giá này.
            </p>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Cảm ơn quý khách đã tin tưởng và lựa chọn..."
              className="w-full rounded-xl border border-border bg-muted p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setReplyingId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSendReply}
                disabled={sendingReply}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 transition-colors disabled:opacity-50"
              >
                {sendingReply ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
