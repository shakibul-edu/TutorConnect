
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  colorClass: string;
  icon: React.ElementType;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, colorClass, icon: Icon }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default StatCard;
