import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function NavbarAdmin() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cerrando, setCerrando]       = useState(false);
  const menuRef   = useRef<HTMLDivElement>(null);
  const btnRef    = useRef<HTMLButtonElement>(null);
  const navigate  = useNavigate();

  // Cerrar menú al hacer clic fuera — WCAG 2.1.1
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cerrar menú con Escape — WCAG 2.1.2
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
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav
      className="w-full bg-navy h-[90px] flex items-center justify-end px-6 sm:px-12 border-b border-navy"
      aria-label="Navegación del administrador"
    >
      {/* Menú desplegable de perfil */}
      <div className="relative" ref={menuRef}>
        <button
          ref={btnRef}
          onClick={() => setMenuAbierto((v) => !v)}
          aria-haspopup="true"
          aria-expanded={menuAbierto}
          aria-controls="menu-perfil"
          className="flex items-center gap-2 min-h-[44px] px-4 font-roboto font-medium text-white text-sm sm:text-xl hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy rounded transition-colors"
        >
          Perfil
          {/* Chevron */}
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
            className={"transition-transform duration-200 " + (menuAbierto ? "rotate-180" : "")}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown */}
        {menuAbierto && (
          <div
            id="menu-perfil"
            role="menu"
            aria-label="Opciones de perfil"
            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-border z-50 overflow-hidden"
          >
            <Link
              to="/admin/profile"
              role="menuitem"
              onClick={() => setMenuAbierto(false)}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:bg-muted transition-colors"
            >
              {/* Ícono perfil */}
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Mi perfil
            </Link>

            <div className="border-t border-border" />

            <button
              role="menuitem"
              onClick={cerrarSesion}
              disabled={cerrando}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-destructive hover:bg-red-50 focus-visible:outline-none focus-visible:bg-red-50 transition-colors disabled:opacity-50"
              aria-label="Cerrar sesión y volver al inicio"
            >
              {/* Ícono cerrar sesión */}
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {cerrando ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
