interface ProductItemProps {
  name: string;
  subtitle: string;
}

export default function ProductItem({ name, subtitle }: ProductItemProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-paper/80 p-4">
      <div className="h-16 w-16 rounded-2xl bg-ink/10" />
      <div>
        <p className="text-sm font-semibold text-ink">{name}</p>
        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
