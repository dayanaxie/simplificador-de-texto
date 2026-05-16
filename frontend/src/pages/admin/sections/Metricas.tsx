import { useState, useEffect, useRef } from "react";
import DialogoConfirmar from "../sections/DialogoConfirmar";

interface Metrica {
  id: string;
  nombre: string;
  valor: number;
  unidad: string;
  categoria: string;
  fecha: string;
  historial: { fecha: string; valor: number }[];
}

const metricasIniciales: Metrica[] = [
  { id: "1", nombre: "Total de Simplificaciones", valor: 150, unidad: "simplificaciones", categoria: "Uso", fecha: "Mayo 2026",
    historial: [{ fecha: "Feb", valor: 40 }, { fecha: "Mar", valor: 75 }, { fecha: "Abr", valor: 110 }, { fecha: "May", valor: 150 }] },
  { id: "2", nombre: "Usuarios Activos",           valor: 50,  unidad: "usuarios",         categoria: "Usuarios", fecha: "Mayo 2026",
    historial: [{ fecha: "Feb", valor: 18 }, { fecha: "Mar", valor: 28 }, { fecha: "Abr", valor: 41 }, { fecha: "May", valor: 50 }] },
  { id: "3", nombre: "Reportes Recibidos",         valor: 25,  unidad: "reportes",         categoria: "Soporte", fecha: "Mayo 2026",
    historial: [{ fecha: "Feb", valor: 5 }, { fecha: "Mar", valor: 10 }, { fecha: "Abr", valor: 18 }, { fecha: "May", valor: 25 }] },
];

const btnAzul =
  "inline-flex items-center justify-center min-h-[44px] px-6 " +
  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
  "text-sm font-medium rounded-md hover:opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
  "transition-opacity duration-150";

// Mini gráfico de barras SVG inline
const Grafico = ({ historial }: { historial: { fecha: string; valor: number }[] }) => {
  const max = Math.max(...historial.map((h) => h.valor), 1);
  const w = 280, h = 100, pad = 24, barW = 36, gap = (w - pad * 2 - barW * historial.length) / (historial.length - 1);
  return (
    <svg width={w} height={h + 20} aria-label="Gráfico de evolución histórica" role="img">
      <title>Evolución histórica de la métrica</title>
      {historial.map((p, i) => {
        const barH = Math.max(4, ((p.valor / max) * h));
        const x = pad + i * (barW + gap);
        const y = h - barH;
        return (
          <g key={p.fecha}>
            <rect x={x} y={y} width={barW} height={barH}
              fill="hsl(var(--navy))" rx="3" opacity="0.85"
              aria-label={p.fecha + ": " + p.valor} />
            <text x={x + barW / 2} y={h + 14} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
              {p.fecha}
            </text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">
              {p.valor}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// Modal de detalle
interface ModalDetalleProps { metrica: Metrica; onCerrar: () => void; }

const ModalDetalle = ({ metrica, onCerrar }: ModalDetalleProps) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { btnRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="modal-titulo"
        className="relative z-10 bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 id="modal-titulo" className="text-lg font-bold text-foreground mb-1">{metrica.nombre}</h2>
        <p className="text-xs text-muted-foreground mb-4">{metrica.categoria} · {metrica.fecha}</p>

        <div className="flex items-end gap-2 mb-6">
          <span className="text-5xl font-bold text-foreground">{metrica.valor}</span>
          <span className="text-sm text-muted-foreground mb-1">{metrica.unidad}</span>
        </div>

        <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Evolución histórica</p>
        <div className="flex justify-center mb-6">
          <Grafico historial={metrica.historial} />
        </div>

        <div className="flex justify-end">
          <button ref={btnRef} onClick={onCerrar} className={btnAzul}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

const Metricas = () => {
  const [metricas, setMetricas]         = useState<Metrica[]>(metricasIniciales);
  const [fechaInicio, setFechaInicio]   = useState("");
  const [fechaFin, setFechaFin]         = useState("");
  const [detalleId, setDetalleId]       = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [nuevoNombre, setNuevoNombre]   = useState("");
  const [nuevoValor, setNuevoValor]     = useState("");
  const [nuevoUnidad, setNuevoUnidad]   = useState("");
  const [nuevoCategoria, setNuevoCat]   = useState("Uso");
  const [erroresNuevo, setErroresNuevo] = useState<Record<string, string>>({});
  const [mensaje, setMensaje]           = useState("");
  const botonOrigenRef  = useRef<HTMLButtonElement | null>(null);
  const primerCampoRef  = useRef<HTMLInputElement>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  useEffect(() => { if (mostrarForm) setTimeout(() => primerCampoRef.current?.focus(), 50); }, [mostrarForm]);

  const crearMetrica = () => {
    const e: Record<string, string> = {};
    if (!nuevoNombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!nuevoValor.trim() || isNaN(Number(nuevoValor))) e.valor = "Ingrese un número válido.";
    if (!nuevoUnidad.trim()) e.unidad = "La unidad es obligatoria.";
    setErroresNuevo(e);
    if (Object.keys(e).length > 0) { primerCampoRef.current?.focus(); return; }
    const nueva: Metrica = {
      id: crypto.randomUUID(), nombre: nuevoNombre,
      valor: Number(nuevoValor), unidad: nuevoUnidad,
      categoria: nuevoCategoria,
      fecha: new Date().toLocaleDateString("es-CR", { month: "long", year: "numeric" }),
      historial: [{ fecha: "Hoy", valor: Number(nuevoValor) }],
    };
    setMetricas((prev) => [nueva, ...prev]);
    setNuevoNombre(""); setNuevoValor(""); setNuevoUnidad(""); setNuevoCat("Uso");
    setErroresNuevo({}); setMostrarForm(false);
    anunciar("Métrica \"" + nuevoNombre + "\" creada correctamente.");
  };

  const abrirDetalle = (id: string, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn; setDetalleId(id);
  };
  const cerrarDetalle = () => {
    setDetalleId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };

  const abrirEliminar = (id: string, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn; setEliminandoId(id);
  };
  const confirmarEliminar = () => {
    const m = metricas.find((m) => m.id === eliminandoId);
    setMetricas((prev) => prev.filter((m) => m.id !== eliminandoId));
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
    anunciar("Métrica \"" + (m?.nombre ?? "") + "\" eliminada.");
  };
  const cancelarEliminar = () => {
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };

  const metricaAEliminar = metricas.find((m) => m.id === eliminandoId);
  const metricaDetalle   = metricas.find((m) => m.id === detalleId);

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId && metricaAEliminar && (
        <DialogoConfirmar titulo="Eliminar métrica"
          mensaje={"¿Estás segura de que querés eliminar la métrica \"" + metricaAEliminar.nombre + "\"? Esta acción no se puede deshacer."}
          onConfirmar={confirmarEliminar} onCancelar={cancelarEliminar} />
      )}

      {detalleId && metricaDetalle && (
        <ModalDetalle metrica={metricaDetalle} onCerrar={cerrarDetalle} />
      )}

      <h2 className="text-2xl font-bold text-center text-foreground mb-6">Métricas del Sistema</h2>

      {/* Nueva métrica */}
      <section aria-labelledby="h-nueva-metrica" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 id="h-nueva-metrica" className="text-sm font-semibold text-foreground">{mostrarForm ? "Nueva métrica" : ""}</h3>
          <button onClick={() => setMostrarForm((v) => !v)}
            aria-expanded={mostrarForm} aria-controls="form-nueva-metrica" className={btnAzul}>
            {mostrarForm ? "Cancelar" : "+ Nueva métrica"}
          </button>
        </div>

        {mostrarForm && (
          <div id="form-nueva-metrica" className="border border-border rounded-lg p-5 bg-page-bg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="nm-nombre" className="block text-xs font-medium text-foreground mb-1">Nombre <span aria-hidden="true" className="text-destructive">*</span></label>
                <input id="nm-nombre" ref={primerCampoRef} type="text" value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Ej: Usuarios nuevos"
                  aria-required="true"
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.nombre ? "border-destructive" : "border-border")} />
                {erroresNuevo.nombre && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.nombre}</p>}
              </div>
              <div>
                <label htmlFor="nm-valor" className="block text-xs font-medium text-foreground mb-1">Valor inicial <span aria-hidden="true" className="text-destructive">*</span></label>
                <input id="nm-valor" type="text" inputMode="numeric" value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)} placeholder="Ej: 100"
                  aria-required="true"
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.valor ? "border-destructive" : "border-border")} />
                {erroresNuevo.valor && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.valor}</p>}
              </div>
              <div>
                <label htmlFor="nm-unidad" className="block text-xs font-medium text-foreground mb-1">Unidad <span aria-hidden="true" className="text-destructive">*</span></label>
                <input id="nm-unidad" type="text" value={nuevoUnidad}
                  onChange={(e) => setNuevoUnidad(e.target.value)} placeholder="Ej: usuarios"
                  aria-required="true"
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.unidad ? "border-destructive" : "border-border")} />
                {erroresNuevo.unidad && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.unidad}</p>}
              </div>
              <div>
                <label htmlFor="nm-categoria" className="block text-xs font-medium text-foreground mb-1">Categoría</label>
                <select id="nm-categoria" value={nuevoCategoria} onChange={(e) => setNuevoCat(e.target.value)}
                  className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
                  <option value="Uso">Uso</option>
                  <option value="Usuarios">Usuarios</option>
                  <option value="Soporte">Soporte</option>
                  <option value="Rendimiento">Rendimiento</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={crearMetrica} className={btnAzul}>Crear métrica</button>
              <button onClick={() => { setMostrarForm(false); setNuevoNombre(""); setNuevoValor(""); setNuevoUnidad(""); setErroresNuevo({}); }}
                className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors">
                Descartar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Filtros de fecha */}
      <div className="flex flex-wrap items-end gap-3 mb-8">
        <div>
          <label htmlFor="met-inicio" className="block text-xs font-medium text-foreground mb-1">Fecha de inicio</label>
          <input id="met-inicio" type="date" value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
        </div>
        <div>
          <label htmlFor="met-fin" className="block text-xs font-medium text-foreground mb-1">Fecha de fin</label>
          <input id="met-fin" type="date" value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
        </div>
        <button onClick={() => anunciar("Filtro aplicado.")} className={btnAzul}>Filtrar</button>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" role="list" aria-label="Métricas del sistema">
        {metricas.map((m) => (
          <article key={m.id} className="border border-border rounded-lg p-5 relative" role="listitem">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{m.categoria}</p>
            <p className="text-sm font-semibold text-foreground mb-3">{m.nombre}</p>
            <p className="text-5xl font-bold text-foreground mb-1" aria-label={m.nombre + ": " + m.valor + " " + m.unidad}>
              {m.valor}
            </p>
            <p className="text-xs text-muted-foreground mb-4">{m.unidad} · {m.fecha}</p>
            <div className="flex gap-2">
              <button onClick={(e) => abrirDetalle(m.id, e.currentTarget)}
                aria-label={"Ver detalle de " + m.nombre}
                className="min-h-[36px] px-3 text-xs bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]">
                Ver detalle
              </button>
              <button onClick={(e) => abrirEliminar(m.id, e.currentTarget)}
                aria-label={"Eliminar métrica: " + m.nombre}
                className="min-h-[36px] px-3 text-xs border border-border text-foreground rounded-md hover:bg-red-50 hover:text-destructive hover:border-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive transition-colors">
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="flex justify-center">
        <button onClick={() => anunciar("Métricas exportadas.")} className={btnAzul}>
          Exportar métricas
        </button>
      </div>
    </div>
  );
};

export default Metricas;
