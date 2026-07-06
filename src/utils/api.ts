import axios from 'axios';
import { getToken, removeAuth } from '@/lib/auth';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});
// Thêm token vào header của mọi request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    console.log('Attaching token to request', token);
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Request config', config);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Log the auth error and clear auth if token is invalid or expired
      console.error('Auth error status:', error.response.status);
      removeAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

export const getRecentBookings = async () => {
  const response = await api.get('/admin/recent-bookings');
  return response.data;
};

export const getRevenueBreakdown = async () => {
  const response = await api.get('/admin/revenue-breakdown');
  return response.data;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/user/profile');
  return response.data;
};

export const updateSettings = async (data: FormData) => {
  const response = await api.put('/user/settings', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ─── Hotels ───────────────────────────────────────────────────────────────────
export const getAdminHotels = async (keyword?: string) => {
  const params: any = {};
  if (keyword) params.keyword = keyword;
  const response = await api.get('/admin/hotels', { params });
  return response.data;
};

export const getHotelById = async (id: number) => {
  const response = await api.get(`/public/hotels/${id}`);
  return response.data;
};

export const createAdminHotel = async (data: any) => {
  const response = await api.post('/admin/hotels', data);
  return response.data;
};

export const updateAdminHotel = async (id: number, data: any) => {
  const response = await api.put(`/admin/hotels/${id}`, data);
  return response.data;
};

export const deleteAdminHotel = async (id: number, type: 'soft' | 'hard' = 'soft') => {
  const response = await api.delete(`/admin/hotels/${id}`, { params: { type } });
  return response.data;
};

export const approveAdminHotel = async (id: number) => {
  const response = await api.post(`/admin/hotels/${id}/approve`);
  return response.data;
};
export const toggleHotelStatus = async (id: number) => {
  const response = await api.patch(`/admin/hotels/${id}/status`);
  return response.data;
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const getAdminUsers = async (keyword?: string, role?: string) => {
  const response = await api.get('/admin/users', {
    params: { keyword, role }
  });
  return response.data;
};

export const toggleUserStatus = async (id: number) => {
  const response = await api.patch(`/admin/users/${id}/status`);
  return response.data;
};

/**
 * Xóa người dùng vĩnh viễn (Sử dụng POST để ổn định nhất)
 */
export const deleteAdminUser = async (id: number) => {
  await api.post(`/admin/users/${id}/delete`);
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const getAdminBookings = async (keyword?: string, status?: string) => {
  const params: any = {};
  if (keyword) params.keyword = keyword;
  if (status && status !== "ALL") params.status = status;
  const response = await api.get('/admin/bookings', { params });
  return response.data;
};

export const updateBookingStatus = async (id: number, status: string) => {
  const response = await api.patch(`/admin/bookings/${id}/status`, { status });
  return response.data;
};

export const deleteAdminBooking = async (id: number) => {
  await api.delete(`/admin/bookings/${id}`);
};

export const bulkDeleteAdminBookings = async (ids: number[]) => {
  await api.post('/admin/bookings/bulk-delete', ids);
};

export const getMyCustomers = async () => {
  const response = await api.get('/admin/users/my-customers');
  return response.data;
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const getAdminNotifications = async () => {
  const response = await api.get('/admin/notifications');
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/admin/notifications/unread-count');
  return response.data;
};

export const markAllRead = async () => {
  await api.patch('/admin/notifications/read-all');
};

// ─── Upload ───────────────────────────────────────────────────────────────────
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ─── Room Types ──────────────────────────────────────────────────────────────
export const getRoomTypes = async (hotelId: number) => {
  const response = await api.get(`/admin/hotels/${hotelId}/room-types`);
  return response.data;
};

export const createRoomType = async (hotelId: number, data: any) => {
  const response = await api.post(`/admin/hotels/${hotelId}/room-types`, data);
  return response.data;
};

export const updateRoomType = async (id: number, data: any) => {
  const response = await api.put(`/admin/room-types/${id}`, data);
  return response.data;
};

export const deleteRoomType = async (id: number) => {
  const response = await api.delete(`/admin/room-types/${id}`);
  return response.data;
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const getAdminReviews = async () => {
  const response = await api.get('/admin/review-management');
  return response.data;
};

export const toggleReviewPublish = async (id: number) => {
  const response = await api.patch(`/admin/review-management/${id}/publish`);
  return response.data;
};

export const deleteReview = async (id: number) => {
  const response = await api.delete(`/admin/review-management/${id}`);
  return response.data;
};

export const replyToReview = async (id: number, reply: string) => {
  const response = await api.patch(`/admin/review-management/${id}/reply`, { reply });
  return response.data;
};

export const getOwnerReviews = async () => {
  const response = await api.get('/reviews/owner');
  return response.data;
};

export const ownerReplyToReview = async (id: number, reply: string) => {
  const response = await api.patch(`/reviews/${id}/owner-reply`, { reply });
  return response.data;
};

export const getActiveContacts = async () => {
  const response = await api.get('/chat/active-contacts');
  return response.data;
};

export const getChatHistory = async (userId: number) => {
  const response = await api.get(`/chat/history/${userId}`);
  return response.data;
};
// ─── Posts ────────────────────────────────────────────────────────────────────
export const getAdminPosts = async () => {
  const response = await api.get('/admin/posts');
  return response.data;
};

export const createAdminPost = async (data: any) => {
  const response = await api.post('/admin/posts', data);
  return response.data;
};

export const updateAdminPost = async (id: number, data: any) => {
  const response = await api.put(`/admin/posts/${id}`, data);
  return response.data;
};

export const deleteAdminPost = async (id: number) => {
  const response = await api.delete(`/admin/posts/${id}`);
  return response.data;
};
// ─── Banners ──────────────────────────────────────────────────────────────────
export const getAdminBanners = async () => {
  const response = await api.get('/admin/banners');
  return response.data;
};

export const createAdminBanner = async (data: any) => {
  const response = await api.post('/admin/banners', data);
  return response.data;
};

export const updateAdminBanner = async (id: number, data: any) => {
  const response = await api.put(`/admin/banners/${id}`, data);
  return response.data;
};

export const deleteAdminBanner = async (id: number) => {
  const response = await api.delete(`/admin/banners/${id}`);
  return response.data;
};
