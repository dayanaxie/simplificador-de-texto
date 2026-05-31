import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import DialogoConfirmar from "./DialogoConfirmar";

type EstadoReporte = "pending" | "reviewed";

interface Reporte {
  id: number;
  user_id: number | null;
  simplification_id: number | null;
  description: string;
  status: EstadoReporte;
  created_at: string;
  users?: { email: string; name: string } | null;
  simplifications?: { original_text: string } | null;
}

interface Usuario { id: number; email: string; name: string; }

const btnAzul =
  "inline-flex items-center justify-center min-h-[44px] px-6 " +
  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
  "text-sm font-medium rounded-md hover:opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
  "transition-opacity duration-150";

const IcoEditar = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IcoEliminar = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const formatearFecha = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CR");
};

const badgeEstado = (status: EstadoReporte) => (
  <span className={
    "inline-block px-2 py-0.5 rounded-full text-xs font-medium " +
    (status === "reviewed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")
  }>
    {status === "reviewed" ? "Revisado" : "Pendiente"}
  </span>
);

// ── Panel edición inline ──────────────────────────────────────────────────────
interface PanelProps {
  reporte: Reporte;
  usuarios: Usuario[];
  onGuardar: (datos: { user_id: number | null; description: string; status: EstadoReporte }) => void;
  onCancelar: () => void;
}

const PanelEdicion = ({ reporte, usuarios, onGuardar, onCancelar }: PanelProps) => {
  const [userId, setUserId]       = useState(reporte.user_id?.toString() ?? "");
  const [description, setDesc]    = useState(reporte.description ?? "");
  const [status, setStatus]       = useState<EstadoReporte>(reporte.status);
  const [errores, setErrores]     = useState<{ description?: string }>({});
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelar(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancelar]);

  const guardar = () => {
    const e: { description?: string } = {};
    if (!description.trim()) e.description = "La descripción es obligatoria.";
    setErrores(e);
    if (Object.keys(e).length > 0) return;
    onGuardar({ user_id: userId ? Number(userId) : null, description, status });
  };

  return (
    <div role="region" aria-label={"Editar reporte #" + reporte.id}
      className="absolute left-0 right-0 z-20 bg-white border border-border rounded-lg shadow-xl p-5 mt-1">
      <h3 className="text-base font-bold text-foreground mb-4">Editar reporte</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="rep-edit-user" className="block text-xs font-medium text-foreground mb-1">Usuario</label>
          <select id="rep-edit-user" ref={ref} value={userId} onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="">Sin usuario</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="rep-edit-desc" className="block text-xs font-medium text-foreground mb-1">
            Descripción <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input id="rep-edit-desc" type="text" value={description} onChange={(e) => setDesc(e.target.value)}
            aria-required="true" aria-invalid={errores.description ? true : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.description ? "border-destructive" : "border-border")} />
          {errores.description && <p role="alert" className="mt-1 text-xs text-destructive">{errores.description}</p>}
        </div>
        <div>
          <label htmlFor="rep-edit-status" className="block text-xs font-medium text-foreground mb-1">Estado</label>
          <select id="rep-edit-status" value={status} onChange={(e) => setStatus(e.target.value as EstadoReporte)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="pending">Pendiente</option>
            <option value="reviewed">Revisado</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={guardar} className={btnAzul}>Guardar cambios</button>
        <button onClick={onCancelar}
          className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const Reportes = () => {
  const [reportes, setReportes]         = useState<Reporte[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [errorCarga, setErrorCarga]     = useState("");
  const [usuarios, setUsuarios]         = useState<Usuario[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [editandoId, setEditandoId]     = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [nuevoUserId, setNuevoUserId]   = useState("");
  const [nuevoDesc, setNuevoDesc]       = useState("");
  const [erroresNuevo, setErroresNuevo] = useState<{ descripcion?: string }>({});
  const [guardando, setGuardando]       = useState(false);
  const [mensaje, setMensaje]           = useState("");
  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);
  const primerCampoRef = useRef<HTMLSelectElement>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  useEffect(() => { if (mostrarForm) setTimeout(() => primerCampoRef.current?.focus(), 50); }, [mostrarForm]);

  const cargarReportes = async () => {
    setCargando(true); setErrorCarga("");
    const { data, error } = await supabase
      .from("reports")
      .select("*, users(email, name), simplifications(original_text)")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); setErrorCarga("No se pudieron cargar los reportes."); }
    else setReportes(data ?? []);
    setCargando(false);
  };

  const cargarUsuarios = async () => {
    const { data } = await supabase.from("users").select("id, email, name").eq("is_active", true).order("name");
    setUsuarios(data ?? []);
  };

  useEffect(() => { cargarReportes(); cargarUsuarios(); }, []);

  const filtrados = reportes.filter((r) =>
    filtroEstado === "todos" || r.status === filtroEstado
  );

  // ── Crear ─────────────────────────────────────────────────────────────────
  const crearReporte = async () => {
    const e: { descripcion?: string } = {};
    if (!nuevoDesc.trim()) e.descripcion = "La descripción es obligatoria.";
    setErroresNuevo(e);
    if (Object.keys(e).length > 0) return;

    setGuardando(true);
    const payload: Record<string, unknown> = {
      description: nuevoDesc,
      status:      "pending",
      created_at:  new Date().toISOString(),
    };
    if (nuevoUserId) payload.user_id = Number(nuevoUserId);

    const { error } = await supabase.from("reports").insert([payload]);
    if (error) { console.error(error); anunciar("Error al crear el reporte. Revisá la consola."); }
    else {
      anunciar("Reporte creado correctamente.");
      setNuevoUserId(""); setNuevoDesc(""); setErroresNuevo({}); setMostrarForm(false);
      await cargarReportes();
    }
    setGuardando(false);
  };

  // ── Editar ────────────────────────────────────────────────────────────────
  const abrirEdicion = (id: number, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEditandoId(id); setEliminandoId(null); };
  const cerrarEdicion = () => { setEditandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };

  const guardarEdicion = async (id: number, datos: { user_id: number | null; description: string; status: EstadoReporte }) => {
    const { error } = await supabase.from("reports").update({
      user_id:     datos.user_id,
      description: datos.description,
      status:      datos.status,
    }).eq("id", id);
    if (error) { console.error(error); anunciar("Error al actualizar. Revisá la consola."); }
    else { anunciar("Reporte actualizado correctamente."); await cargarReportes(); }
    cerrarEdicion();
  };

  // ── Marcar revisado rápido ────────────────────────────────────────────────
  const marcarRevisado = async (id: number) => {
    const { error } = await supabase.from("reports").update({ status: "reviewed" }).eq("id", id);
    if (error) { console.error(error); anunciar("Error al actualizar. Revisá la consola."); }
    else { anunciar("Reporte marcado como revisado."); await cargarReportes(); }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const abrirEliminar = (id: number, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEliminandoId(id); setEditandoId(null); };

  const confirmarEliminar = async () => {
    if (eliminandoId === null) return;
    const r = reportes.find((r) => r.id === eliminandoId);
    const { error } = await supabase.from("reports").delete().eq("id", eliminandoId);
    if (error) { console.error(error); anunciar("Error al eliminar. Revisá la consola."); }
    else { anunciar(`Reporte de ${r?.users?.name ?? "usuario"} eliminado.`); await cargarReportes(); }
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };

  const cancelarEliminar = () => { setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };
  const reporteAEliminar = reportes.find((r) => r.id === eliminandoId);

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId !== null && reporteAEliminar && (
        <DialogoConfirmar titulo="Eliminar reporte"
          mensaje={`¿Estás segura de que querés eliminar el reporte de ${reporteAEliminar.users?.name ?? "este usuario"}? Esta acción no se puede deshacer.`}
          onConfirmar={confirmarEliminar} onCancelar={cancelarEliminar} />
      )}

      <h2 id="h-reportes" className="text-2xl font-bold text-center text-foreground mb-6">Reportes de Problemas</h2>

      {/* Botón + formulario */}
      <section aria-labelledby="h-nuevo-rep" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 id="h-nuevo-rep" className="text-sm font-semibold text-foreground">{mostrarForm ? "Nuevo reporte" : ""}</h3>
          <button onClick={() => setMostrarForm((v) => !v)} aria-expanded={mostrarForm} aria-controls="form-nuevo-rep" className={btnAzul}>
            {mostrarForm ? "Cancelar" : "+ Nuevo reporte"}
          </button>
        </div>

        {mostrarForm && (
          <div id="form-nuevo-rep" className="border border-border rounded-lg p-5 bg-page-bg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="rep-nuevo-user" className="block text-xs font-medium text-foreground mb-1">
                  Usuario <span className="text-muted-foreground">(opcional)</span>
                </label>
                <select id="rep-nuevo-user" ref={primerCampoRef} value={nuevoUserId}
                  onChange={(e) => setNuevoUserId(e.target.value)}
                  className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
                  <option value="">Sin usuario asignado</option>
                  {usuarios.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="rep-nuevo-desc" className="block text-xs font-medium text-foreground mb-1">
                  Descripción del problema <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <input id="rep-nuevo-desc" type="text" value={nuevoDesc}
                  onChange={(e) => setNuevoDesc(e.target.value)}
                  placeholder="Describa el problema reportado"
                  aria-required="true" aria-invalid={erroresNuevo.descripcion ? true : undefined}
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.descripcion ? "border-destructive" : "border-border")} />
                {erroresNuevo.descripcion && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.descripcion}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={crearReporte} disabled={guardando} className={btnAzul + (guardando ? " opacity-50" : "")}>
                {guardando ? "Guardando..." : "Crear reporte"}
              </button>
              <button onClick={() => { setMostrarForm(false); setNuevoUserId(""); setNuevoDesc(""); setErroresNuevo({}); }}
                className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors">
                Descartar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Filtro */}
      <div className="flex gap-3 mb-6">
        <div className="flex items-center gap-2 border border-border rounded-md px-3 min-h-[44px] bg-background flex-1">
          <span aria-hidden="true" className="text-muted-foreground text-sm">▼</span>
          <label htmlFor="filtro-rep" className="sr-only">Filtrar por estado del reporte</label>
          <select id="filtro-rep" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full text-sm bg-transparent text-foreground focus:outline-none">
            <option value="todos">Pendiente / Revisado</option>
            <option value="pending">Pendiente</option>
            <option value="reviewed">Revisado</option>
          </select>
        </div>
        <button onClick={() => anunciar(`Mostrando ${filtrados.length} reporte(s).`)} className={btnAzul}>Filtrar</button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <div className="relative">
          <table className="w-full text-sm text-left" aria-labelledby="h-reportes">
            <caption className="sr-only">Lista de reportes de problemas con opciones para gestionar</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Fecha</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Usuario</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Descripción</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Estado</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Editar</th>
                <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Cargando reportes...</td></tr>
              ) : errorCarga ? (
                <tr><td colSpan={6} className="py-8 text-center" role="alert">
                  <span className="text-destructive">{errorCarga}</span>
                  <button onClick={cargarReportes} className="ml-3 text-primary underline text-sm">Reintentar</button>
                </td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">
                  {reportes.length === 0 ? "No hay reportes." : "No hay reportes con el estado seleccionado."}
                </td></tr>
              ) : (
                filtrados.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 text-foreground whitespace-nowrap">{formatearFecha(r.created_at)}</td>
                    <td className="py-3 pr-3">
                      {r.users ? (
                        <div>
                          <p className="text-foreground font-medium">{r.users.name}</p>
                          <p className="text-xs text-muted-foreground">{r.users.email}</p>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground max-w-[200px]">
                      <p className="truncate" title={r.description}>{r.description ?? "—"}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-col gap-1">
                        {badgeEstado(r.status)}
                        {r.status === "pending" && (
                          <button onClick={() => marcarRevisado(r.id)}
                            aria-label={`Marcar como revisado el reporte de ${r.users?.name ?? "usuario"}`}
                            className="text-xs text-primary underline text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded">
                            Marcar revisado
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <button onClick={(e) => abrirEdicion(r.id, e.currentTarget)}
                        aria-label={`Editar reporte de ${r.users?.name ?? "usuario"}`} aria-expanded={editandoId === r.id}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]">
                        <IcoEditar />
                      </button>
                    </td>
                    <td className="py-3">
                      <button onClick={(e) => abrirEliminar(r.id, e.currentTarget)}
                        aria-label={`Eliminar reporte de ${r.users?.name ?? "usuario"}`}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive">
                        <IcoEliminar />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {editandoId !== null && (() => {
            const rep = reportes.find((r) => r.id === editandoId);
            if (!rep) return null;
            return <PanelEdicion reporte={rep} usuarios={usuarios} onGuardar={(d) => guardarEdicion(editandoId, d)} onCancelar={cerrarEdicion} />;
          })()}
        </div>
      </div>
    </div>
  );
};

export default Reportes;
