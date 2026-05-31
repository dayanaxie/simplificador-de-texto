import { useState, useRef, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import DialogoConfirmar from "./DialogoConfirmar";

interface Anuncio {
  id: number;
  title: string;
  content: string;
  start_date: string;
  end_date: string;
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
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const Anuncios = () => {
  const [anuncios, setAnuncios]         = useState<Anuncio[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [errorCarga, setErrorCarga]     = useState("");
  const [titulo, setTitulo]             = useState("");
  const [contenido, setContenido]       = useState("");
  const [fechaInicio, setFechaInicio]   = useState("");
  const [fechaFin, setFechaFin]         = useState("");
  const [editandoId, setEditandoId]     = useState<number | null>(null);
  const [guardando, setGuardando]       = useState(false);
  const [errores, setErrores]           = useState<Record<string, string>>({});
  const [filtroDesde, setFiltroDesde]   = useState("");
  const [filtroHasta, setFiltroHasta]   = useState("");
  const [errorFiltro, setErrorFiltro]   = useState("");
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [mensaje, setMensaje]           = useState("");
  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  const cargarAnuncios = async () => {
    setCargando(true); setErrorCarga("");
    const { data, error } = await supabase
      .from("announcements").select("*").order("id", { ascending: false });
    if (error) { console.error(error); setErrorCarga("No se pudieron cargar los anuncios."); }
    else setAnuncios(data ?? []);
    setCargando(false);
  };

  useEffect(() => { cargarAnuncios(); }, []);

  const anunciosFiltrados = anuncios.filter((a) => {
    if (filtroDesde && a.start_date < filtroDesde) return false;
    if (filtroHasta && a.end_date   > filtroHasta) return false;
    return true;
  });

  const aplicarFiltro = () => {
    if (filtroDesde && filtroHasta && filtroDesde > filtroHasta) {
      setErrorFiltro("La fecha de inicio no puede ser posterior a la de fin."); return;
    }
    setErrorFiltro("");
    anunciar(`Filtro aplicado. Mostrando ${anunciosFiltrados.length} anuncio(s).`);
  };

  const limpiarFiltro = () => { setFiltroDesde(""); setFiltroHasta(""); setErrorFiltro(""); anunciar("Filtro eliminado."); };

  const validar = () => {
    const e: Record<string, string> = {};
    if (!titulo.trim())    e.titulo    = "El título es obligatorio.";
    if (!contenido.trim()) e.contenido = "La descripción es obligatoria.";
    if (!fechaInicio)      e.inicio    = "La fecha de inicio es obligatoria.";
    if (!fechaFin)         e.fin       = "La fecha de fin es obligatoria.";
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) e.fin = "La fecha de fin no puede ser anterior al inicio.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const limpiarFormulario = () => { setTitulo(""); setContenido(""); setFechaInicio(""); setFechaFin(""); setEditandoId(null); setErrores({}); };

  const publicar = async () => {
    if (!validar()) { document.getElementById("input-titulo")?.focus(); return; }
    setGuardando(true);
    const payload = { title: titulo, content: contenido, start_date: fechaInicio, end_date: fechaFin };

    if (editandoId !== null) {
      const { error } = await supabase.from("announcements").update(payload).eq("id", editandoId);
      if (error) { console.error(error); anunciar("Error al actualizar. Revisá la consola."); }
      else { anunciar(`Anuncio "${titulo}" actualizado.`); limpiarFormulario(); await cargarAnuncios(); }
    } else {
      // Sin id — la secuencia lo genera automáticamente
      const { error } = await supabase.from("announcements").insert([payload]);
      if (error) { console.error(error); anunciar("Error al publicar. Revisá la consola."); }
      else { anunciar(`Anuncio "${titulo}" publicado.`); limpiarFormulario(); await cargarAnuncios(); }
    }
    setGuardando(false);
  };

  const iniciarEdicion = (a: Anuncio) => {
    setEditandoId(a.id); setTitulo(a.title); setContenido(a.content ?? "");
    setFechaInicio(a.start_date ?? ""); setFechaFin(a.end_date ?? ""); setErrores({});
    setTimeout(() => document.getElementById("input-titulo")?.focus(), 50);
  };

  const abrirEliminar = (id: number, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEliminandoId(id); };

  const confirmarEliminar = async () => {
    if (eliminandoId === null) return;
    const a = anuncios.find((a) => a.id === eliminandoId);
    const { error } = await supabase.from("announcements").delete().eq("id", eliminandoId);
    if (error) { console.error(error); anunciar("Error al eliminar. Revisá la consola."); }
    else { anunciar(`Anuncio "${a?.title ?? ""}" eliminado.`); await cargarAnuncios(); }
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };

  const cancelarEliminar = () => { setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };
  const anuncioAEliminar = anuncios.find((a) => a.id === eliminandoId);

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId !== null && anuncioAEliminar && (
        <DialogoConfirmar titulo="Eliminar anuncio"
          mensaje={`¿Estás segura de que querés eliminar "${anuncioAEliminar.title}"? Esta acción no se puede deshacer.`}
          onConfirmar={confirmarEliminar} onCancelar={cancelarEliminar} />
      )}

      <h2 id="h-anuncios" className="text-2xl font-bold text-center text-foreground mb-6">Anuncios</h2>

      {/* Formulario */}
      <section aria-labelledby="h-form-anuncio" className="mb-8">
        <h3 id="h-form-anuncio" className="text-lg font-bold text-foreground mb-4">
          {editandoId !== null ? "Editar anuncio" : "Nuevo anuncio"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label htmlFor="input-titulo" className="block text-sm font-medium text-foreground mb-1">
              Título <span aria-hidden="true" className="text-destructive">*</span>
            </label>
            <input id="input-titulo" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del anuncio" aria-required="true"
              aria-invalid={errores.titulo ? true : undefined}
              className={"w-full px-4 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.titulo ? "border-destructive" : "border-border")} />
            {errores.titulo && <p role="alert" className="mt-1 text-xs text-destructive">{errores.titulo}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="input-contenido" className="block text-sm font-medium text-foreground mb-1">
              Descripción <span aria-hidden="true" className="text-destructive">*</span>
            </label>
            <textarea id="input-contenido" value={contenido} onChange={(e) => setContenido(e.target.value)}
              placeholder="Descripción de publicación" rows={4} aria-required="true"
              aria-invalid={errores.contenido ? true : undefined}
              className={"w-full px-4 py-2 border rounded-md text-sm resize-none bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.contenido ? "border-destructive" : "border-border")} />
            {errores.contenido && <p role="alert" className="mt-1 text-xs text-destructive">{errores.contenido}</p>}
          </div>
          <div>
            <label htmlFor="input-inicio" className="block text-sm font-medium text-foreground mb-1">
              Fecha de inicio <span aria-hidden="true" className="text-destructive">*</span>
            </label>
            <input id="input-inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              aria-required="true" aria-invalid={errores.inicio ? true : undefined}
              className={"w-full px-4 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.inicio ? "border-destructive" : "border-border")} />
            {errores.inicio && <p role="alert" className="mt-1 text-xs text-destructive">{errores.inicio}</p>}
          </div>
          <div>
            <label htmlFor="input-fin" className="block text-sm font-medium text-foreground mb-1">
              Fecha de fin <span aria-hidden="true" className="text-destructive">*</span>
            </label>
            <input id="input-fin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              aria-required="true" aria-invalid={errores.fin ? true : undefined}
              className={"w-full px-4 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.fin ? "border-destructive" : "border-border")} />
            {errores.fin && <p role="alert" className="mt-1 text-xs text-destructive">{errores.fin}</p>}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={publicar} disabled={guardando} className={btnAzul + (guardando ? " opacity-50" : "")}>
            {guardando ? "Guardando..." : editandoId !== null ? "Actualizar" : "Publicar"}
          </button>
          <button onClick={limpiarFormulario} className={btnAzul}>Descartar</button>
        </div>
      </section>

      {/* Filtro */}
      <section aria-labelledby="h-filtro" className="mb-6">
        <h3 id="h-filtro" className="text-sm font-semibold text-foreground mb-3">Filtrar por fecha</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="filtro-desde" className="block text-xs font-medium text-foreground mb-1">Desde</label>
            <input id="filtro-desde" type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)}
              className="px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
          </div>
          <div>
            <label htmlFor="filtro-hasta" className="block text-xs font-medium text-foreground mb-1">Hasta</label>
            <input id="filtro-hasta" type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)}
              className="px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
          </div>
          <button onClick={aplicarFiltro} className={btnAzul}>Filtrar</button>
          {(filtroDesde || filtroHasta) && (
            <button onClick={limpiarFiltro} className="min-h-[44px] px-4 text-sm text-muted-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded">
              Limpiar filtro
            </button>
          )}
        </div>
        {errorFiltro && <p role="alert" className="mt-2 text-xs text-destructive">{errorFiltro}</p>}
        {(filtroDesde || filtroHasta) && !errorFiltro && (
          <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
            Mostrando {anunciosFiltrados.length} de {anuncios.length} anuncio(s).
          </p>
        )}
      </section>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left" aria-labelledby="h-anuncios">
          <caption className="sr-only">Lista de anuncios con título, fechas y opciones para editar y eliminar</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Título</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Inicio</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Fin</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Estado</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Editar</th>
              <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Cargando anuncios...</td></tr>
            ) : errorCarga ? (
              <tr>
                <td colSpan={6} className="py-8 text-center" role="alert">
                  <span className="text-destructive">{errorCarga}</span>
                  <button onClick={cargarAnuncios} className="ml-3 text-primary underline text-sm">Reintentar</button>
                </td>
              </tr>
            ) : anunciosFiltrados.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">
                {anuncios.length === 0 ? "No hay anuncios publicados." : "No hay anuncios en el rango seleccionado."}
              </td></tr>
            ) : (
              anunciosFiltrados.map((a) => {
                const hoy = new Date().toISOString().split("T")[0];
                const vigente = a.start_date <= hoy && a.end_date >= hoy;
                return (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-foreground font-medium">{a.title}</td>
                    <td className="py-3 pr-4 text-foreground whitespace-nowrap">{formatearFecha(a.start_date)}</td>
                    <td className="py-3 pr-4 text-foreground whitespace-nowrap">{formatearFecha(a.end_date)}</td>
                    <td className="py-3 pr-4">
                      <span className={"inline-block px-2 py-0.5 rounded-full text-xs font-medium " + (vigente ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
                        {vigente ? "Vigente" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <button onClick={() => iniciarEdicion(a)} aria-label={"Editar anuncio: " + a.title}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]">
                        <IcoEditar />
                      </button>
                    </td>
                    <td className="py-3">
                      <button onClick={(e) => abrirEliminar(a.id, e.currentTarget)} aria-label={"Eliminar anuncio: " + a.title}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive">
                        <IcoEliminar />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Anuncios;
