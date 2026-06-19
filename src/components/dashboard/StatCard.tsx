import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  name: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: LucideIcon;
}

export default function StatCard({ name, value, change, changeType, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-accent-500/10 rounded-xl">
          <Icon className="h-6 w-6 text-accent-500" />
        </div>
        <span
          className={cn(
            "text-xs font-bold px-2 py-1 rounded-full",
            changeType === "increase" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}
        >
          {changeType === "increase" ? "+" : "-"}{change}%
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{name}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}
