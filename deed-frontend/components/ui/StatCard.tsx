import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-50 text-purple-600',
};

export function StatCard({ title, value, icon, color = 'blue' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
