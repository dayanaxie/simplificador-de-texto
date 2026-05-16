import { useState, useEffect, useRef } from "react";
import DialogoConfirmar from "../sections/DialogoConfirmar";

type EstadoSolicitud = "Pendiente" | "Aceptada" | "Denegada";

interface Solicitud {
  id: string;
  fecha: string;
  nombre: string;
  correo: string;
  motivo: string;
  estado: EstadoSolicitud;
}

const solicitudesIniciales: Solicitud[] = [
  { id: "1", fecha: "18/04/2026", nombre: "Ana Pérez",  correo: "ana@gmail.com",  motivo: "Necesito el sistema para mis investigaciones académicas.", estado: "Pendiente" },
  { id: "2", fecha: "18/03/2026", nombre: "Juan Mora",  correo: "juan@gmail.com", motivo: "Soy terapeuta y lo usaré con pacientes con dislexia.",     estado: "Aceptada"  },
  { id: "3", fecha: "17/02/2026", nombre: "Luis Rojas", correo: "luis@gmail.com", motivo: "Quiero probar la plataforma.",                               estado: "Denegada"  },
];

const btnAzul =
  "inline-flex items-center justify-center min-h-[44px] px-6 " +
  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
  "text-sm font-medium rounded-md hover:opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
  "transition-opacity duration-150";

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

const badgeEstado = (estado: EstadoSolicitud) => {
  const estilos: Record<EstadoSolicitud, string> = {
    Pendiente: "bg-yellow-100 text-yellow-800",
    Aceptada:  "bg-green-100 text-green-800",
    Denegada:  "bg-red-100 text-red-800",
  };
  return <span className={"inline-block px-2 py-0.5 rounded-full text-xs font-medium " + estilos[estado]}>{estado}</span>;
};

// Panel edición inline
interface PanelProps { solicitud: Solicitud; onGuardar: (d: Partial<Solicitud>) => void; onCancelar: () => void; }

const PanelEdicion = ({ solicitud, onGuardar, onCancelar }: PanelProps) => {
  const [nombre, setNombre]   = useState(solicitud.nombre);
  const [correo, setCorreo]   = useState(solicitud.correo);
  const [motivo, setMotivo]   = useState(solicitud.motivo);
  const [estado, setEstado]   = useState<EstadoSolicitud>(solicitud.estado);
  const [errores, setErrores] = useState<{ nombre?: string; correo?: string }>({});
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelar(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancelar]);

  const guardar = () => {
    const e: { nombre?: string; correo?: string } = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!correo.trim()) e.correo = "El correo es obligatorio.";
    setErrores(e);
    if (Object.keys(e).length > 0) { ref.current?.focus(); return; }
    onGuardar({ nombre, correo, motivo, estado });
  };

  return (
    <div role="region" aria-label={"Editar solicitud de " + solicitud.nombre}
      className="absolute left-0 right-0 z-20 bg-white border border-border rounded-lg shadow-xl p-5 mt-1">
      <h3 className="text-base font-bold text-foreground mb-4">Editar solicitud</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="sol-edit-nombre" className="block text-xs font-medium text-foreground mb-1">Nombre <span aria-hidden="true" className="text-destructive">*</span></label>
          <input id="sol-edit-nombre" ref={ref} type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            aria-required="true" aria-invalid={errores.nombre ? true : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.nombre ? "border-destructive" : "border-border")} />
          {errores.nombre && <p role="alert" className="mt-1 text-xs text-destructive">{errores.nombre}</p>}
        </div>
        <div>
          <label htmlFor="sol-edit-correo" className="block text-xs font-medium text-foreground mb-1">Correo <span aria-hidden="true" className="text-destructive">*</span></label>
          <input id="sol-edit-correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
            aria-required="true" aria-invalid={errores.correo ? true : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.correo ? "border-destructive" : "border-border")} />
          {errores.correo && <p role="alert" className="mt-1 text-xs text-destructive">{errores.correo}</p>}
        </div>
        <div>
          <label htmlFor="sol-edit-motivo" className="block text-xs font-medium text-foreground mb-1">Motivo</label>
          <input id="sol-edit-motivo" type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
        </div>
        <div>
          <label htmlFor="sol-edit-estado" className="block text-xs font-medium text-foreground mb-1">Estado</label>
          <select id="sol-edit-estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoSolicitud)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="Pendiente">Pendiente</option>
            <option value="Aceptada">Aceptada</option>
            <option value="Denegada">Denegada</option>
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

const Solicitudes = () => {
  const [solicitudes, setSolicitudes]   = useState<Solicitud[]>(solicitudesIniciales);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [editandoId, setEditandoId]     = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [nuevoNombre, setNuevoNombre]   = useState("");
  const [nuevoCorreo, setNuevoCorreo]   = useState("");
  const [nuevaPassword, setNuevaPass]   = useState("");
  const [nuevoMotivo, setNuevoMotivo]   = useState("");
  const [erroresNuevo, setErroresNuevo] = useState<Record<string, string>>({});
  const [mensaje, setMensaje]           = useState("");
  const botonOrigenRef  = useRef<HTMLButtonElement | null>(null);
  const primerCampoRef  = useRef<HTMLInputElement>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  useEffect(() => { if (mostrarForm) setTimeout(() => primerCampoRef.current?.focus(), 50); }, [mostrarForm]);

  const filtros = ["Todos", "Pendiente", "Aceptada", "Denegada"];
  const filtradas = solicitudes.filter((s) => filtroEstado === "Todos" || s.estado === filtroEstado);

  const cambiarEstado = (id: string, estado: EstadoSolicitud) => {
    setSolicitudes((prev) => prev.map((s) => s.id === id ? { ...s, estado } : s));
    anunciar("Solicitud " + estado.toLowerCase() + " correctamente.");
  };

  const crearCuenta = () => {
    const e: Record<string, string> = {};
    if (!nuevoNombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!nuevoCorreo.trim()) e.correo = "El correo es obligatorio.";
    if (!nuevaPassword.trim() || nuevaPassword.length < 8) e.password = "La contraseña debe tener al menos 8 caracteres.";
    setErroresNuevo(e);
    if (Object.keys(e).length > 0) { primerCampoRef.current?.focus(); return; }
    setSolicitudes((prev) => [{
      id: crypto.randomUUID(),
      fecha: new Date().toLocaleDateString("es-CR"),
      nombre: nuevoNombre, correo: nuevoCorreo,
      motivo: nuevoMotivo || "Cuenta creada manualmente por administrador.",
      estado: "Aceptada",
    }, ...prev]);
    setNuevoNombre(""); setNuevoCorreo(""); setNuevaPass(""); setNuevoMotivo("");
    setErroresNuevo({}); setMostrarForm(false);
    anunciar("Cuenta de " + nuevoNombre + " creada correctamente.");
  };

  const abrirEdicion = (id: string, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEditandoId(id); setEliminandoId(null); };
  const cerrarEdicion = () => { setEditandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };
  const guardarEdicion = (id: string, datos: Partial<Solicitud>) => {
    setSolicitudes((prev) => prev.map((s) => s.id === id ? { ...s, ...datos } : s));
    cerrarEdicion(); anunciar("Solicitud actualizada correctamente.");
  };

  const abrirEliminar = (id: string, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEliminandoId(id); setEditandoId(null); };
  const confirmarEliminar = () => {
    const s = solicitudes.find((s) => s.id === eliminandoId);
    setSolicitudes((prev) => prev.filter((s) => s.id !== eliminandoId));
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
    anunciar("Solicitud de " + (s?.nombre ?? "") + " eliminada.");
  };
  const cancelarEliminar = () => { setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };

  const solicitudAEliminar = solicitudes.find((s) => s.id === eliminandoId);

  const inputCls = (campo: string) =>
    "w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
    (erroresNuevo[campo] ? "border-destructive" : "border-border");

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId && solicitudAEliminar && (
        <DialogoConfirmar titulo="Eliminar solicitud"
          mensaje={"¿Estás segura de que querés eliminar la solicitud de " + solicitudAEliminar.nombre + "? Esta acción no se puede deshacer."}
          onConfirmar={confirmarEliminar} onCancelar={cancelarEliminar} />
      )}

      <h2 id="h-solicitudes" className="text-2xl font-bold text-center text-foreground mb-6">Solicitudes de Acceso</h2>

      {/* Nueva cuenta */}
      <section aria-labelledby="h-nueva-cuenta" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 id="h-nueva-cuenta" className="text-sm font-semibold text-foreground">{mostrarForm ? "Crear nueva cuenta" : ""}</h3>
          <button onClick={() => setMostrarForm((v) => !v)} aria-expanded={mostrarForm} aria-controls="form-nueva-cuenta" className={btnAzul}>
            {mostrarForm ? "Cancelar" : "+ Crear cuenta"}
          </button>
        </div>
        {mostrarForm && (
          <div id="form-nueva-cuenta" className="border border-border rounded-lg p-5 bg-page-bg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="nc-nombre" className="block text-xs font-medium text-foreground mb-1">Nombre completo <span aria-hidden="true" className="text-destructive">*</span></label>
                <input id="nc-nombre" ref={primerCampoRef} type="text" value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre completo"
                  aria-required="true" className={inputCls("nombre")} />
                {erroresNuevo.nombre && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.nombre}</p>}
              </div>
              <div>
                <label htmlFor="nc-correo" className="block text-xs font-medium text-foreground mb-1">Correo electrónico <span aria-hidden="true" className="text-destructive">*</span></label>
                <input id="nc-correo" type="email" value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)} placeholder="correo@ejemplo.com"
                  aria-required="true" className={inputCls("correo")} />
                {erroresNuevo.correo && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.correo}</p>}
              </div>
              <div>
                <label htmlFor="nc-password" className="block text-xs font-medium text-foreground mb-1">Contraseña inicial <span aria-hidden="true" className="text-destructive">*</span></label>
                <input id="nc-password" type="password" value={nuevaPassword}
                  onChange={(e) => setNuevaPass(e.target.value)} placeholder="Mínimo 8 caracteres"
                  aria-required="true" aria-describedby="nc-password-hint" className={inputCls("password")} />
                <p id="nc-password-hint" className="mt-1 text-xs text-muted-foreground">El usuario podrá cambiarla desde su perfil.</p>
                {erroresNuevo.password && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.password}</p>}
              </div>
              <div>
                <label htmlFor="nc-motivo" className="block text-xs font-medium text-foreground mb-1">Motivo / Nota (opcional)</label>
                <input id="nc-motivo" type="text" value={nuevoMotivo}
                  onChange={(e) => setNuevoMotivo(e.target.value)} placeholder="Motivo de creación"
                  className={inputCls("motivo")} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={crearCuenta} className={btnAzul}>Crear cuenta</button>
              <button onClick={() => { setMostrarForm(false); setNuevoNombre(""); setNuevoCorreo(""); setNuevaPass(""); setNuevoMotivo(""); setErroresNuevo({}); }}
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
          <label htmlFor="filtro-sol" className="sr-only">Filtrar por estado de solicitud</label>
          <select id="filtro-sol" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full text-sm bg-transparent text-foreground focus:outline-none">
            {filtros.map((f) => <option key={f} value={f}>{f === "Todos" ? "Todos los estados" : f}</option>)}
          </select>
        </div>
        <button onClick={() => anunciar("Mostrando " + filtradas.length + " solicitud(es).")} className={btnAzul}>Filtrar</button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <div className="relative">
          <table className="w-full text-sm text-left" aria-labelledby="h-solicitudes">
            <caption className="sr-only">Lista de solicitudes de acceso con opciones para aceptar, denegar, editar y eliminar</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Fecha</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Nombre</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Correo</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Motivo</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Estado</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Editar</th>
                <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No hay solicitudes con el estado seleccionado.</td></tr>
              ) : (
                filtradas.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 text-foreground whitespace-nowrap">{s.fecha}</td>
                    <td className="py-3 pr-3 text-foreground font-medium">{s.nombre}</td>
                    <td className="py-3 pr-3">
                      <a href={"mailto:" + s.correo} className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded">{s.correo}</a>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground max-w-[180px] truncate" title={s.motivo}>{s.motivo}</td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-col gap-1">
                        {badgeEstado(s.estado)}
                        {s.estado === "Pendiente" && (
                          <div className="flex gap-1 mt-1">
                            <button onClick={() => cambiarEstado(s.id, "Aceptada")}
                              aria-label={"Aceptar solicitud de " + s.nombre}
                              className="text-xs px-2 py-0.5 bg-green-600 text-white rounded hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600">
                              Aceptar
                            </button>
                            <button onClick={() => cambiarEstado(s.id, "Denegada")}
                              aria-label={"Denegar solicitud de " + s.nombre}
                              className="text-xs px-2 py-0.5 bg-red-600 text-white rounded hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600">
                              Denegar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <button onClick={(e) => abrirEdicion(s.id, e.currentTarget)}
                        aria-label={"Editar solicitud de " + s.nombre} aria-expanded={editandoId === s.id}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]">
                        <IcoEditar />
                      </button>
                    </td>
                    <td className="py-3">
                      <button onClick={(e) => abrirEliminar(s.id, e.currentTarget)}
                        aria-label={"Eliminar solicitud de " + s.nombre}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive">
                        <IcoEliminar />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {editandoId && (() => {
            const sol = solicitudes.find((s) => s.id === editandoId);
            if (!sol) return null;
            return <PanelEdicion solicitud={sol} onGuardar={(d) => guardarEdicion(editandoId, d)} onCancelar={cerrarEdicion} />;
          })()}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button onClick={() => anunciar("Cambios guardados correctamente.")} className={btnAzul + " px-10"}>Guardar</button>
      </div>
    </div>
  );
};

export default Solicitudes;
