export default function StatsCard({ title, value, icon: Icon, description, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02] duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {description && (
          <p className="text-xs text-slate-400 mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}
