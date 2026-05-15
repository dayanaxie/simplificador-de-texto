import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

const navItems = [
  { label: "Panel de simplificación", path: "/simplifyText" }, 
  { label: "Textos guardados", path: "/saved-texts" },
  { label: "Diccionario personal", path: "/personal-dictionary" },
  { label: "Estadísticas personales", path: "/personal-statistics" },
  { label: "Perfil", path: "/profile" },
];

export default function NavbarRegister() {
  const location = useLocation();

  return (
    <nav className="w-full bg-navy border-b border-navy">
      <div className="w-full px-4 md:px-8 flex items-end h-[70px] md:h-[90px] overflow-x-auto justify-end">
        <div className="flex items-end gap-1 md:gap-2">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col justify-end items-center pb-0 px-3 md:px-4 h-[46px] shrink-0 group transition-colors`}
              >
                <span
                  className={`font-roboto font-medium text-base md:text-xl leading-5 tracking-[0.1px] text-white whitespace-nowrap pb-3`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-white rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
