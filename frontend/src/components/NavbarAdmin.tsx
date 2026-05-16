import { Link } from "react-router-dom";

export default function NavbarAdmin() {
  return (
    <nav
      className="w-full bg-navy h-[90px] flex items-center justify-end px-6 sm:px-12 border-b border-navy"
      aria-label="Navegación del administrador"
    >
      <Link
        to="/profile"
        className="flex items-center justify-center min-h-[44px] px-4 font-roboto font-medium text-white text-sm sm:text-xl hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy rounded transition-colors"
        aria-label="Ir a mi perfil"
      >
        Perfil
      </Link>
    </nav>
  );
}
