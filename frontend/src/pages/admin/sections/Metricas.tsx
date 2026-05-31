import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import DialogoConfirmar from "./DialogoConfirmar";

interface ResumenSistema {
  totalSimplificaciones: number;
  usuariosActivos: number;
  reportesRecibidos: number;
}

interface EstadisticaUsuario {
  id: number;
  user_id: number;
  period_start: string;
  period_end: string;
  total_generated: number;
  total_saved: number;
  avg_words: number;
  users?: { email: string; name: string } | null;
}

interface Usuario {
  id: number;
  email: string;
  name: string;
}

const btnAzul =
  "inline-flex items-center justify-center min-h-[44px] px-6 " +
  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
  "text-sm font-medium rounded-md hover:opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
  "transition-opacity duration-150";

const formatearFecha = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const MiniGrafico = ({ stats }: { stats: EstadisticaUsuario[] }) => {
  if (stats.length === 0) return null;
  const max = Math.max(...stats.map((s) => s.total_generated), 1);
  const W = 260; const H = 80; const pad = 16;
  const barW = Math.min(32, (W - pad * 2) / stats.length - 4);
  const gap  = stats.length > 1 ? (W - pad * 2 - barW * stats.length) / (stats.length - 1) : 0;
  return (
    <svg width={W} height={H + 20} aria-label="Gráfico de simplificaciones generadas" role="img">
      <title>Simplificaciones generadas por período</title>
      {stats.map((s, i) => {
        const barH = Math.max(4, (s.total_generated / max) * H);
        const x = pad + i * (barW + gap);
        const y = H - barH;
        return (
          <g key={s.id}>
            <rect x={x} y={y} width={barW} height={barH} fill="hsl(var(--navy))" rx="3" opacity="0.85" />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
              {s.period_start?.slice(5) ?? ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

interface ModalDetalleProps { stat: EstadisticaUsuario; todasStats: EstadisticaUsuario[]; onCerrar: () => void; }

const ModalDetalle = ({ stat, todasStats, onCerrar }: ModalDetalleProps) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const historial = todasStats.filter((s) => s.user_id === stat.user_id).sort((a, b) => a.period_start.localeCompare(b.period_start));

  useEffect(() => { btnRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="modal-det-titulo"
        className="relative z-10 bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 id="modal-det-titulo" className="text-lg font-bold text-foreground mb-1">Detalle de estadísticas</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {stat.users?.name ?? stat.users?.email ?? `Usuario #${stat.user_id}`} ·{" "}
          {formatearFecha(stat.period_start)} — {formatearFecha(stat.period_end)}
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Generadas",     valor: stat.total_generated },
            { label: "Guardadas",     valor: stat.total_saved },
            { label: "Prom. palabras", valor: stat.avg_words ? Number(stat.avg_words).toFixed(1) : "—" },
          ].map(({ label, valor }) => (
            <div key={label} className="text-center border border-border rounded-lg p-3">
              <p className="text-2xl font-bold text-foreground">{valor}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
        {historial.length > 1 && (
          <>
            <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Evolución del usuario</p>
            <div className="flex justify-center mb-6"><MiniGrafico stats={historial} /></div>
          </>
        )}
        <div className="flex justify-end">
          <button ref={btnRef} onClick={onCerrar} className={btnAzul}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

const Metricas = () => {
  const [resumen, setResumen]           = useState<ResumenSistema | null>(null);
  const [cargandoResumen, setCargRes]   = useState(true);
  const [stats, setStats]               = useState<EstadisticaUsuario[]>([]);
  const [cargandoStats, setCargStats]   = useState(true);
  const [errorStats, setErrorStats]     = useState("");
  const [usuarios, setUsuarios]         = useState<Usuario[]>([]);
  const [filtroDesde, setFiltroDesde]   = useState("");
  const [filtroHasta, setFiltroHasta]   = useState("");
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [nuevoUserId, setNuevoUserId]   = useState("");
  const [nuevoInicio, setNuevoInicio]   = useState("");
  const [nuevoFin, setNuevoFin]         = useState("");
  const [nuevoGen, setNuevoGen]         = useState("");
  const [nuevoSaved, setNuevoSaved]     = useState("");
  const [nuevoAvg, setNuevoAvg]         = useState("");
  const [erroresNuevo, setErroresNuevo] = useState<Record<string, string>>({});
  const [guardando, setGuardando]       = useState(false);
  const [detalleId, setDetalleId]       = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [mensaje, setMensaje]           = useState("");
  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);
  const primerCampoRef = useRef<HTMLInputElement>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  useEffect(() => { if (mostrarForm) setTimeout(() => primerCampoRef.current?.focus(), 50); }, [mostrarForm]);

  const cargarResumen = async () => {
    setCargRes(true);
    const [simpRes, usersRes, reportsRes] = await Promise.all([
      supabase.from("simplifications").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("reports").select("id", { count: "exact", head: true }),
    ]);
    setResumen({
      totalSimplificaciones: simpRes.count ?? 0,
      usuariosActivos:       usersRes.count ?? 0,
      reportesRecibidos:     reportsRes.count ?? 0,
    });
    setCargRes(false);
  };

  const cargarStats = async (desde = filtroDesde, hasta = filtroHasta) => {
    setCargStats(true); setErrorStats("");
    let query = supabase.from("user_statistics").select("*, users(email, name)").order("period_start", { ascending: false });
    if (desde) query = query.gte("period_start", desde);
    if (hasta) query = query.lte("period_end", hasta);
    const { data, error } = await query;
    if (error) { console.error(error); setErrorStats("No se pudieron cargar las estadísticas."); }
    else setStats(data ?? []);
    setCargStats(false);
  };

  const cargarUsuarios = async () => {
    const { data } = await supabase.from("users").select("id, email, name").eq("is_active", true).order("name");
    setUsuarios(data ?? []);
  };

  useEffect(() => { cargarResumen(); cargarStats(); cargarUsuarios(); }, []);

  const aplicarFiltro = () => { cargarStats(filtroDesde, filtroHasta); anunciar("Filtro aplicado."); };
  const limpiarFiltro = () => { setFiltroDesde(""); setFiltroHasta(""); cargarStats("", ""); anunciar("Filtro eliminado."); };

  const crearStat = async () => {
    const e: Record<string, string> = {};
    if (!nuevoUserId)                                      e.userId    = "Seleccioná un usuario.";
    if (!nuevoInicio)                                      e.inicio    = "La fecha de inicio es obligatoria.";
    if (!nuevoFin)                                         e.fin       = "La fecha de fin es obligatoria.";
    if (nuevoInicio && nuevoFin && nuevoInicio > nuevoFin) e.fin       = "La fecha de fin no puede ser anterior al inicio.";
    if (!nuevoGen.trim() || isNaN(Number(nuevoGen)))       e.generated = "Ingresá un número válido.";
    setErroresNuevo(e);
    if (Object.keys(e).length > 0) { primerCampoRef.current?.focus(); return; }

    setGuardando(true);
    // Sin id — la secuencia lo genera automáticamente
    const { error } = await supabase.from("user_statistics").insert([{
      user_id:         Number(nuevoUserId),
      period_start:    nuevoInicio,
      period_end:      nuevoFin,
      total_generated: Number(nuevoGen),
      total_saved:     Number(nuevoSaved) || 0,
      avg_words:       Number(nuevoAvg)   || 0,
    }]);

    if (error) { console.error(error); anunciar("Error al crear la estadística. Revisá la consola."); }
    else {
      anunciar("Estadística creada correctamente.");
      setNuevoUserId(""); setNuevoInicio(""); setNuevoFin(""); setNuevoGen(""); setNuevoSaved(""); setNuevoAvg("");
      setErroresNuevo({}); setMostrarForm(false);
      await cargarStats();
    }
    setGuardando(false);
  };

  const abrirDetalle  = (id: number, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setDetalleId(id); };
  const cerrarDetalle = () => { setDetalleId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };
  const abrirEliminar = (id: number, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEliminandoId(id); };

  const confirmarEliminar = async () => {
    if (eliminandoId === null) return;
    const { error } = await supabase.from("user_statistics").delete().eq("id", eliminandoId);
    if (error) { console.error(error); anunciar("Error al eliminar."); }
    else { anunciar("Estadística eliminada."); await cargarStats(); }
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };

  const cancelarEliminar = () => { setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };

  const exportar = () => {
    if (!resumen) return;
    const contenido = [
      "Métricas del Sistema", "====================",
      `Total de Simplificaciones: ${resumen.totalSimplificaciones}`,
      `Usuarios Activos:          ${resumen.usuariosActivos}`,
      `Reportes Recibidos:        ${resumen.reportesRecibidos}`,
      "", "Estadísticas por Usuario", "========================",
      ...stats.map((s) =>
        `${s.users?.name ?? s.users?.email ?? "Usuario #" + s.user_id} | ` +
        `${formatearFecha(s.period_start)}—${formatearFecha(s.period_end)} | ` +
        `Generadas: ${s.total_generated} | Guardadas: ${s.total_saved} | Prom: ${Number(s.avg_words).toFixed(1)}`
      ),
    ].join("\n");
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "metricas.txt"; a.click();
    URL.revokeObjectURL(url);
    anunciar("Métricas exportadas.");
  };

  const statAEliminar = stats.find((s) => s.id === eliminandoId);
  const statDetalle   = stats.find((s) => s.id === detalleId);

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId !== null && statAEliminar && (
        <DialogoConfirmar titulo="Eliminar estadística"
          mensaje={`¿Estás segura de que querés eliminar la estadística de ${statAEliminar.users?.name ?? statAEliminar.users?.email ?? "Usuario #" + statAEliminar.user_id}? Esta acción no se puede deshacer.`}
          onConfirmar={confirmarEliminar} onCancelar={cancelarEliminar} />
      )}

      {detalleId !== null && statDetalle && (
        <ModalDetalle stat={statDetalle} todasStats={stats} onCerrar={cerrarDetalle} />
      )}

      <h2 className="text-2xl font-bold text-center text-foreground mb-6">Métricas del Sistema</h2>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" role="list" aria-label="Resumen de métricas">
        {cargandoResumen ? (
          <div className="sm:col-span-3 py-6 text-center text-muted-foreground text-sm">Cargando métricas...</div>
        ) : (
          [
            { label: "Total de Simplificaciones", valor: resumen?.totalSimplificaciones ?? 0 },
            { label: "Usuarios Activos",           valor: resumen?.usuariosActivos ?? 0 },
            { label: "Reportes Recibidos",         valor: resumen?.reportesRecibidos ?? 0 },
          ].map(({ label, valor }) => (
            <article key={label} className="border border-border rounded-lg p-5 text-left" role="listitem">
              <p className="text-sm font-semibold text-foreground mb-3">{label}</p>
              <p className="text-5xl font-bold text-foreground" aria-label={`${label}: ${valor}`}>{valor}</p>
            </article>
          ))
        )}
      </div>

      {/* Formulario nueva estadística */}
      <section aria-labelledby="h-nueva-stat" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 id="h-nueva-stat" className="text-sm font-semibold text-foreground">{mostrarForm ? "Nueva estadística de usuario" : ""}</h3>
          <button onClick={() => setMostrarForm((v) => !v)} aria-expanded={mostrarForm} aria-controls="form-nueva-stat" className={btnAzul}>
            {mostrarForm ? "Cancelar" : "+ Nueva estadística"}
          </button>
        </div>

        {mostrarForm && (
          <div id="form-nueva-stat" className="border border-border rounded-lg p-5 bg-page-bg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

              {/* Selector de usuario por nombre/email */}
              <div>
                <label htmlFor="ns-usuario" className="block text-xs font-medium text-foreground mb-1">
                  Usuario <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <select id="ns-usuario" ref={primerCampoRef as React.RefObject<HTMLSelectElement>}
                  value={nuevoUserId} onChange={(e) => setNuevoUserId(e.target.value)}
                  aria-required="true" aria-invalid={erroresNuevo.userId ? true : undefined}
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.userId ? "border-destructive" : "border-border")}>
                  <option value="">Seleccioná un usuario</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                {erroresNuevo.userId && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.userId}</p>}
              </div>

              <div>
                <label htmlFor="ns-inicio" className="block text-xs font-medium text-foreground mb-1">
                  Inicio del período <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <input id="ns-inicio" type="date" value={nuevoInicio} onChange={(e) => setNuevoInicio(e.target.value)}
                  aria-required="true" aria-invalid={erroresNuevo.inicio ? true : undefined}
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.inicio ? "border-destructive" : "border-border")} />
                {erroresNuevo.inicio && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.inicio}</p>}
              </div>

              <div>
                <label htmlFor="ns-fin" className="block text-xs font-medium text-foreground mb-1">
                  Fin del período <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <input id="ns-fin" type="date" value={nuevoFin} onChange={(e) => setNuevoFin(e.target.value)}
                  aria-required="true" aria-invalid={erroresNuevo.fin ? true : undefined}
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.fin ? "border-destructive" : "border-border")} />
                {erroresNuevo.fin && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.fin}</p>}
              </div>

              <div>
                <label htmlFor="ns-gen" className="block text-xs font-medium text-foreground mb-1">
                  Total generadas <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <input id="ns-gen" type="number" min="0" value={nuevoGen} onChange={(e) => setNuevoGen(e.target.value)}
                  placeholder="0" aria-required="true" aria-invalid={erroresNuevo.generated ? true : undefined}
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.generated ? "border-destructive" : "border-border")} />
                {erroresNuevo.generated && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.generated}</p>}
              </div>

              <div>
                <label htmlFor="ns-saved" className="block text-xs font-medium text-foreground mb-1">Total guardadas</label>
                <input id="ns-saved" type="number" min="0" value={nuevoSaved} onChange={(e) => setNuevoSaved(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
              </div>

              <div>
                <label htmlFor="ns-avg" className="block text-xs font-medium text-foreground mb-1">Promedio de palabras</label>
                <input id="ns-avg" type="number" min="0" step="0.1" value={nuevoAvg} onChange={(e) => setNuevoAvg(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={crearStat} disabled={guardando} className={btnAzul + (guardando ? " opacity-50" : "")}>
                {guardando ? "Guardando..." : "Crear estadística"}
              </button>
              <button onClick={() => { setMostrarForm(false); setNuevoUserId(""); setNuevoInicio(""); setNuevoFin(""); setNuevoGen(""); setNuevoSaved(""); setNuevoAvg(""); setErroresNuevo({}); }}
                className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors">
                Descartar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Filtro */}
      <section aria-labelledby="h-filtro-met" className="mb-6">
        <h3 id="h-filtro-met" className="text-sm font-semibold text-foreground mb-3">Filtrar por período</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="met-desde" className="block text-xs font-medium text-foreground mb-1">Desde</label>
            <input id="met-desde" type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)}
              className="px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
          </div>
          <div>
            <label htmlFor="met-hasta" className="block text-xs font-medium text-foreground mb-1">Hasta</label>
            <input id="met-hasta" type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)}
              className="px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
          </div>
          <button onClick={aplicarFiltro} className={btnAzul}>Filtrar</button>
          {(filtroDesde || filtroHasta) && (
            <button onClick={limpiarFiltro} className="min-h-[44px] px-4 text-sm text-muted-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded">
              Limpiar filtro
            </button>
          )}
        </div>
      </section>

      {/* Tabla */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm text-left">
          <caption className="sr-only">Estadísticas de uso por usuario</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Usuario</th>
              <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Período</th>
              <th scope="col" className="py-3 pr-3 font-semibold text-foreground text-center">Generadas</th>
              <th scope="col" className="py-3 pr-3 font-semibold text-foreground text-center">Guardadas</th>
              <th scope="col" className="py-3 pr-3 font-semibold text-foreground text-center">Prom.</th>
              <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Detalle</th>
              <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {cargandoStats ? (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Cargando estadísticas...</td></tr>
            ) : errorStats ? (
              <tr><td colSpan={7} className="py-8 text-center" role="alert">
                <span className="text-destructive">{errorStats}</span>
                <button onClick={() => cargarStats()} className="ml-3 text-primary underline text-sm">Reintentar</button>
              </td></tr>
            ) : stats.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No hay estadísticas registradas.</td></tr>
            ) : (
              stats.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-3 text-foreground">
                    {s.users?.email ? (
                      <div>
                        <p className="font-medium">{s.users.name}</p>
                        <p className="text-xs text-muted-foreground">{s.users.email}</p>
                      </div>
                    ) : <span className="text-muted-foreground">Usuario #{s.user_id}</span>}
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">
                    {formatearFecha(s.period_start)} — {formatearFecha(s.period_end)}
                  </td>
                  <td className="py-3 pr-3 text-center font-medium text-foreground">{s.total_generated}</td>
                  <td className="py-3 pr-3 text-center text-foreground">{s.total_saved}</td>
                  <td className="py-3 pr-3 text-center text-foreground">{s.avg_words ? Number(s.avg_words).toFixed(1) : "—"}</td>
                  <td className="py-3 pr-3">
                    <button onClick={(e) => abrirDetalle(s.id, e.currentTarget)}
                      aria-label={`Ver detalle de ${s.users?.name ?? s.users?.email ?? "Usuario #" + s.user_id}`}
                      className="min-h-[36px] px-3 text-xs bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]">
                      Ver detalle
                    </button>
                  </td>
                  <td className="py-3">
                    <button onClick={(e) => abrirEliminar(s.id, e.currentTarget)}
                      aria-label={`Eliminar estadística de ${s.users?.name ?? "Usuario #" + s.user_id}`}
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive">
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center">
        <button onClick={exportar} disabled={cargandoResumen || cargandoStats} className={btnAzul}>
          Exportar métricas
        </button>
      </div>
    </div>
  );
};

export default Metricas;
