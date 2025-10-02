import React from "react";
import Card from "./ui/Card";
import { WaterIcon, StatsIcon } from "./dashboard/icon";
import { SkeletonCard } from "./ui/Loading";

interface StatsCardProps {
  title: string;
  /** Valor principal (exibe override se fornecido). */
  value?: string | number | React.ReactNode;
  /** Novo formato: valor primário destacado grande */
  valuePrimary?: string | number | React.ReactNode;
  /** Meta / sufixo menor ao lado do primário (ex: / 2000 ml) */
  valueMeta?: string | number;
  description?: string | React.ReactNode;
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
  valuePrimary,
  valueMeta,
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
          {valuePrimary ? (
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-extrabold text-gray-900 leading-none">{valuePrimary}</span>
              {valueMeta != null && (
                <span className="text-sm font-medium text-gray-500 leading-none">{valueMeta}</span>
              )}
            </div>
          ) : (
            <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          )}
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
