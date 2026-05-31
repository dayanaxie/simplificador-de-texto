import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import DialogoConfirmar from "./DialogoConfirmar";

interface RegistroAuditoria {
  id: number;
  user_id: number | null;
  action: string;
  entity: string;
  created_at: string;
  users?: { email: string; name: string } | null;
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
  return d.toLocaleDateString("es-CR") + " " + d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
};

interface PanelEdicionProps {
  registro: RegistroAuditoria;
  usuarios: Usuario[];
  onGuardar: (datos: { action: string; entity: string }) => void;
  onCancelar: () => void;
}

const PanelEdicion = ({ registro, onGuardar, onCancelar }: PanelEdicionProps) => {
  const [action, setAction] = useState(registro.action ?? "");
  const [entity, setEntity] = useState(registro.entity ?? "");
  const [errores, setErrores] = useState<{ action?: string }>({});
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelar(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancelar]);

  const guardar = () => {
    const e: { action?: string } = {};
    if (!action.trim()) e.action = "La acción es obligatoria.";
    setErrores(e);
    if (Object.keys(e).length > 0) { ref.current?.focus(); return; }
    onGuardar({ action, entity });
  };

  return (
    <div role="region" aria-label={"Editar registro #" + registro.id}
      className="absolute left-0 right-0 z-20 bg-white border border-border rounded-lg shadow-xl p-5 mt-1">
      <h3 className="text-base font-bold text-foreground mb-4">Editar registro de auditoría</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="edit-action" className="block text-xs font-medium text-foreground mb-1">
            Acción <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input id="edit-action" ref={ref} type="text" value={action}
            onChange={(e) => setAction(e.target.value)} aria-required="true"
            aria-invalid={errores.action ? true : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.action ? "border-destructive" : "border-border")} />
          {errores.action && <p role="alert" className="mt-1 text-xs text-destructive">{errores.action}</p>}
        </div>
        <div>
          <label htmlFor="edit-entity" className="block text-xs font-medium text-foreground mb-1">Entidad / Detalle</label>
          <input id="edit-entity" type="text" value={entity} onChange={(e) => setEntity(e.target.value)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
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

const Auditoria = () => {
  const [registros, setRegistros]       = useState<RegistroAuditoria[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [errorCarga, setErrorCarga]     = useState("");
  const [usuarios, setUsuarios]         = useState<Usuario[]>([]);
  const [busqueda, setBusqueda]         = useState("");
  const [editandoId, setEditandoId]     = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [guardando, setGuardando]       = useState(false);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [nuevoUserId, setNuevoUserId]   = useState("");
  const [nuevoAction, setNuevoAction]   = useState("");
  const [nuevoEntity, setNuevoEntity]   = useState("");
  const [erroresNuevo, setErroresNuevo] = useState<Record<string, string>>({});
  const [mensaje, setMensaje]           = useState("");
  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);
  const primerCampoRef = useRef<HTMLSelectElement>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  useEffect(() => { if (mostrarForm) setTimeout(() => primerCampoRef.current?.focus(), 50); }, [mostrarForm]);

  const cargarRegistros = async () => {
    setCargando(true); setErrorCarga("");
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*, users(email, name)")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); setErrorCarga("No se pudieron cargar los registros."); }
    else setRegistros(data ?? []);
    setCargando(false);
  };

  const cargarUsuarios = async () => {
    const { data } = await supabase.from("users").select("id, email, name").eq("is_active", true).order("name");
    setUsuarios(data ?? []);
  };

  useEffect(() => { cargarRegistros(); cargarUsuarios(); }, []);

  const filtrados = registros.filter((r) => {
    const txt = busqueda.toLowerCase();
    return formatearFecha(r.created_at).toLowerCase().includes(txt) ||
      (r.users?.name ?? "").toLowerCase().includes(txt) ||
      (r.users?.email ?? "").toLowerCase().includes(txt) ||
      (r.action ?? "").toLowerCase().includes(txt);
  });

  const crearRegistro = async () => {
    const e: Record<string, string> = {};
    if (!nuevoAction.trim()) e.action = "La acción es obligatoria.";
    setErroresNuevo(e);
    if (Object.keys(e).length > 0) return;

    setGuardando(true);
    const payload: Record<string, unknown> = {
      action:     nuevoAction,
      entity:     nuevoEntity || null,
      created_at: new Date().toISOString(),
    };
    if (nuevoUserId) payload.user_id = Number(nuevoUserId);

    const { error } = await supabase.from("audit_logs").insert([payload]);
    if (error) { console.error(error); anunciar("Error al crear el registro. Revisá la consola."); }
    else {
      anunciar("Registro creado correctamente.");
      setNuevoUserId(""); setNuevoAction(""); setNuevoEntity("");
      setErroresNuevo({}); setMostrarForm(false);
      await cargarRegistros();
    }
    setGuardando(false);
  };

  const abrirEdicion = (id: number, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEditandoId(id); setEliminandoId(null); };
  const cerrarEdicion = () => { setEditandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };

  const guardarEdicion = async (id: number, datos: { action: string; entity: string }) => {
    const { error } = await supabase.from("audit_logs").update({ action: datos.action, entity: datos.entity }).eq("id", id);
    if (error) { console.error(error); anunciar("Error al actualizar. Revisá la consola."); }
    else { anunciar("Registro actualizado."); await cargarRegistros(); }
    cerrarEdicion();
  };

  const abrirEliminar = (id: number, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEliminandoId(id); setEditandoId(null); };

  const confirmarEliminar = async () => {
    if (eliminandoId === null) return;
    const { error } = await supabase.from("audit_logs").delete().eq("id", eliminandoId);
    if (error) { console.error(error); anunciar("Error al eliminar. Revisá la consola."); }
    else { anunciar("Registro eliminado."); await cargarRegistros(); }
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };

  const cancelarEliminar = () => { setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };
  const registroAEliminar = registros.find((r) => r.id === eliminandoId);

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId !== null && registroAEliminar && (
        <DialogoConfirmar titulo="Eliminar registro"
          mensaje={`¿Estás segura de que querés eliminar el registro "${registroAEliminar.action}" del ${formatearFecha(registroAEliminar.created_at)}? Esta acción no se puede deshacer.`}
          onConfirmar={confirmarEliminar} onCancelar={cancelarEliminar} />
      )}

      <h2 id="h-auditoria" className="text-2xl font-bold text-center text-foreground mb-6">Log de Auditoría</h2>

      {/* Formulario nuevo registro */}
      <section aria-labelledby="h-nuevo-reg" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 id="h-nuevo-reg" className="text-sm font-semibold text-foreground">{mostrarForm ? "Nuevo registro" : ""}</h3>
          <button onClick={() => setMostrarForm((v) => !v)} aria-expanded={mostrarForm} aria-controls="form-nuevo-reg" className={btnAzul}>
            {mostrarForm ? "Cancelar" : "+ Nuevo registro"}
          </button>
        </div>

        {mostrarForm && (
          <div id="form-nuevo-reg" className="border border-border rounded-lg p-5 bg-page-bg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Selector de usuario por nombre/email */}
              <div>
                <label htmlFor="nuevo-user-sel" className="block text-xs font-medium text-foreground mb-1">
                  Usuario <span className="text-muted-foreground">(opcional)</span>
                </label>
                <select id="nuevo-user-sel" ref={primerCampoRef} value={nuevoUserId}
                  onChange={(e) => setNuevoUserId(e.target.value)}
                  className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
                  <option value="">Sin usuario</option>
                  {usuarios.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="nuevo-action" className="block text-xs font-medium text-foreground mb-1">
                  Acción <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <input id="nuevo-action" type="text" value={nuevoAction}
                  onChange={(e) => setNuevoAction(e.target.value)} placeholder="Ej: LOGIN, DELETE, UPDATE"
                  aria-required="true" aria-invalid={erroresNuevo.action ? true : undefined}
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.action ? "border-destructive" : "border-border")} />
                {erroresNuevo.action && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.action}</p>}
              </div>

              <div>
                <label htmlFor="nuevo-entity" className="block text-xs font-medium text-foreground mb-1">Entidad / Detalle</label>
                <input id="nuevo-entity" type="text" value={nuevoEntity}
                  onChange={(e) => setNuevoEntity(e.target.value)} placeholder="Ej: users, announcements"
                  className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={crearRegistro} disabled={guardando} className={btnAzul + (guardando ? " opacity-50" : "")}>
                {guardando ? "Guardando..." : "Agregar registro"}
              </button>
              <button onClick={() => { setMostrarForm(false); setNuevoUserId(""); setNuevoAction(""); setNuevoEntity(""); setErroresNuevo({}); }}
                className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors">
                Descartar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Buscador */}
      <div className="flex gap-3 mb-6" role="search">
        <label htmlFor="buscar-auditoria" className="sr-only">Buscar por fecha, usuario o acción</label>
        <div className="relative flex-1">
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          <input id="buscar-auditoria" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por fecha, usuario o acción"
            className="w-full pl-9 pr-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
        </div>
        <button onClick={() => anunciar(`Mostrando ${filtrados.length} registro(s).`)} className={btnAzul}>Buscar</button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <div className="relative">
          <table className="w-full text-sm text-left" aria-labelledby="h-auditoria">
            <caption className="sr-only">Log de auditoría con fecha, usuario, acción y entidad</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Fecha</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Usuario</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Acción</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Entidad</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Editar</th>
                <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Cargando registros...</td></tr>
              ) : errorCarga ? (
                <tr><td colSpan={6} className="py-8 text-center" role="alert">
                  <span className="text-destructive">{errorCarga}</span>
                  <button onClick={cargarRegistros} className="ml-3 text-primary underline text-sm">Reintentar</button>
                </td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">
                  {registros.length === 0 ? "No hay registros de auditoría." : "No se encontraron registros."}
                </td></tr>
              ) : (
                filtrados.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-foreground whitespace-nowrap">{formatearFecha(r.created_at)}</td>
                    <td className="py-3 pr-4">
                      {r.users ? (
                        <div>
                          <p className="text-foreground font-medium">{r.users.name}</p>
                          <p className="text-xs text-muted-foreground">{r.users.email}</p>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {r.action ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{r.entity ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <button onClick={(e) => abrirEdicion(r.id, e.currentTarget)}
                        aria-label={`Editar registro: ${r.action}`} aria-expanded={editandoId === r.id}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]">
                        <IcoEditar />
                      </button>
                    </td>
                    <td className="py-3">
                      <button onClick={(e) => abrirEliminar(r.id, e.currentTarget)}
                        aria-label={`Eliminar registro: ${r.action}`}
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
            const reg = registros.find((r) => r.id === editandoId);
            if (!reg) return null;
            return <PanelEdicion registro={reg} usuarios={usuarios} onGuardar={(d) => guardarEdicion(editandoId, d)} onCancelar={cerrarEdicion} />;
          })()}
        </div>
      </div>
    </div>
  );
};

export default Auditoria;
