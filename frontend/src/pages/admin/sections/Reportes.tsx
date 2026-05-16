import { useState, useEffect, useRef } from "react";
import DialogoConfirmar from "../sections/DialogoConfirmar";

type EstadoReporte = "Pendiente" | "Revisado";

interface Reporte {
  id: string;
  fecha: string;
  usuario: string;
  problema: string;
  estado: EstadoReporte;
}

const reportesIniciales: Reporte[] = [
  { id: "1", fecha: "18/04/2026", usuario: "ana@gmail.com",  problema: "El texto simplificado pierde el contexto principal.", estado: "Pendiente" },
  { id: "2", fecha: "18/03/2026", usuario: "juan@gmail.com", problema: "Error al exportar el resultado en formato .txt.",       estado: "Revisado"  },
  { id: "3", fecha: "17/02/2026", usuario: "luis@gmail.com", problema: "La interfaz no responde correctamente en móvil.",       estado: "Pendiente" },
];

const filtros = [
  { valor: "Todos",     label: "Pendiente / Revisado" },
  { valor: "Pendiente", label: "Pendiente" },
  { valor: "Revisado",  label: "Revisado" },
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

// Panel edición inline
interface PanelProps { reporte: Reporte; onGuardar: (d: Partial<Reporte>) => void; onCancelar: () => void; }

const PanelEdicion = ({ reporte, onGuardar, onCancelar }: PanelProps) => {
  const [usuario, setUsuario]   = useState(reporte.usuario);
  const [problema, setProblema] = useState(reporte.problema);
  const [estado, setEstado]     = useState<EstadoReporte>(reporte.estado);
  const [errores, setErrores]   = useState<{ usuario?: string; problema?: string }>({});
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelar(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancelar]);

  const guardar = () => {
    const e: { usuario?: string; problema?: string } = {};
    if (!usuario.trim()) e.usuario = "El usuario es obligatorio.";
    if (!problema.trim()) e.problema = "El problema es obligatorio.";
    setErrores(e);
    if (Object.keys(e).length > 0) { ref.current?.focus(); return; }
    onGuardar({ usuario, problema, estado });
  };

  return (
    <div role="region" aria-label={"Editar reporte del " + reporte.fecha}
      className="absolute left-0 right-0 z-20 bg-white border border-border rounded-lg shadow-xl p-5 mt-1">
      <h3 className="text-base font-bold text-foreground mb-4">Editar reporte</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="rep-edit-usuario" className="block text-xs font-medium text-foreground mb-1">Usuario <span aria-hidden="true" className="text-destructive">*</span></label>
          <input id="rep-edit-usuario" ref={ref} type="text" value={usuario}
            onChange={(e) => setUsuario(e.target.value)} aria-required="true"
            aria-invalid={errores.usuario ? true : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.usuario ? "border-destructive" : "border-border")} />
          {errores.usuario && <p role="alert" className="mt-1 text-xs text-destructive">{errores.usuario}</p>}
        </div>
        <div>
          <label htmlFor="rep-edit-problema" className="block text-xs font-medium text-foreground mb-1">Problema <span aria-hidden="true" className="text-destructive">*</span></label>
          <input id="rep-edit-problema" type="text" value={problema}
            onChange={(e) => setProblema(e.target.value)} aria-required="true"
            aria-invalid={errores.problema ? true : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.problema ? "border-destructive" : "border-border")} />
          {errores.problema && <p role="alert" className="mt-1 text-xs text-destructive">{errores.problema}</p>}
        </div>
        <div>
          <label htmlFor="rep-edit-estado" className="block text-xs font-medium text-foreground mb-1">Estado</label>
          <select id="rep-edit-estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoReporte)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="Pendiente">Pendiente</option>
            <option value="Revisado">Revisado</option>
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

const Reportes = () => {
  const [reportes, setReportes]         = useState<Reporte[]>(reportesIniciales);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [editandoId, setEditandoId]     = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [nuevoProblema, setNuevoProblema] = useState("");
  const [erroresNuevo, setErroresNuevo] = useState<{ usuario?: string; problema?: string }>({});
  const [mensaje, setMensaje]           = useState("");
  const botonOrigenRef  = useRef<HTMLButtonElement | null>(null);
  const primerCampoRef  = useRef<HTMLInputElement>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  useEffect(() => { if (mostrarForm) setTimeout(() => primerCampoRef.current?.focus(), 50); }, [mostrarForm]);

  const filtrados = reportes.filter((r) => filtroEstado === "Todos" || r.estado === filtroEstado);

  const crearReporte = () => {
    const e: { usuario?: string; problema?: string } = {};
    if (!nuevoUsuario.trim()) e.usuario = "El usuario es obligatorio.";
    if (!nuevoProblema.trim()) e.problema = "El problema es obligatorio.";
    setErroresNuevo(e);
    if (Object.keys(e).length > 0) { primerCampoRef.current?.focus(); return; }
    setReportes((prev) => [{
      id: crypto.randomUUID(),
      fecha: new Date().toLocaleDateString("es-CR"),
      usuario: nuevoUsuario, problema: nuevoProblema, estado: "Pendiente",
    }, ...prev]);
    setNuevoUsuario(""); setNuevoProblema(""); setErroresNuevo({}); setMostrarForm(false);
    anunciar("Reporte creado correctamente.");
  };

  const abrirEdicion = (id: string, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn; setEditandoId(id); setEliminandoId(null);
  };
  const cerrarEdicion = () => { setEditandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };
  const guardarEdicion = (id: string, datos: Partial<Reporte>) => {
    setReportes((prev) => prev.map((r) => r.id === id ? { ...r, ...datos } : r));
    cerrarEdicion(); anunciar("Reporte actualizado correctamente.");
  };

  const marcarRevisado = (id: string) => {
    setReportes((prev) => prev.map((r) => r.id === id ? { ...r, estado: "Revisado" } : r));
    anunciar("Reporte marcado como revisado.");
  };

  const abrirEliminar = (id: string, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn; setEliminandoId(id); setEditandoId(null);
  };
  const confirmarEliminar = () => {
    setReportes((prev) => prev.filter((r) => r.id !== eliminandoId));
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
    anunciar("Reporte eliminado.");
  };
  const cancelarEliminar = () => { setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };

  const reporteAEliminar = reportes.find((r) => r.id === eliminandoId);

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId && reporteAEliminar && (
        <DialogoConfirmar titulo="Eliminar reporte"
          mensaje={"¿Estás segura de que querés eliminar el reporte de " + reporteAEliminar.usuario + "? Esta acción no se puede deshacer."}
          onConfirmar={confirmarEliminar} onCancelar={cancelarEliminar} />
      )}

      <h2 id="h-reportes" className="text-2xl font-bold text-center text-foreground mb-6">Reportes de Problemas</h2>

      {/* Nuevo reporte */}
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
                <label htmlFor="rep-nuevo-usuario" className="block text-xs font-medium text-foreground mb-1">Usuario <span aria-hidden="true" className="text-destructive">*</span></label>
                <input id="rep-nuevo-usuario" ref={primerCampoRef} type="text" value={nuevoUsuario}
                  onChange={(e) => setNuevoUsuario(e.target.value)} placeholder="correo@ejemplo.com"
                  aria-required="true"
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.usuario ? "border-destructive" : "border-border")} />
                {erroresNuevo.usuario && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.usuario}</p>}
              </div>
              <div>
                <label htmlFor="rep-nuevo-problema" className="block text-xs font-medium text-foreground mb-1">Descripción del problema <span aria-hidden="true" className="text-destructive">*</span></label>
                <input id="rep-nuevo-problema" type="text" value={nuevoProblema}
                  onChange={(e) => setNuevoProblema(e.target.value)} placeholder="Describa el problema reportado"
                  aria-required="true"
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.problema ? "border-destructive" : "border-border")} />
                {erroresNuevo.problema && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.problema}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={crearReporte} className={btnAzul}>Crear reporte</button>
              <button onClick={() => { setMostrarForm(false); setNuevoUsuario(""); setNuevoProblema(""); setErroresNuevo({}); }}
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
            {filtros.map((f) => <option key={f.valor} value={f.valor}>{f.label}</option>)}
          </select>
        </div>
        <button onClick={() => anunciar("Mostrando " + filtrados.length + " reporte(s).")} className={btnAzul}>Filtrar</button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <div className="relative">
          <table className="w-full text-sm text-left" aria-labelledby="h-reportes">
            <caption className="sr-only">Lista de reportes de problemas con opciones para editar, marcar revisado y eliminar</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Fecha</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Usuario</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Problema</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Estado</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Editar</th>
                <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No hay reportes con el estado seleccionado.</td></tr>
              ) : (
                filtrados.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 text-foreground whitespace-nowrap">{r.fecha}</td>
                    <td className="py-3 pr-3">
                      <a href={"mailto:" + r.usuario} className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded">{r.usuario}</a>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground max-w-[200px] truncate" title={r.problema}>{r.problema}</td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-col gap-1">
                        <span className={"inline-block px-2 py-0.5 rounded-full text-xs font-medium " + (r.estado === "Revisado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>
                          {r.estado}
                        </span>
                        {r.estado === "Pendiente" && (
                          <button onClick={() => marcarRevisado(r.id)} aria-label={"Marcar como revisado el reporte de " + r.usuario}
                            className="text-xs text-primary underline text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded">
                            Marcar revisado
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <button onClick={(e) => abrirEdicion(r.id, e.currentTarget)}
                        aria-label={"Editar reporte de " + r.usuario} aria-expanded={editandoId === r.id}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]">
                        <IcoEditar />
                      </button>
                    </td>
                    <td className="py-3">
                      <button onClick={(e) => abrirEliminar(r.id, e.currentTarget)}
                        aria-label={"Eliminar reporte de " + r.usuario}
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
            const rep = reportes.find((r) => r.id === editandoId);
            if (!rep) return null;
            return <PanelEdicion reporte={rep} onGuardar={(d) => guardarEdicion(editandoId, d)} onCancelar={cerrarEdicion} />;
          })()}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button onClick={() => anunciar("Cambios guardados correctamente.")} className={btnAzul + " px-10"}>Guardar</button>
      </div>
    </div>
  );
};

export default Reportes;
