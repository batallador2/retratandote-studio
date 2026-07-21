export const WEDDING_STATUSES = [
  { key: "propuesta_enviada", label: "Propuesta enviada", clientLabel: "Estamos preparando vuestra propuesta personalizada.", color: "bg-amber-100 text-amber-800" },
  { key: "contrato_firmado", label: "Contrato firmado", clientLabel: "Contrato firmado. ¡Vuestra fecha está en camino de quedar reservada!", color: "bg-blue-100 text-blue-800" },
  { key: "reserva_cobrada", label: "Reserva cobrada", clientLabel: "Fecha reservada en firme. Nos vemos el gran día.", color: "bg-indigo-100 text-indigo-800" },
  { key: "fotografiada", label: "Boda fotografiada", clientLabel: "¡Qué día tan bonito! Vuestras fotos ya están a salvo.", color: "bg-purple-100 text-purple-800" },
  { key: "en_edicion", label: "En edición", clientLabel: "Estamos editando vuestras fotos con todo el cariño.", color: "bg-fuchsia-100 text-fuchsia-800" },
  { key: "adelanto_entregado", label: "Adelanto entregado", clientLabel: "Ya tenéis un adelanto para compartir. La galería completa está en camino.", color: "bg-teal-100 text-teal-800" },
  { key: "galeria_entregada", label: "Galería entregada", clientLabel: "¡Vuestra galería completa está lista!", color: "bg-emerald-100 text-emerald-800" },
  { key: "cerrado", label: "Cerrado", clientLabel: "Encargo completado. Gracias por confiar en Retratándote.", color: "bg-stone-200 text-stone-700" },
];

export const statusInfo = (key) => WEDDING_STATUSES.find((s) => s.key === key) || WEDDING_STATUSES[0];

export const LEAD_STATUS_COLORS = {
  nuevo: "bg-amber-100 text-amber-800",
  contactado: "bg-blue-100 text-blue-800",
  convertido: "bg-emerald-100 text-emerald-800",
  descartado: "bg-stone-200 text-stone-600",
};

export const BLOCK_COLORS = {
  reservada: "bg-emerald-100 text-emerald-800 border-emerald-300",
  tentativa: "bg-amber-100 text-amber-800 border-amber-300",
  bloqueada: "bg-stone-200 text-stone-600 border-stone-300",
};

export const STUDIO = {
  name: "Retratándote",
  owner: "Juan José Huertas",
  email: "juanjo@retratandote.es",
  phone: "+34 637 516 633",
  web: "retratandote.es",
  location: "Madrid · Alcalá de Henares",
};

export const fmtEUR = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export const genToken = () => crypto.randomUUID();