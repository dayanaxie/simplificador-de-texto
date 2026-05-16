import { useState, useEffect, useRef } from "react";
import DialogoConfirmar from "../sections/DialogoConfirmar";

interface RegistroAuditoria {
  id: string;
  fecha: string;
  usuario: string;
  detalle: string;
  accion: string;
}

const registrosIniciales: RegistroAuditoria[] = [
  { id: "1", fecha: "18/04/2026", usuario: "ana@gmail.com",  detalle: "----", accion: "Incompleto" },
  { id: "2", fecha: "18/03/2026", usuario: "juan@gmail.com", detalle: "----", accion: "Completado" },
  { id: "3", fecha: "17/02/2026", usuario: "luis@gmail.com", detalle: "----", accion: "Completado" },
];

const btnAzul =
  "inline-flex items-center justify-center min-h-[44px] px-6 " +
  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
  "text-sm font-medium rounded-md hover:opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
  "transition-opacity duration-150";

// ── Íconos ────────────────────────────────────────────────────────────────────
const IcoEditar = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IcoEliminar = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ── Panel de edición inline ───────────────────────────────────────────────────
interface PanelEdicionProps {
  registro: RegistroAuditoria;
  onGuardar: (datos: Partial<RegistroAuditoria>) => void;
  onCancelar: () => void;
}

const PanelEdicion = ({ registro, onGuardar, onCancelar }: PanelEdicionProps) => {
  const [usuario, setUsuario] = useState(registro.usuario);
  const [detalle, setDetalle] = useState(registro.detalle);
  const [accion, setAccion]   = useState(registro.accion);
  const [errores, setErrores] = useState<{ usuario?: string }>({});
  const primerCampoRef        = useRef<HTMLInputElement>(null);

  useEffect(() => { primerCampoRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelar(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancelar]);

  const guardar = () => {
    const e: { usuario?: string } = {};
    if (!usuario.trim()) e.usuario = "El usuario es obligatorio.";
    setErrores(e);
    if (Object.keys(e).length > 0) { primerCampoRef.current?.focus(); return; }
    onGuardar({ usuario, detalle, accion });
  };

  return (
    <div
      role="region"
      aria-label={"Editar registro del " + registro.fecha}
      className="absolute left-0 right-0 z-20 bg-white border border-border rounded-lg shadow-xl p-5 mt-1"
    >
      <h3 className="text-base font-bold text-foreground mb-4">
        Editar registro — {registro.fecha}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="edit-usuario" className="block text-xs font-medium text-foreground mb-1">
            Usuario <span aria-hidden="true" className="text-destructive">*</span>
            <span className="sr-only">(obligatorio)</span>
          </label>
          <input
            id="edit-usuario"
            ref={primerCampoRef}
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            aria-required="true"
            aria-invalid={errores.usuario ? true : undefined}
            aria-describedby={errores.usuario ? "err-edit-usuario" : undefined}
            className={
              "w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground " +
              "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
              (errores.usuario ? "border-destructive" : "border-border")
            }
          />
          {errores.usuario && (
            <p id="err-edit-usuario" role="alert" className="mt-1 text-xs text-destructive">
              {errores.usuario}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="edit-detalle" className="block text-xs font-medium text-foreground mb-1">
            Detalle
          </label>
          <input
            id="edit-detalle"
            type="text"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          />
        </div>

        <div>
          <label htmlFor="edit-accion" className="block text-xs font-medium text-foreground mb-1">
            Acción
          </label>
          <select
            id="edit-accion"
            value={accion}
            onChange={(e) => setAccion(e.target.value)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          >
            <option value="Completado">Completado</option>
            <option value="Incompleto">Incompleto</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={guardar} className={btnAzul}>Guardar cambios</button>
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
  const [registros, setRegistros]       = useState<RegistroAuditoria[]>(registrosIniciales);
  const [busqueda, setBusqueda]         = useState("");
  const [editandoId, setEditandoId]     = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [mensaje, setMensaje]           = useState("");

  // ── Estado del formulario de nuevo registro ──────────────────────────────
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [nuevoDetalle, setNuevoDetalle] = useState("");
  const [nuevoAccion, setNuevoAccion]   = useState("Completado");
  const [erroresNuevo, setErroresNuevo] = useState<{ usuario?: string }>({});

  const botonOrigenRef  = useRef<HTMLButtonElement | null>(null);
  const primerCampoNuevoRef = useRef<HTMLInputElement>(null);

  const anunciar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 5000);
  };

  // Mover foco al formulario cuando se abre
  useEffect(() => {
    if (mostrarForm) {
      setTimeout(() => primerCampoNuevoRef.current?.focus(), 50);
    }
  }, [mostrarForm]);

  const filtrados = registros.filter((r) =>
    r.fecha.includes(busqueda) ||
    r.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.accion.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ── Crear nuevo registro ──────────────────────────────────────────────────
  const validarNuevo = () => {
    const e: { usuario?: string } = {};
    if (!nuevoUsuario.trim()) e.usuario = "El usuario es obligatorio.";
    setErroresNuevo(e);
    return Object.keys(e).length === 0;
  };

  const crearRegistro = () => {
    if (!validarNuevo()) {
      primerCampoNuevoRef.current?.focus();
      return;
    }
    const hoy = new Date();
    const fecha = hoy.toLocaleDateString("es-CR");
    const nuevo: RegistroAuditoria = {
      id:      crypto.randomUUID(),
      fecha,
      usuario: nuevoUsuario,
      detalle: nuevoDetalle || "----",
      accion:  nuevoAccion,
    };
    setRegistros((prev) => [nuevo, ...prev]);
    setNuevoUsuario("");
    setNuevoDetalle("");
    setNuevoAccion("Completado");
    setErroresNuevo({});
    setMostrarForm(false);
    anunciar("Registro de " + nuevo.usuario + " agregado correctamente.");
  };

  const descartarNuevo = () => {
    setNuevoUsuario("");
    setNuevoDetalle("");
    setNuevoAccion("Completado");
    setErroresNuevo({});
    setMostrarForm(false);
  };

  // ── Editar ────────────────────────────────────────────────────────────────
  const abrirEdicion = (id: string, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn;
    setEditandoId(id);
    setEliminandoId(null);
  };

  const cerrarEdicion = () => {
    setEditandoId(null);
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;
  };

  const guardarEdicion = (id: string, datos: Partial<RegistroAuditoria>) => {
    setRegistros((prev) => prev.map((r) => r.id === id ? { ...r, ...datos } : r));
    cerrarEdicion();
    anunciar("Registro actualizado correctamente.");
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const abrirEliminar = (id: string, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn;
    setEliminandoId(id);
    setEditandoId(null);
  };

  const confirmarEliminar = () => {
    if (!eliminandoId) return;
    const reg = registros.find((r) => r.id === eliminandoId);
    setRegistros((prev) => prev.filter((r) => r.id !== eliminandoId));
    setEliminandoId(null);
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;
    anunciar("Registro del " + (reg?.fecha ?? "") + " eliminado.");
  };

  const cancelarEliminar = () => {
    setEliminandoId(null);
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;
  };

  const registroAEliminar = registros.find((r) => r.id === eliminandoId);

  return (
    <div>
      {/* Región live — WCAG 4.1.3 */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {mensaje}
      </div>

      {/* Diálogo de eliminación */}
      {eliminandoId && registroAEliminar && (
        <DialogoConfirmar
          titulo="Eliminar registro"
          mensaje={
            "¿Estás segura de que querés eliminar el registro del " +
            registroAEliminar.fecha + " de " + registroAEliminar.usuario +
            "? Esta acción no se puede deshacer."
          }
          onConfirmar={confirmarEliminar}
          onCancelar={cancelarEliminar}
        />
      )}

      <h2 id="h-auditoria" className="text-2xl font-bold text-center text-foreground mb-6">
        Log de Auditoría
      </h2>

      {/* ── Formulario nuevo registro ─────────────────────────────────────── */}
      <section aria-labelledby="h-nuevo-registro" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 id="h-nuevo-registro" className="text-sm font-semibold text-foreground">
            {mostrarForm ? "Nuevo registro" : ""}
          </h3>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            aria-expanded={mostrarForm}
            aria-controls="form-nuevo-registro"
            className={btnAzul}
          >
            {mostrarForm ? "Cancelar" : "+ Nuevo registro"}
          </button>
        </div>

        {mostrarForm && (
          <div
            id="form-nuevo-registro"
            className="border border-border rounded-lg p-5 bg-page-bg"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Usuario */}
              <div>
                <label htmlFor="nuevo-usuario" className="block text-xs font-medium text-foreground mb-1">
                  Usuario <span aria-hidden="true" className="text-destructive">*</span>
                  <span className="sr-only">(obligatorio)</span>
                </label>
                <input
                  id="nuevo-usuario"
                  ref={primerCampoNuevoRef}
                  type="text"
                  value={nuevoUsuario}
                  onChange={(e) => setNuevoUsuario(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  aria-required="true"
                  aria-invalid={erroresNuevo.usuario ? true : undefined}
                  aria-describedby={erroresNuevo.usuario ? "err-nuevo-usuario" : undefined}
                  className={
                    "w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground " +
                    "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
                    (erroresNuevo.usuario ? "border-destructive" : "border-border")
                  }
                />
                {erroresNuevo.usuario && (
                  <p id="err-nuevo-usuario" role="alert" className="mt-1 text-xs text-destructive">
                    {erroresNuevo.usuario}
                  </p>
                )}
              </div>

              {/* Detalle */}
              <div>
                <label htmlFor="nuevo-detalle" className="block text-xs font-medium text-foreground mb-1">
                  Detalle
                </label>
                <input
                  id="nuevo-detalle"
                  type="text"
                  value={nuevoDetalle}
                  onChange={(e) => setNuevoDetalle(e.target.value)}
                  placeholder="Descripción del evento"
                  className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
                />
              </div>

              {/* Acción */}
              <div>
                <label htmlFor="nuevo-accion" className="block text-xs font-medium text-foreground mb-1">
                  Acción
                </label>
                <select
                  id="nuevo-accion"
                  value={nuevoAccion}
                  onChange={(e) => setNuevoAccion(e.target.value)}
                  className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
                >
                  <option value="Completado">Completado</option>
                  <option value="Incompleto">Incompleto</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={crearRegistro} className={btnAzul}>
                Agregar registro
              </button>
              <button
                onClick={descartarNuevo}
                className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Buscador ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-6" role="search">
        <label htmlFor="buscar-auditoria" className="sr-only">
          Buscar en el log de auditoría por fecha, usuario o acción
        </label>
        <div className="relative flex-1">
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            🔍
          </span>
          <input
            id="buscar-auditoria"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Inserte la fecha, usuario o acción"
            className="w-full pl-9 pr-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          />
        </div>
        <button
          onClick={() => anunciar("Mostrando " + filtrados.length + " registro(s).")}
          className={btnAzul}
        >
          Buscar
        </button>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div className="relative">
          <table className="w-full text-sm text-left" aria-labelledby="h-auditoria">
            <caption className="sr-only">
              Log de auditoría con fecha, usuario, detalle y acción. Cada fila tiene opciones para editar y eliminar.
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Fecha</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Usuario</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Detalle</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Acción</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Editar</th>
                <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No se encontraron registros.
                  </td>
                </tr>
              ) : (
                filtrados.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-foreground whitespace-nowrap">{r.fecha}</td>
                    <td className="py-3 pr-4">
                      <a
                        href={"mailto:" + r.usuario}
                        className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded"
                      >
                        {r.usuario}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{r.detalle}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          "inline-block px-2 py-0.5 rounded-full text-xs font-medium " +
                          (r.accion === "Completado"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800")
                        }
                      >
                        {r.accion}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={(e) => abrirEdicion(r.id, e.currentTarget)}
                        aria-label={"Editar registro del " + r.fecha + " de " + r.usuario}
                        aria-expanded={editandoId === r.id}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
                      >
                        <IcoEditar />
                      </button>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={(e) => abrirEliminar(r.id, e.currentTarget)}
                        aria-label={"Eliminar registro del " + r.fecha + " de " + r.usuario}
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
          {editandoId && (() => {
            const registro = registros.find((r) => r.id === editandoId);
            if (!registro) return null;
            return (
              <PanelEdicion
                registro={registro}
                onGuardar={(datos) => guardarEdicion(editandoId, datos)}
                onCancelar={cerrarEdicion}
              />
            );
          })()}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={() => anunciar("Cambios guardados correctamente.")}
          className={btnAzul + " px-10"}
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default Auditoria;
