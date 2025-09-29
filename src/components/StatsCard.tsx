import React from "react";
import Card from "./ui/Card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  gradient?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon,
  gradient = "from-green-500 to-emerald-600",
}) => {

  return (
    <Card className="p-5 bg-gradient-to-br from-white to-gray-50/50 border-0 rounded-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-1">{title}</h4>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div className={`p-4 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
