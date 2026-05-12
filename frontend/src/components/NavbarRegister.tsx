import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

const navItems = [
  { label: "Panel de simplificación", path: "/simplify" }, 
  { label: "Textos guardados", path: "/saved-texts" },
  { label: "Diccionario personal", path: "/personal-dictionary" },
  { label: "Estadísticas personales", path: "/personal-statistics" },
  { label: "Perfil", path: "/profile" },
];

export default function NavbarRegister() {
  const location = useLocation();

  return (
    <nav className="w-full bg-navy h-[90px] flex items-end justify-center px-6 sm:px-12 border-b border-navy">
      <div className="flex items-end gap-2 sm:gap-4 pb-0 overflow-x-auto max-w-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-end h-[46px] px-4 font-roboto font-medium text-white text-sm sm:text-xl transition-colors shrink-0",
                isActive ? "text-white" : "text-white/80 hover:text-white"
              )}
            >
              <span className="pb-[14px] whitespace-nowrap">
                {item.label}
              </span>

              {isActive && (
                <span className="absolute bottom-0 left-[2px] right-[2px] h-[3px] bg-white rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}