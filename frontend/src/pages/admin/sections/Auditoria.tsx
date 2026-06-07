import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import DialogoConfirmar from "./DialogoConfirmar";
import BotonAyuda from "../../../components/BotonAyuda";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface RegistroAuditoria {
  id: number;
  user_id: number | null;
  action: string;   // tipo de evento: LOGIN, CREAR, EDITAR, ELIMINAR...
  entity: string;   // módulo afectado: Usuarios, Anuncios, Glosario...
  created_at: string;
  users?: { email: string; name: string } | null;
}

interface Usuario { id: number; email: string; name: string; }

// Opciones predefinidas con sentido para el sistema
const ACCIONES = [
  { value: "LOGIN",       label: "LOGIN — Inicio de sesión" },
  { value: "LOGOUT",      label: "LOGOUT — Cierre de sesión" },
  { value: "CREAR",       label: "CREAR — Creación de registro" },
  { value: "EDITAR",      label: "EDITAR — Modificación de registro" },
  { value: "ELIMINAR",    label: "ELIMINAR — Eliminación de registro" },
  { value: "CONFIGURAR",  label: "CONFIGURAR — Cambio de configuración" },
  { value: "APROBAR",     label: "APROBAR — Aprobación de solicitud" },
  { value: "DENEGAR",     label: "DENEGAR — Denegación de solicitud" },
  { value: "EXPORTAR",    label: "EXPORTAR — Exportación de datos" },
  { value: "REVISAR",     label: "REVISAR — Revisión de reporte" },
  { value: "ERROR",       label: "ERROR — Error del sistema" },
];

const MODULOS = [
  "Usuarios",
  "Anuncios",
  "Glosario",
  "Configuración",
  "Solicitudes",
  "Reportes",
  "Auditoría",
  "Métricas",
  "Simplificación",
  "Sistema",
];

// Badge de color por tipo de acción
const badgeAccion = (action: string) => {
  const estilos: Record<string, string> = {
    LOGIN:      "bg-green-100 text-green-800",
    LOGOUT:     "bg-gray-100 text-gray-700",
    CREAR:      "bg-blue-100 text-blue-800",
    EDITAR:     "bg-yellow-100 text-yellow-800",
    ELIMINAR:   "bg-red-100 text-red-800",
    CONFIGURAR: "bg-purple-100 text-purple-800",
    APROBAR:    "bg-green-100 text-green-800",
    DENEGAR:    "bg-red-100 text-red-800",
    EXPORTAR:   "bg-indigo-100 text-indigo-800",
    REVISAR:    "bg-orange-100 text-orange-800",
    ERROR:      "bg-red-200 text-red-900",
  };
  const clase = estilos[action] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${clase}`}>
      {action}
    </span>
  );
};

// ── Estilos ───────────────────────────────────────────────────────────────────
const btnAzul =
  "inline-flex items-center justify-center min-h-[44px] px-6 " +
  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
  "text-sm font-medium rounded-md hover:opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
  "transition-opacity duration-150";

const IcoEditar = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IcoEliminar = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const formatearFecha = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CR") + " " +
    d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
};

// ── Panel edición inline ──────────────────────────────────────────────────────
interface PanelEdicionProps {
  registro: RegistroAuditoria;
  usuarios: Usuario[];
  onGuardar: (datos: { action: string; entity: string }) => void;
  onCancelar: () => void;
}

const PanelEdicion = ({ registro, onGuardar, onCancelar }: PanelEdicionProps) => {
  const [action, setAction] = useState(registro.action ?? "LOGIN");
  const [entity, setEntity] = useState(registro.entity ?? "Sistema");
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelar(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancelar]);

  return (
    <div role="region" aria-label={"Editar registro de auditoría #" + registro.id}
      className="absolute left-0 right-0 z-20 bg-white border border-border rounded-lg shadow-xl p-5 mt-1">
      <h3 className="text-base font-bold text-foreground mb-4">Editar registro de auditoría</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Tipo de acción */}
        <div>
          <label htmlFor="edit-action-sel" className="block text-xs font-medium text-foreground mb-1">
            Tipo de evento <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <select
            id="edit-action-sel"
            ref={ref}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          >
            {ACCIONES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Módulo afectado */}
        <div>
          <label htmlFor="edit-entity-sel" className="block text-xs font-medium text-foreground mb-1">
            Módulo afectado
          </label>
          <select
            id="edit-entity-sel"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          >
            {MODULOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => onGuardar({ action, entity })} className={btnAzul}>
          Guardar cambios
        </button>
        <button
          onClick={onCancelar}
          className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const Auditoria = () => {
  const [registros, setRegistros]       = useState<RegistroAuditoria[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [errorCarga, setErrorCarga]     = useState("");
  const [usuarios, setUsuarios]         = useState<Usuario[]>([]);
  const [busqueda, setBusqueda]         = useState("");
  const [filtroAccion, setFiltroAccion] = useState("Todos");
  const [filtroModulo, setFiltroModulo] = useState("Todos");
  const [editandoId, setEditandoId]     = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [guardando, setGuardando]       = useState(false);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [nuevoUserId, setNuevoUserId]   = useState("");
  const [nuevoAction, setNuevoAction]   = useState("LOGIN");
  const [nuevoEntity, setNuevoEntity]   = useState("Sistema");
  const [erroresNuevo, setErroresNuevo] = useState<Record<string, string>>({});
  const [mensaje, setMensaje]           = useState("");

  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);
  const primerCampoRef = useRef<HTMLSelectElement>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  useEffect(() => {
    if (mostrarForm) setTimeout(() => primerCampoRef.current?.focus(), 50);
  }, [mostrarForm]);

  // ── Carga ──────────────────────────────────────────────────────────────────
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
    const { data } = await supabase
      .from("users").select("id, email, name").eq("is_active", true).order("name");
    setUsuarios(data ?? []);
  };

  useEffect(() => { cargarRegistros(); cargarUsuarios(); }, []);

  // ── Filtrado local ─────────────────────────────────────────────────────────
  const filtrados = registros.filter((r) => {
    const txt = busqueda.toLowerCase();
    const coincideTexto =
      formatearFecha(r.created_at).toLowerCase().includes(txt) ||
      (r.users?.name ?? "").toLowerCase().includes(txt) ||
      (r.users?.email ?? "").toLowerCase().includes(txt) ||
      (r.action ?? "").toLowerCase().includes(txt) ||
      (r.entity ?? "").toLowerCase().includes(txt);
    const coincideAccion = filtroAccion === "Todos" || r.action === filtroAccion;
    const coincideModulo = filtroModulo === "Todos" || r.entity === filtroModulo;
    return coincideTexto && coincideAccion && coincideModulo;
  });

  // ── Crear ──────────────────────────────────────────────────────────────────
  const crearRegistro = async () => {
    // No hay campos obligatorios vacíos porque usan selects con valores por defecto
    setGuardando(true);
    const payload: Record<string, unknown> = {
      action:     nuevoAction,
      entity:     nuevoEntity,
      created_at: new Date().toISOString(),
    };
    if (nuevoUserId) payload.user_id = Number(nuevoUserId);

    const { error } = await supabase.from("audit_logs").insert([payload]);
    if (error) { console.error(error); anunciar("Error al crear el registro. Revisá la consola."); }
    else {
      anunciar("Registro de auditoría creado correctamente.");
      setNuevoUserId(""); setNuevoAction("LOGIN"); setNuevoEntity("Sistema");
      setErroresNuevo({}); setMostrarForm(false);
      await cargarRegistros();
    }
    setGuardando(false);
  };

  // ── Editar ─────────────────────────────────────────────────────────────────
  const abrirEdicion = (id: number, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn; setEditandoId(id); setEliminandoId(null);
  };
  const cerrarEdicion = () => {
    setEditandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };
  const guardarEdicion = async (id: number, datos: { action: string; entity: string }) => {
    const { error } = await supabase
      .from("audit_logs")
      .update({ action: datos.action, entity: datos.entity })
      .eq("id", id);
    if (error) { console.error(error); anunciar("Error al actualizar. Revisá la consola."); }
    else { anunciar("Registro actualizado correctamente."); await cargarRegistros(); }
    cerrarEdicion();
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const abrirEliminar = (id: number, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn; setEliminandoId(id); setEditandoId(null);
  };
  const confirmarEliminar = async () => {
    if (eliminandoId === null) return;
    const { error } = await supabase.from("audit_logs").delete().eq("id", eliminandoId);
    if (error) { console.error(error); anunciar("Error al eliminar. Revisá la consola."); }
    else { anunciar("Registro eliminado."); await cargarRegistros(); }
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };
  const cancelarEliminar = () => {
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };

  const registroAEliminar = registros.find((r) => r.id === eliminandoId);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId !== null && registroAEliminar && (
        <DialogoConfirmar
          titulo="Eliminar registro de auditoría"
          mensaje={`¿Estás segura de que querés eliminar el registro "${registroAEliminar.action}" en "${registroAEliminar.entity}" del ${formatearFecha(registroAEliminar.created_at)}? Esta acción no se puede deshacer.`}
          onConfirmar={confirmarEliminar}
          onCancelar={cancelarEliminar}
        />
      )}

      <h2 id="h-auditoria" className="text-2xl font-bold text-center text-foreground mb-6">
        Log de Auditoría
      </h2>

      {/* ── Formulario nuevo registro ─────────────────────────────────────── */}
      <section aria-labelledby="h-nuevo-reg" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 id="h-nuevo-reg" className="text-sm font-semibold text-foreground">
            {mostrarForm ? "Nuevo registro de auditoría" : ""}
          </h3>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            aria-expanded={mostrarForm}
            aria-controls="form-nuevo-reg"
            className={btnAzul}
          >
            {mostrarForm ? "Cancelar" : "+ Nuevo registro"}
          </button>
        </div>

        {mostrarForm && (
          <div id="form-nuevo-reg" className="border border-border rounded-lg p-5 bg-page-bg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Usuario */}
              <div>
                <label htmlFor="nuevo-user-sel" className="block text-xs font-medium text-foreground mb-1">
                  Usuario <span className="text-muted-foreground">(opcional)</span>
                </label>
                <select
                  id="nuevo-user-sel"
                  ref={primerCampoRef}
                  value={nuevoUserId}
                  onChange={(e) => setNuevoUserId(e.target.value)}
                  className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
                >
                  <option value="">Sin usuario (sistema)</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              {/* Tipo de evento */}
              <div>
                <label htmlFor="nuevo-action-sel" className="block text-xs font-medium text-foreground mb-1">
                  Tipo de evento <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <select
                  id="nuevo-action-sel"
                  value={nuevoAction}
                  onChange={(e) => setNuevoAction(e.target.value)}
                  className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
                >
                  {ACCIONES.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              {/* Módulo */}
              <div>
                <label htmlFor="nuevo-entity-sel" className="block text-xs font-medium text-foreground mb-1">
                  Módulo afectado <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <select
                  id="nuevo-entity-sel"
                  value={nuevoEntity}
                  onChange={(e) => setNuevoEntity(e.target.value)}
                  className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
                >
                  {MODULOS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={crearRegistro}
                disabled={guardando}
                className={btnAzul + (guardando ? " opacity-50 cursor-not-allowed" : "")}
              >
                {guardando ? "Guardando..." : "Registrar evento"}
              </button>
              <button
                onClick={() => { setMostrarForm(false); setNuevoUserId(""); setNuevoAction("LOGIN"); setNuevoEntity("Sistema"); setErroresNuevo({}); }}
                className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Buscador */}
        <div className="relative flex-1 min-w-[200px]" role="search">
          <label htmlFor="buscar-auditoria" className="sr-only">Buscar en el log de auditoría</label>
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          <input
            id="buscar-auditoria"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por fecha, usuario, acción o módulo"
            className="w-full pl-9 pr-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          />
        </div>

        {/* Filtro por tipo de acción */}
        <div>
          <label htmlFor="filtro-accion" className="sr-only">Filtrar por tipo de evento</label>
          <select
            id="filtro-accion"
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="min-h-[44px] px-3 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          >
            <option value="Todos">Todos los eventos</option>
            {ACCIONES.map((a) => (
              <option key={a.value} value={a.value}>{a.value}</option>
            ))}
          </select>
        </div>

        {/* Filtro por módulo */}
        <div>
          <label htmlFor="filtro-modulo" className="sr-only">Filtrar por módulo</label>
          <select
            id="filtro-modulo"
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
            className="min-h-[44px] px-3 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          >
            <option value="Todos">Todos los módulos</option>
            {MODULOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => anunciar(`Mostrando ${filtrados.length} registro(s).`)}
          className={btnAzul}
        >
          Buscar
        </button>
      </div>

      {/* Contador de resultados filtrados */}
      {(busqueda || filtroAccion !== "Todos" || filtroModulo !== "Todos") && (
        <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
          Mostrando {filtrados.length} de {registros.length} registro(s).
        </p>
      )}

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div className="relative">
          <table className="w-full text-sm text-left" aria-labelledby="h-auditoria">
            <caption className="sr-only">
              Log de auditoría con fecha, usuario, tipo de evento y módulo afectado
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Fecha y hora</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Usuario</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Tipo de evento</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Módulo</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Editar</th>
                <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Cargando registros...
                  </td>
                </tr>
              ) : errorCarga ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center" role="alert">
                    <span className="text-destructive">{errorCarga}</span>
                    <button onClick={cargarRegistros} className="ml-3 text-primary underline text-sm">
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    {registros.length === 0
                      ? "No hay registros de auditoría."
                      : "No se encontraron registros con ese criterio."}
                  </td>
                </tr>
              ) : (
                filtrados.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-foreground whitespace-nowrap">
                      {formatearFecha(r.created_at)}
                    </td>
                    <td className="py-3 pr-4">
                      {r.users ? (
                        <div>
                          <p className="text-foreground font-medium">{r.users.name}</p>
                          <p className="text-xs text-muted-foreground">{r.users.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sistema</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{badgeAccion(r.action ?? "")}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {r.entity ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={(e) => abrirEdicion(r.id, e.currentTarget)}
                        aria-label={`Editar registro: ${r.action} en ${r.entity}`}
                        aria-expanded={editandoId === r.id}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
                      >
                        <IcoEditar />
                      </button>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={(e) => abrirEliminar(r.id, e.currentTarget)}
                        aria-label={`Eliminar registro: ${r.action} en ${r.entity}`}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                      >
                        <IcoEliminar />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Panel edición inline */}
          {editandoId !== null && (() => {
            const reg = registros.find((r) => r.id === editandoId);
            if (!reg) return null;
            return (
              <PanelEdicion
                registro={reg}
                usuarios={usuarios}
                onGuardar={(d) => guardarEdicion(editandoId, d)}
                onCancelar={cerrarEdicion}
              />
            );
          })()}
        </div>
      </div>
      <BotonAyuda modulo="Auditoría" />
    </div>
  );
};

export default Auditoria;
