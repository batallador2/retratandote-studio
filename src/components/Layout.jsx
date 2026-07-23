import { Outlet, NavLink } from "react-router-dom";
import HelpDialog from "@/components/HelpDialog";
import { LayoutDashboard, Inbox, KanbanSquare, CalendarDays, BarChart3, Settings, Camera, FileText, Heart } from "lucide-react";

const nav = [
  { to: "/", label: "Panel", icon: LayoutDashboard },
  { to: "/leads", label: "Solicitudes", icon: Inbox },
  { to: "/bodas", label: "Bodas", icon: Heart },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col md:flex-row">
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-[#1A1A18] text-stone-300 min-h-screen sticky top-0 h-screen">
        <div className="px-6 py-7 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#C9A84C]" />
            <span className="font-semibold text-white tracking-wide">Retratándote</span>
          </div>
          <p className="text-xs text-stone-500 mt-1">Studio CRM</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-[#C9A84C] text-[#1A1A18] font-medium" : "hover:bg-stone-800 hover:text-white"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-stone-800 text-xs text-stone-500">
          <a href="/solicitud" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#C9A84C]">
            <FileText className="w-3.5 h-3.5" /> Formulario público
          </a>
        </div>
      </aside>

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      <HelpDialog />

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#1A1A18] border-t border-stone-800 flex justify-around py-2 z-50">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${isActive ? "text-[#C9A84C]" : "text-stone-400"}`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}