import React from 'react';

type RecentActivityProps = {
  items: string[];
};

export default function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-300 hover:shadow-md transition">
      <h3 className="text-lg font-semibold text-blue-700 mb-2">🕒 Recent Activity</h3>
      <ul className="list-disc pl-5 text-gray-600 space-y-1">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
