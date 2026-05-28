interface StatusBadgeProps {
  status: string;
}

const colorMap: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Sent: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-teal-100 text-teal-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
  Cancelled: 'bg-red-100 text-red-600',
  Domestic: 'bg-amber-100 text-amber-700',
  International: 'bg-teal-100 text-teal-700',
  FOB: 'bg-blue-100 text-blue-700',
  CIF: 'bg-teal-100 text-teal-700',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
