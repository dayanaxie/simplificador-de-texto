import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const navItems = [
  { label: "Panel de simplificación", path: "/simplifyText" },
  { label: "Textos guardados", path: "/saved-texts" },
  { label: "Diccionario personal", path: "/personal-dictionary" },
  { label: "Estadísticas personales", path: "/personal-statistics" },
];

export default function NavbarRegister() {
  const location = useLocation();
  const navigate = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuAbierto) {
        setMenuAbierto(false);
        btnRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuAbierto]);

  const cerrarSesion = async () => {
    setCerrando(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error al cerrar sesión:", error.message);
      setCerrando(false);
      return;
    }

    navigate("/");
  };

  const perfilActivo = location.pathname.startsWith("/profile");

  return (
    <nav className="w-full bg-navy border-b border-navy relative z-50">
      <div className="w-full px-4 md:px-8 flex items-end h-[70px] md:h-[90px] justify-end overflow-visible">
        <div className="flex items-end gap-1 md:gap-2 overflow-visible">
          {/* Links normales del navbar */}
          <div className="flex items-end gap-1 md:gap-2 overflow-x-auto overflow-y-visible">
            {navItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col justify-end items-center pb-0 px-3 md:px-4 h-[46px] shrink-0 group transition-colors"
                >
                  <span className="font-roboto font-medium text-base md:text-xl leading-5 tracking-[0.1px] text-white whitespace-nowrap pb-3">
                    {item.label}
                  </span>

                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-white rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Perfil con dropdown */}
          <div className="relative shrink-0 overflow-visible" ref={menuRef}>
            <button
              ref={btnRef}
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-haspopup="true"
              aria-expanded={menuAbierto}
              aria-controls="menu-perfil"
              className="relative flex flex-col justify-end items-center pb-0 px-3 md:px-4 h-[46px] shrink-0 group transition-colors"
            >
              <span className="font-roboto font-medium text-base md:text-xl leading-5 tracking-[0.1px] text-white whitespace-nowrap pb-3 flex items-center gap-1">
                Perfil

                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={
                    "transition-transform duration-200 " +
                    (menuAbierto ? "rotate-180" : "")
                  }
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>

              {perfilActivo && (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-white rounded-t-full" />
              )}
            </button>

            {menuAbierto && (
              <div
                id="menu-perfil"
                role="menu"
                aria-label="Opciones de perfil"
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-border z-[9999] overflow-hidden"
              >
                <Link
                  to="/profile"
                  role="menuitem"
                  onClick={() => setMenuAbierto(false)}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:bg-muted transition-colors"
                >
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>

                  Mi perfil
                </Link>

                <div className="border-t border-border" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={cerrarSesion}
                  disabled={cerrando}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-destructive hover:bg-red-50 focus-visible:outline-none focus-visible:bg-red-50 transition-colors disabled:opacity-50"
                  aria-label="Cerrar sesión y volver al inicio"
                >
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>

                  {cerrando ? "Cerrando sesión..." : "Cerrar sesión"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}