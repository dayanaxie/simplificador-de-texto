import { useState, useRef } from "react";
import DialogoConfirmar from "../sections/DialogoConfirmar";  

interface Anuncio {
  id: string;
  titulo: string;
  descripcion: string;
  autor: string;
  fecha: string;
  fechaISO: string;
}

const anunciosIniciales: Anuncio[] = [
  { id: "1", titulo: "Anuncio1",           autor: "ana@gmail.com",  fecha: "20/04/2026", fechaISO: "2026-04-20", descripcion: "Descripción del anuncio 1" },
  { id: "2", titulo: "Anuncio 33",         autor: "juan@gmail.com", fecha: "18/04/2026", fechaISO: "2026-04-18", descripcion: "Descripción del anuncio 33" },
  { id: "3", titulo: "Anuncio Importante", autor: "luis@gmail.com", fecha: "05/03/2026", fechaISO: "2026-03-05", descripcion: "Descripción del anuncio importante" },
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

const Anuncios = () => {
  const [anuncios, setAnuncios]         = useState<Anuncio[]>(anunciosIniciales);
  const [titulo, setTitulo]             = useState("");
  const [descripcion, setDescripcion]   = useState("");
  const [editandoId, setEditandoId]     = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [errores, setErrores]           = useState<{ titulo?: string; descripcion?: string }>({});
  const [filtroDesde, setFiltroDesde]   = useState("");
  const [filtroHasta, setFiltroHasta]   = useState("");
  const [errorFiltro, setErrorFiltro]   = useState("");
  const [mensaje, setMensaje]           = useState("");

  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);

  const anunciar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 5000);
  };

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const anunciosFiltrados = anuncios.filter((a) => {
    if (filtroDesde && a.fechaISO < filtroDesde) return false;
    if (filtroHasta && a.fechaISO > filtroHasta) return false;
    return true;
  });

  const aplicarFiltro = () => {
    if (filtroDesde && filtroHasta && filtroDesde > filtroHasta) {
      setErrorFiltro("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }
    setErrorFiltro("");
    anunciar("Filtro aplicado. Mostrando " + anunciosFiltrados.length + " anuncio(s).");
  };

  const limpiarFiltro = () => {
    setFiltroDesde("");
    setFiltroHasta("");
    setErrorFiltro("");
    anunciar("Filtro eliminado. Mostrando todos los anuncios.");
  };

  // ── Formulario ─────────────────────────────────────────────────────────────
  const validar = () => {
    const e: { titulo?: string; descripcion?: string } = {};
    if (!titulo.trim())      e.titulo      = "El título es obligatorio.";
    if (!descripcion.trim()) e.descripcion = "La descripción es obligatoria.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const limpiarFormulario = () => {
    setTitulo("");
    setDescripcion("");
    setEditandoId(null);
    setErrores({});
  };

  const publicar = () => {
    if (!validar()) {
      if (!titulo.trim()) {
        document.getElementById("titulo-anuncio")?.focus();
      } else {
        document.getElementById("desc-anuncio")?.focus();
      }
      return;
    }
    if (editandoId) {
      setAnuncios((prev) =>
        prev.map((a) => a.id === editandoId ? { ...a, titulo, descripcion } : a)
      );
      anunciar("Anuncio \"" + titulo + "\" actualizado correctamente.");
    } else {
      const hoy = new Date();
      const fechaISO = hoy.toISOString().split("T")[0];
      setAnuncios((prev) => [
        {
          id: crypto.randomUUID(),
          titulo,
          descripcion,
          autor: "admin@sistema.com",
          fecha: hoy.toLocaleDateString("es-CR"),
          fechaISO,
        },
        ...prev,
      ]);
      anunciar("Anuncio \"" + titulo + "\" publicado correctamente.");
    }
    limpiarFormulario();
  };

  const iniciarEdicion = (anuncio: Anuncio) => {
    setEditandoId(anuncio.id);
    setTitulo(anuncio.titulo);
    setDescripcion(anuncio.descripcion);
    setErrores({});
    setTimeout(() => document.getElementById("titulo-anuncio")?.focus(), 50);
  };

  const abrirEliminar = (id: string, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn;
    setEliminandoId(id);
  };

  const confirmarEliminar = () => {
    if (!eliminandoId) return;
    const anuncio = anuncios.find((a) => a.id === eliminandoId);
    setAnuncios((prev) => prev.filter((a) => a.id !== eliminandoId));
    setEliminandoId(null);
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;
    anunciar("Anuncio \"" + (anuncio?.titulo ?? "") + "\" eliminado.");
  };

  const cancelarEliminar = () => {
    setEliminandoId(null);
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;
  };

  const anuncioAEliminar = anuncios.find((a) => a.id === eliminandoId);

  return (
    <div>
      {/* Región live — WCAG 4.1.3 */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {mensaje}
      </div>

      {/* Diálogo de confirmación de eliminación */}
      {eliminandoId && anuncioAEliminar && (
        <DialogoConfirmar
          titulo="Eliminar anuncio"
          mensaje={"¿Estás segura de que querés eliminar el anuncio \"" + anuncioAEliminar.titulo + "\"? Esta acción no se puede deshacer."}
          onConfirmar={confirmarEliminar}
          onCancelar={cancelarEliminar}
        />
      )}

      <h2 id="h-anuncios" className="text-2xl font-bold text-center text-foreground mb-6">
        Anuncios
      </h2>

      {/* ── Formulario ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="h-form-anuncio">
        <h3 id="h-form-anuncio" className="text-lg font-bold text-foreground mb-4">
          {editandoId ? "Editar anuncio" : "Nuevo anuncio"}
        </h3>

        <div className="space-y-4 mb-5">
          <div>
            <label htmlFor="titulo-anuncio" className="block text-sm font-medium text-foreground mb-1">
              Título del anuncio{" "}
              <span aria-hidden="true" className="text-destructive">*</span>
              <span className="sr-only">(obligatorio)</span>
            </label>
            <input
              id="titulo-anuncio"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del anuncio"
              aria-required="true"
              aria-invalid={errores.titulo ? true : undefined}
              aria-describedby={errores.titulo ? "err-titulo" : undefined}
              className={
                "w-full px-4 min-h-[44px] border rounded-md text-sm bg-background text-foreground " +
                "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
                (errores.titulo ? "border-destructive" : "border-border")
              }
            />
            {errores.titulo && (
              <p id="err-titulo" role="alert" className="mt-1 text-xs text-destructive">
                {errores.titulo}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="desc-anuncio" className="block text-sm font-medium text-foreground mb-1">
              Descripción de publicación{" "}
              <span aria-hidden="true" className="text-destructive">*</span>
              <span className="sr-only">(obligatorio)</span>
            </label>
            <textarea
              id="desc-anuncio"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de publicación"
              rows={4}
              aria-required="true"
              aria-invalid={errores.descripcion ? true : undefined}
              aria-describedby={errores.descripcion ? "err-desc" : undefined}
              className={
                "w-full px-4 py-2 border rounded-md text-sm resize-none bg-background text-foreground " +
                "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
                (errores.descripcion ? "border-destructive" : "border-border")
              }
            />
            {errores.descripcion && (
              <p id="err-desc" role="alert" className="mt-1 text-xs text-destructive">
                {errores.descripcion}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <button onClick={publicar} className={btnAzul}>
            {editandoId ? "Actualizar" : "Publicar"}
          </button>
          <button
            onClick={limpiarFormulario}
            className={btnAzul}
            aria-label={editandoId ? "Cancelar edición del anuncio" : "Descartar el formulario"}
          >
            Descartar
          </button>
        </div>
      </section>

      {/* ── Filtro por fecha ────────────────────────────────────────────────── */}
      <section aria-labelledby="h-filtro-anuncios" className="mb-6">
        <h3 id="h-filtro-anuncios" className="text-sm font-semibold text-foreground mb-3">
          Filtrar anuncios por fecha
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="filtro-desde" className="block text-xs font-medium text-foreground mb-1">Desde</label>
            <input
              id="filtro-desde"
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              aria-describedby={errorFiltro ? "err-filtro" : undefined}
              className="px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
            />
          </div>
          <div>
            <label htmlFor="filtro-hasta" className="block text-xs font-medium text-foreground mb-1">Hasta</label>
            <input
              id="filtro-hasta"
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              aria-describedby={errorFiltro ? "err-filtro" : undefined}
              className="px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
            />
          </div>
          <button onClick={aplicarFiltro} className={btnAzul}>Filtrar</button>
          {(filtroDesde || filtroHasta) && (
            <button
              onClick={limpiarFiltro}
              className="min-h-[44px] px-4 text-sm text-muted-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded"
            >
              Limpiar filtro
            </button>
          )}
        </div>
        {errorFiltro && (
          <p id="err-filtro" role="alert" className="mt-2 text-xs text-destructive">{errorFiltro}</p>
        )}
        {(filtroDesde || filtroHasta) && !errorFiltro && (
          <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
            Mostrando {anunciosFiltrados.length} de {anuncios.length} anuncio(s).
          </p>
        )}
      </section>

      {/* ── Tabla ──────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left" aria-labelledby="h-anuncios">
          <caption className="sr-only">
            Lista de anuncios publicados con opciones para editar y eliminar cada uno
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Título</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Autor</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Fecha</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Editar</th>
              <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {anunciosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground" aria-live="polite">
                  {anuncios.length === 0
                    ? "No hay anuncios publicados."
                    : "No hay anuncios en el rango de fechas seleccionado."}
                </td>
              </tr>
            ) : (
              anunciosFiltrados.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 text-foreground font-medium">{a.titulo}</td>
                  <td className="py-3 pr-4">
                    <a
                      href={"mailto:" + a.autor}
                      className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded"
                    >
                      {a.autor}
                    </a>
                  </td>
                  <td className="py-3 pr-4 text-foreground">{a.fecha}</td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => iniciarEdicion(a)}
                      aria-label={"Editar anuncio: " + a.titulo}
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
                    >
                      <IcoEditar />
                    </button>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={(e) => abrirEliminar(a.id, e.currentTarget)}
                      aria-label={"Eliminar anuncio: " + a.titulo}
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

export default Anuncios;
