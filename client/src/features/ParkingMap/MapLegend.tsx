const items = [
  ["bg-parking-free", "Вільне"],
  ["bg-parking-locked", "Оплата"],
  ["bg-parking-reserved", "Зайняте"],
  ["bg-parking-maintenance", "Ремонт"],
];

export function MapLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map(([color, label]) => (
        <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
          <span className={`h-3 w-3 rounded ${color}`} />
          {label}
        </div>
      ))}
    </div>
  );
}
