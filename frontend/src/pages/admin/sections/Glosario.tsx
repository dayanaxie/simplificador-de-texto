import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import DialogoConfirmar from "./DialogoConfirmar";

interface Entrada {
  id: number;
  word: string;
  definition: string;
}

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

interface PanelProps {
  entrada: Entrada;
  onGuardar: (datos: { word: string; definition: string }) => void;
  onCancelar: () => void;
}

const PanelEdicion = ({ entrada, onGuardar, onCancelar }: PanelProps) => {
  const [word, setWord]       = useState(entrada.word);
  const [definition, setDef]  = useState(entrada.definition ?? "");
  const [errores, setErrores] = useState<{ word?: string; definition?: string }>({});
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelar(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancelar]);

  const guardar = () => {
    const e: { word?: string; definition?: string } = {};
    if (!word.trim())       e.word       = "El término es obligatorio.";
    if (!definition.trim()) e.definition = "La definición es obligatoria.";
    setErrores(e);
    if (Object.keys(e).length > 0) { ref.current?.focus(); return; }
    onGuardar({ word, definition });
  };

  return (
    <div role="region" aria-label={"Editar término: " + entrada.word}
      className="absolute left-0 right-0 z-20 bg-white border border-border rounded-lg shadow-xl p-5 mt-1">
      <h3 className="text-base font-bold text-foreground mb-4">Editar término</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="edit-word" className="block text-xs font-medium text-foreground mb-1">
            Término <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input id="edit-word" ref={ref} type="text" value={word} onChange={(e) => setWord(e.target.value)}
            aria-required="true" aria-invalid={errores.word ? true : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.word ? "border-destructive" : "border-border")} />
          {errores.word && <p role="alert" className="mt-1 text-xs text-destructive">{errores.word}</p>}
        </div>
        <div>
          <label htmlFor="edit-def" className="block text-xs font-medium text-foreground mb-1">
            Definición <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input id="edit-def" type="text" value={definition} onChange={(e) => setDef(e.target.value)}
            aria-required="true" aria-invalid={errores.definition ? true : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.definition ? "border-destructive" : "border-border")} />
          {errores.definition && <p role="alert" className="mt-1 text-xs text-destructive">{errores.definition}</p>}
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
  const [entradas, setEntradas]         = useState<Entrada[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [errorCarga, setErrorCarga]     = useState("");
  const [busqueda, setBusqueda]         = useState("");
  const [editandoId, setEditandoId]     = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [nuevoWord, setNuevoWord]       = useState("");
  const [nuevaDef, setNuevaDef]         = useState("");
  const [erroresNuevo, setErroresNuevo] = useState<{ word?: string; definition?: string }>({});
  const [guardando, setGuardando]       = useState(false);
  const [mensaje, setMensaje]           = useState("");
  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);
  const primerCampoRef = useRef<HTMLInputElement>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  useEffect(() => { if (mostrarForm) setTimeout(() => primerCampoRef.current?.focus(), 50); }, [mostrarForm]);

  const cargarEntradas = async () => {
    setCargando(true); setErrorCarga("");
    const { data, error } = await supabase.from("glossary").select("*").order("word", { ascending: true });
    if (error) { console.error(error); setErrorCarga("No se pudo cargar el glosario."); }
    else setEntradas(data ?? []);
    setCargando(false);
  };

  useEffect(() => { cargarEntradas(); }, []);

  const filtradas = entradas.filter((e) =>
    e.word.toLowerCase().includes(busqueda.toLowerCase()) ||
    (e.definition ?? "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const crearEntrada = async () => {
    const e: { word?: string; definition?: string } = {};
    if (!nuevoWord.trim()) e.word       = "El término es obligatorio.";
    if (!nuevaDef.trim())  e.definition = "La definición es obligatoria.";
    setErroresNuevo(e);
    if (Object.keys(e).length > 0) { primerCampoRef.current?.focus(); return; }

    const duplicado = entradas.some((en) => en.word.toLowerCase() === nuevoWord.trim().toLowerCase());
    if (duplicado) { setErroresNuevo({ word: "Este término ya existe en el glosario." }); primerCampoRef.current?.focus(); return; }

    setGuardando(true);
    // Sin id — la secuencia lo genera automáticamente
    const { error } = await supabase.from("glossary").insert([{ word: nuevoWord.trim(), definition: nuevaDef.trim() }]);
    if (error) { console.error(error); anunciar("Error al agregar el término. Revisá la consola."); }
    else {
      anunciar(`Término "${nuevoWord}" agregado.`);
      setNuevoWord(""); setNuevaDef(""); setErroresNuevo({}); setMostrarForm(false);
      await cargarEntradas();
    }
    setGuardando(false);
  };

  const abrirEdicion = (id: number, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEditandoId(id); setEliminandoId(null); };
  const cerrarEdicion = () => { setEditandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };

  const guardarEdicion = async (id: number, datos: { word: string; definition: string }) => {
    const { error } = await supabase.from("glossary").update({ word: datos.word, definition: datos.definition }).eq("id", id);
    if (error) { console.error(error); anunciar("Error al actualizar. Revisá la consola."); }
    else { anunciar(`Término "${datos.word}" actualizado.`); await cargarEntradas(); }
    cerrarEdicion();
  };

  const abrirEliminar = (id: number, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEliminandoId(id); setEditandoId(null); };

  const confirmarEliminar = async () => {
    if (eliminandoId === null) return;
    const entrada = entradas.find((e) => e.id === eliminandoId);
    const { error } = await supabase.from("glossary").delete().eq("id", eliminandoId);
    if (error) { console.error(error); anunciar("Error al eliminar. Revisá la consola."); }
    else { anunciar(`Término "${entrada?.word ?? ""}" eliminado.`); await cargarEntradas(); }
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };

  const cancelarEliminar = () => { setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };
  const entradaAEliminar = entradas.find((e) => e.id === eliminandoId);

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId !== null && entradaAEliminar && (
        <DialogoConfirmar titulo="Eliminar término"
          mensaje={`¿Estás segura de que querés eliminar "${entradaAEliminar.word}" del glosario? Esta acción no se puede deshacer.`}
          onConfirmar={confirmarEliminar} onCancelar={cancelarEliminar} />
      )}

      <h2 id="h-glosario" className="text-2xl font-bold text-center text-foreground mb-6">Glosario del sistema</h2>

      {/* Botón + formulario */}
      <section aria-labelledby="h-nuevo-term" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 id="h-nuevo-term" className="text-sm font-semibold text-foreground">{mostrarForm ? "Nuevo término" : ""}</h3>
          <button onClick={() => setMostrarForm((v) => !v)} aria-expanded={mostrarForm} aria-controls="form-nuevo-term" className={btnAzul}>
            {mostrarForm ? "Cancelar" : "+ Nuevo término"}
          </button>
        </div>
        {mostrarForm && (
          <div id="form-nuevo-term" className="border border-border rounded-lg p-5 bg-page-bg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="nuevo-word" className="block text-xs font-medium text-foreground mb-1">
                  Término <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <input id="nuevo-word" ref={primerCampoRef} type="text" value={nuevoWord}
                  onChange={(e) => setNuevoWord(e.target.value)} placeholder="Ej: Simplificación"
                  aria-required="true" aria-invalid={erroresNuevo.word ? true : undefined}
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.word ? "border-destructive" : "border-border")} />
                {erroresNuevo.word && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.word}</p>}
              </div>
              <div>
                <label htmlFor="nueva-def" className="block text-xs font-medium text-foreground mb-1">
                  Definición <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <input id="nueva-def" type="text" value={nuevaDef}
                  onChange={(e) => setNuevaDef(e.target.value)} placeholder="Definición del término"
                  aria-required="true" aria-invalid={erroresNuevo.definition ? true : undefined}
                  className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (erroresNuevo.definition ? "border-destructive" : "border-border")} />
                {erroresNuevo.definition && <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.definition}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={crearEntrada} disabled={guardando} className={btnAzul + (guardando ? " opacity-50" : "")}>
                {guardando ? "Guardando..." : "Agregar término"}
              </button>
              <button onClick={() => { setMostrarForm(false); setNuevoWord(""); setNuevaDef(""); setErroresNuevo({}); }}
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
          <input id="buscar-glosario" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ingrese el término"
            className="w-full pl-9 pr-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
        </div>
        <button onClick={() => anunciar(`Mostrando ${filtradas.length} resultado(s).`)} className={btnAzul}>Buscar</button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <div className="relative">
          <table className="w-full text-sm text-left" aria-labelledby="h-glosario">
            <caption className="sr-only">Glosario del sistema con término y definición</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Término</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Definición</th>
                <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Editar</th>
                <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Cargando glosario...</td></tr>
              ) : errorCarga ? (
                <tr><td colSpan={4} className="py-8 text-center" role="alert">
                  <span className="text-destructive">{errorCarga}</span>
                  <button onClick={cargarEntradas} className="ml-3 text-primary underline text-sm">Reintentar</button>
                </td></tr>
              ) : filtradas.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">
                  {entradas.length === 0 ? "El glosario está vacío." : "No se encontraron términos."}
                </td></tr>
              ) : (
                filtradas.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-foreground font-medium">{e.word}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{e.definition ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <button onClick={(ev) => abrirEdicion(e.id, ev.currentTarget)}
                        aria-label={"Editar término: " + e.word} aria-expanded={editandoId === e.id}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]">
                        <IcoEditar />
                      </button>
                    </td>
                    <td className="py-3">
                      <button onClick={(ev) => abrirEliminar(e.id, ev.currentTarget)}
                        aria-label={"Eliminar término: " + e.word}
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
            const entrada = entradas.find((e) => e.id === editandoId);
            if (!entrada) return null;
            return <PanelEdicion entrada={entrada} onGuardar={(d) => guardarEdicion(editandoId, d)} onCancelar={cerrarEdicion} />;
          })()}
        </div>
      </div>
    </div>
  );
};

export default Glosario;
