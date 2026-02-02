interface ProductItemProps {
  name: string;
  subtitle: string;
}

export default function ProductItem({ name, subtitle }: ProductItemProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="h-16 w-16 rounded-lg bg-slate-200" />
      <div>
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
