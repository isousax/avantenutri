import React from "react";
import Card from "./ui/Card";
import { WaterIcon, StatsIcon } from "./dashboard/icon";
import { SkeletonCard } from "./ui/Loading";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: string;
  gradient?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon,
  gradient = "from-green-500 to-emerald-600",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonCard lines={3} className="h-32" />;
  }
  return (
    <Card className="p-5 bg-gradient-to-br from-white to-gray-50/50 border-0 rounded-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-1">{title}</h4>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div
          className={`p-4 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
        >
          <span className="text-xl">
            {icon === "water" ? (
              <WaterIcon className="w-8 h-8" />
            ) : icon === "stats" ? (
              <StatsIcon className="w-8 h-8" />
            ) : (
              "❓"
            )}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
