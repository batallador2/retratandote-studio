export default function PortalSection({ overline, title, children, className = "" }) {
  return (
    <section className={`bg-white rounded-3xl shadow-[0_2px_20px_rgba(26,26,24,0.05)] p-8 md:p-10 ${className}`}>
      {overline && <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#C9A84C] mb-2">{overline}</p>}
      {title && <h2 className="font-display text-3xl text-[#1A1A18] mb-6">{title}</h2>}
      {children}
    </section>
  );
}