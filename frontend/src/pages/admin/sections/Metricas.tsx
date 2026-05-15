import { useState } from "react";

const IcoGrafico = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6"  y1="20" x2="6"  y2="14" />
  </svg>
);

const IcoFiltro = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 4h18l-7 8.5V20l-4-2v-5.5L3 4z" />
  </svg>
);

const Metricas = () => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin]       = useState("");
  const [mensaje, setMensaje]         = useState("");

  const datos = {
    totalSimplificaciones: 150,
    usuariosActivos: 50,
    reportesRecibidos: 25,
  };

  const anunciar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 4000);
  };

  const filtrar = () => {
    anunciar(
      "Métricas filtradas" +
      (fechaInicio ? " desde " + fechaInicio : "") +
      (fechaFin ? " hasta " + fechaFin : "") +
      "."
    );
  };

  const exportar = () => {
    const contenido =
      "Métricas del Sistema\n" +
      "====================\n" +
      "Total de Simplificaciones: " + datos.totalSimplificaciones + "\n" +
      "Usuarios Activos: " + datos.usuariosActivos + "\n" +
      "Reportes Recibidos: " + datos.reportesRecibidos + "\n";
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "metricas.txt";
    a.click();
    URL.revokeObjectURL(url);
    anunciar("Métricas exportadas correctamente.");
  };

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {mensaje}
      </div>

      <h2 className="text-2xl font-bold text-center text-foreground mb-6">
        Métricas del Sistema
      </h2>

      {/* Filtros de fecha */}
      <div className="flex flex-wrap items-end gap-3 mb-8">
        <div>
          <label htmlFor="met-inicio" className="sr-only">Fecha de inicio</label>
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-background">
            <span className="text-muted-foreground"><IcoFiltro /></span>
            <input
              id="met-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              aria-label="Fecha de inicio del filtro"
              className="text-sm bg-transparent text-foreground focus:outline-none"
              placeholder="Fecha de inicio"
            />
          </div>
        </div>

        <div>
          <label htmlFor="met-fin" className="sr-only">Fecha de fin</label>
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-background">
            <span className="text-muted-foreground"><IcoFiltro /></span>
            <input
              id="met-fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              aria-label="Fecha de fin del filtro"
              className="text-sm bg-transparent text-foreground focus:outline-none"
              placeholder="Fecha de fin"
            />
          </div>
        </div>

        <button
          onClick={filtrar}
          className="px-6 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Filtrar
        </button>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12" role="list" aria-label="Resumen de métricas del sistema">

        <article
          className="border border-border rounded-lg p-6 text-left"
          role="listitem"
        >
          <p className="text-sm font-semibold text-foreground mb-4">
            Total de Simplificaciones
          </p>
          <p
            className="text-6xl font-bold text-foreground"
            aria-label={"Total de simplificaciones: " + datos.totalSimplificaciones}
          >
            {datos.totalSimplificaciones}
          </p>
        </article>

        <article
          className="border border-border rounded-lg p-6 text-left"
          role="listitem"
        >
          <p className="text-sm font-semibold text-foreground mb-4">
            Usuarios Activos
          </p>
          <p
            className="text-6xl font-bold text-foreground"
            aria-label={"Usuarios activos: " + datos.usuariosActivos}
          >
            {datos.usuariosActivos}
          </p>
        </article>

        <article
          className="border border-border rounded-lg p-6 text-left"
          role="listitem"
        >
          <p className="text-sm font-semibold text-foreground mb-4">
            Reportes recibidos
          </p>
          <div className="flex items-end gap-3">
            <p
              className="text-6xl font-bold text-foreground"
              aria-label={"Reportes recibidos: " + datos.reportesRecibidos}
            >
              {datos.reportesRecibidos}
            </p>
            <span className="text-foreground mb-1"><IcoGrafico /></span>
          </div>
        </article>
      </div>

      {/* Exportar */}
      <div className="flex justify-center">
        <button
          onClick={exportar}
          className="px-8 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Exportar métricas
        </button>
      </div>
    </div>
  );
};

export default Metricas;
