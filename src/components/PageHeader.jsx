export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 md:px-10 pt-8 pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A18] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-stone-500 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}