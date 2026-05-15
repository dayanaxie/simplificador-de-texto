import { useState } from "react";
import GestionUsuarios from "./sections/GestionUsuarios";
import Anuncios from "./sections/Anuncios";
import Configuracion from "./sections/Configuracion";
import Metricas from "./sections/Metricas";
import Glosario from "./sections/Glosario";
import Auditoria from "./sections/Auditoria";

type SeccionAdmin =
  | "usuarios"
  | "anuncios"
  | "auditoria"
  | "configuracion"
  | "glosario"
  | "metricas"
  | "reportes"
  | "solicitudes";

const secciones: { id: SeccionAdmin; label: string }[] = [
  { id: "anuncios",      label: "Anuncios" },
  { id: "auditoria",     label: "Auditoría" },
  { id: "configuracion", label: "Configuración" },
  { id: "glosario",      label: "Glosario" },
  { id: "metricas",      label: "Métricas" },
  { id: "reportes",      label: "Reportes" },
  { id: "solicitudes",   label: "Solicitudes" },
  { id: "usuarios",      label: "Usuarios" },
];

const SeccionPendiente = ({ titulo }: { titulo: string }) => (
  <div className="flex items-center justify-center h-48">
    <p className="text-muted-foreground text-sm">Sección {titulo} en desarrollo</p>
  </div>
);

const AdminPanel = () => {
  const [seccionActiva, setSeccionActiva] = useState<SeccionAdmin>("usuarios");

  const renderSeccion = () => {
    switch (seccionActiva) {
      case "usuarios":      return <GestionUsuarios />;
      case "anuncios":      return <Anuncios />;
      case "configuracion": return <Configuracion />;
      case "metricas":      return <Metricas />;
      case "glosario":      return <Glosario />;
      case "auditoria":     return <Auditoria />;
      case "reportes":      return <SeccionPendiente titulo="Reportes" />;
      case "solicitudes":   return <SeccionPendiente titulo="Solicitudes" />;
    }
  };

  return (
    <main className="flex-1 bg-page-bg p-6" aria-label="Panel de administración">
      <a
        href="#contenido-admin"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-navy focus:text-navy-foreground focus:rounded-md focus:text-sm"
      >
        Ir al contenido principal
      </a>

      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow flex min-h-[600px]">

        {/* Sidebar */}
        <nav aria-label="Menú de administración" className="w-56 shrink-0 border-r border-border p-6 bg-white">
          <p className="text-xl font-bold text-foreground mb-6">Administrador</p>
          <ul role="list" className="space-y-2">
            {secciones.map(({ id, label }) => (
              <li key={id}>
                <button
                  onClick={() => setSeccionActiva(id)}
                  aria-current={seccionActiva === id ? "page" : undefined}
                  className={[
                    "w-full text-left px-4 py-2 rounded-md text-sm transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    seccionActiva === id
                      ? "bg-muted text-foreground font-semibold border border-border"
                      : "text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contenido */}
        <section
          id="contenido-admin"
          className="flex-1 p-8"
          aria-live="polite"
          aria-atomic="true"
        >
          {renderSeccion()}
        </section>
      </div>
    </main>
  );
};

export default AdminPanel;
