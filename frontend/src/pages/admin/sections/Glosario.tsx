import { useState, useEffect, useRef } from "react";
import DialogoConfirmar from "../sections/DialogoConfirmar";

interface Entrada {
  id: string;
  termino: string;
  definicion: string;
}

const entradasIniciales: Entrada[] = [
  { id: "1", termino: "Activo",       definicion: "Recurso con valor económico que posee una empresa o persona." },
  { id: "2", termino: "Liquidez",     definicion: "Capacidad de convertir un activo en dinero de forma rápida." },
  { id: "3", termino: "Capital",      definicion: "Conjunto de bienes y recursos utilizados para producir riqueza." },
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
interface PanelProps { entrada: Entrada; onGuardar: (d: Partial<Entrada>) => void; onCancelar: () => void; }

const PanelEdicion = ({ entrada, onGuardar, onCancelar }: PanelProps) => {
  const [termino, setTermino]     = useState(entrada.termino);
  const [definicion, setDef]      = useState(entrada.definicion);
  const [errores, setErrores]     = useState<{ termino?: string; definicion?: string }>({});
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelar(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancelar]);

  const guardar = () => {
    const e: { termino?: string; definicion?: string } = {};
    if (!termino.trim())   e.termino   = "El término es obligatorio.";
    if (!definicion.trim()) e.definicion = "La definición es obligatoria.";
    setErrores(e);
    if (Object.keys(e).length > 0) { ref.current?.focus(); return; }
    onGuardar({ termino, definicion });
  };

  return (
    <div role="region" aria-label={"Editar término: " + entrada.termino}
      className="absolute left-0 right-0 z-20 bg-white border border-border rounded-lg shadow-xl p-5 mt-1">
      <h3 className="text-base font-bold text-foreground mb-4">Editar término</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="edit-term" className="block text-xs font-medium text-foreground mb-1">
            Término <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input id="edit-term" ref={ref} type="text" value={termino}
            onChange={(e) => setTermino(e.target.value)}
            aria-required="true" aria-invalid={errores.termino ? true : undefined}
            aria-describedby={errores.termino ? "err-term" : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.termino ? "border-destructive" : "border-border")} />
          {errores.termino && <p id="err-term" role="alert" className="mt-1 text-xs text-destructive">{errores.termino}</p>}
        </div>
        <div>
          <label htmlFor="edit-def" className="block text-xs font-medium text-foreground mb-1">
            Definición <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input id="edit-def" type="text" value={definicion}
            onChange={(e) => setDef(e.target.value)}
            aria-required="true" aria-invalid={errores.definicion ? true : undefined}
            aria-describedby={errores.definicion ? "err-def" : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.definicion ? "border-destructive" : "border-border")} />
          {errores.definicion && <p id="err-def" role="alert" className="mt-1 text-xs text-destructive">{errores.definicion}</p>}
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

const Glosario = () => {
  const [entradas, setEntradas]         = useState<Entrada[]>(entradasIniciales);
  const [busqueda, setBusqueda]         = useState("");
  const [editandoId, setEditandoId]     = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [nuevoTerm, setNuevoTerm]       = useState("");
  const [nuevaDef, setNuevaDef]         = useState("");
  const [erroresNuevo, setErroresNuevo] = useState<{ termino?: string; definicion?: string }>({});
  const [mensaje, setMensaje]           = useState("");
  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);
  const primerCampoRef = useRef<HTMLInputElement>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  useEffect(() => { if (mostrarForm) setTimeout(() => primerCampoRef.current?.focus(), 50); }, [mostrarForm]);

  const filtradas = entradas.filter((e) =>
    e.termino.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.definicion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const crearEntrada = () => {
    const e: { termino?: string; definicion?: string } = {};
    if (!nuevoTerm.trim()) e.termino = "El término es obligatorio.";
    if (!nuevaDef.trim())  e.definicion = "La definición es obligatoria.";
    setErroresNuevo(e);
    if (Object.keys(e).length > 0) { primerCampoRef.current?.focus(); return; }
    setEntradas((prev) => [...prev, { id: crypto.randomUUID(), termino: nuevoTerm, definicion: nuevaDef }]);
    setNuevoTerm(""); setNuevaDef(""); setErroresNuevo({}); setMostrarForm(false);
    anunciar("Término \"" + nuevoTerm + "\" agregado al glosario.");
  };

  const abrirEdicion = (id: string, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn; setEditandoId(id); setEliminandoId(null);
  };
  const cerrarEdicion = () => {
    setEditandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };
  const guardarEdicion = (id: string, datos: Partial<Entrada>) => {
    setEntradas((prev) => prev.map((e) => e.id === id ? { ...e, ...datos } : e));
    cerrarEdicion(); anunciar("Término actualizado correctamente.");
  };

  const abrirEliminar = (id: string, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn; setEliminandoId(id); setEditandoId(null);
  };
  const confirmarEliminar = () => {
    const e = entradas.find((e) => e.id === eliminandoId);
    setEntradas((prev) => prev.filter((e) => e.id !== eliminandoId));
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
    anunciar("Término \"" + (e?.termino ?? "") + "\" eliminado.");
  };
  const cancelarEliminar = () => {
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };

  const entradaAEliminar = entradas.find((e) => e.id === eliminandoId);

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId && entradaAEliminar && (
        <DialogoConfirmar
          titulo="Eliminar término"
          mensaje={"¿Estás segura de que querés eliminar \"" + entradaAEliminar.termino + "\" del glosario? Esta acción no se puede deshacer."}
          onConfirmar={confirmarEliminar}
          onCancelar={cancelarEliminar}
        />
      )}

      <h2 id="h-glosario" className="text-2xl font-bold text-center text-foreground mb-6">
        Glosario del sistema
      </h2>

      {/* Botón nuevo + formulario */}
      <section aria-labelledby="h-nuevo-term" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 id="h-nuevo-term" className="text-sm font-semibold text-foreground">
            {mostrarForm ? "Nuevo término" : ""}
          </h3>
          <button onClick={() => setMostrarForm((v) => !v)}
            aria-expanded={mostrarForm} aria-controls="form-nuevo-term"
            className={btnAzul}>
            {mostrarForm ? "Cancelar" : "+ Nuevo término"}
          </button>
        </div>

        {mostrarForm && (
          <div id="form-nuevo-term" className="border border-border rounded-lg p-5 bg-page-bg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="nuevo-term" className="block text-xs font-medium text-foreground mb-1">
                  Término <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <input id="nuevo-term" ref={primerCampoRef} type="text" value={nuevoTerm}
                  onChange={(e) => setNuevoTerm(e.target.value)} placeholder="Ingrese el término"
                  aria-required="true" aria-invalid={erroresNuevo.termino ? true : undefined}
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.termino ? "border-destructive" : "border-border")} />
                {erroresNuevo.termino && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.termino}</p>}
              </div>
              <div>
                <label htmlFor="nueva-def" className="block text-xs font-medium text-foreground mb-1">
                  Definición <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <input id="nueva-def" type="text" value={nuevaDef}
                  onChange={(e) => setNuevaDef(e.target.value)} placeholder="Ingrese la definición"
                  aria-required="true" aria-invalid={erroresNuevo.definicion ? true : undefined}
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.definicion ? "border-destructive" : "border-border")} />
                {erroresNuevo.definicion && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.definicion}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={crearEntrada} className={btnAzul}>Agregar término</button>
              <button onClick={() => { setMostrarForm(false); setNuevoTerm(""); setNuevaDef(""); setErroresNuevo({}); }}
                className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors">
                Descartar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Buscador */}
      <div className="flex gap-3 mb-6" role="search">
        <label htmlFor="buscar-glosario" className="sr-only">Buscar término o definición</label>
        <div className="relative flex-1">
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          <input id="buscar-glosario" type="search" value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)} placeholder="Ingrese el término"
            className="w-full pl-9 pr-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
        </div>
        <button onClick={() => anunciar("Mostrando " + filtradas.length + " resultado(s).")} className={btnAzul}>
          Buscar
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <div className="relative">
          <table className="w-full text-sm text-left" aria-labelledby="h-glosario">
            <caption className="sr-only">Glosario del sistema con opciones para editar y eliminar cada término</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Término</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Definición</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Editar</th>
                <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No se encontraron términos.</td></tr>
              ) : (
                filtradas.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-foreground font-medium">{e.termino}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{e.definicion}</td>
                    <td className="py-3 pr-4">
                      <button onClick={(ev) => abrirEdicion(e.id, ev.currentTarget)}
                        aria-label={"Editar término: " + e.termino} aria-expanded={editandoId === e.id}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]">
                        <IcoEditar />
                      </button>
                    </td>
                    <td className="py-3">
                      <button onClick={(ev) => abrirEliminar(e.id, ev.currentTarget)}
                        aria-label={"Eliminar término: " + e.termino}
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
            const entrada = entradas.find((e) => e.id === editandoId);
            if (!entrada) return null;
            return <PanelEdicion entrada={entrada} onGuardar={(d) => guardarEdicion(editandoId, d)} onCancelar={cerrarEdicion} />;
          })()}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button onClick={() => anunciar("Glosario guardado correctamente.")} className={btnAzul + " px-10"}>
          Guardar
        </button>
      </div>
    </div>
  );
};

export default Glosario;
