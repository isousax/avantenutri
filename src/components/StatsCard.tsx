import React from 'react';
import Card from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, description, icon, trend }) => {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          {icon && (
            <div className="flex-shrink-0 bg-brand-100 rounded-md p-3">
              {icon}
            </div>
          )}
          <div className="flex-1 ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {trend && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <svg
                    className={`self-center flex-shrink-0 h-5 w-5 ${
                      trend.isPositive ? 'text-green-500' : 'text-red-500'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d={trend.isPositive
                        ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                        : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                      }
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="sr-only">
                    {trend.isPositive ? 'Aumentou' : 'Diminuiu'} em
                  </span>
                  {trend.value}%
                </div>
              )}
            </dd>
          </div>
        </div>
        {description && (
          <p className="mt-3 text-sm text-gray-600">{description}</p>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;