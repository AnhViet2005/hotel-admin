import { DollarSign, PieChart } from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface RevenueBreakdownProps {
  adminRevenue: number;
  hotelOwnerRevenue: number;
  totalAmount: number;
  loading?: boolean;
}

export default function RevenueBreakdown({
  adminRevenue,
  hotelOwnerRevenue,
  totalAmount,
  loading = false,
}: RevenueBreakdownProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const adminPercentage = 30;
  const hotelPercentage = 70;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Phân chia doanh thu
          </h3>
          <p className="text-sm text-gray-500 mt-1">Tổng tiền: {formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* Revenue bars visualization */}
      <div className="space-y-4">
        {/* Admin Revenue */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Doanh thu nền tảng (Admin)</span>
            </div>
            <span className="font-semibold text-orange-600">{adminPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full"
              style={{ width: `${adminPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">{formatCurrency(adminRevenue)}</p>
        </div>

        {/* Hotel Owner Revenue */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Doanh thu chủ khách sạn</span>
            </div>
            <span className="font-semibold text-green-600">{hotelPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full"
              style={{ width: `${hotelPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">{formatCurrency(hotelOwnerRevenue)}</p>
        </div>
      </div>

      {/* Info box */}
      <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">Lưu ý:</span> Nền tảng nhận 30% hoa hồng từ mỗi đơn đặt phòng, 70% còn lại cho chủ khách sạn.
        </p>
      </div>
    </div>
  );
}
