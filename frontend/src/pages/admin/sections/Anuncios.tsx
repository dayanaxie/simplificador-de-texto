import { useState } from "react";

interface Anuncio {
  id: string;
  titulo: string;
  descripcion: string;
  autor: string;
  fecha: string;
}

const anunciosIniciales: Anuncio[] = [
  { id: "1", titulo: "Anuncio1",           autor: "ana@gmail.com",  fecha: "20/04/2026", descripcion: "Descripción del anuncio 1" },
  { id: "2", titulo: "Anuncio 33",         autor: "juan@gmail.com", fecha: "18/04/2026", descripcion: "Descripción del anuncio 33" },
  { id: "3", titulo: "Anuncio Importante", autor: "luis@gmail.com", fecha: "05/03/2026", descripcion: "Descripción del anuncio importante" },
];

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
  const [anuncios, setAnuncios]       = useState<Anuncio[]>(anunciosIniciales);
  const [titulo, setTitulo]           = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editandoId, setEditandoId]   = useState<string | null>(null);
  const [errores, setErrores]         = useState<{ titulo?: string; descripcion?: string }>({});
  const [mensaje, setMensaje]         = useState("");

  const anunciar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 4000);
  };

  const validar = () => {
    const e: { titulo?: string; descripcion?: string } = {};
    if (!titulo.trim())       e.titulo      = "El título es obligatorio.";
    if (!descripcion.trim())  e.descripcion = "La descripción es obligatoria.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const limpiar = () => {
    setTitulo("");
    setDescripcion("");
    setEditandoId(null);
    setErrores({});
  };

  const publicar = () => {
    if (!validar()) return;
    if (editandoId) {
      setAnuncios((prev) =>
        prev.map((a) => a.id === editandoId ? { ...a, titulo, descripcion } : a)
      );
      anunciar("Anuncio actualizado correctamente.");
    } else {
      setAnuncios((prev) => [
        {
          id: crypto.randomUUID(),
          titulo,
          descripcion,
          autor: "admin@sistema.com",
          fecha: new Date().toLocaleDateString("es-CR"),
        },
        ...prev,
      ]);
      anunciar("Anuncio publicado correctamente.");
    }
    limpiar();
  };

  const iniciarEdicion = (anuncio: Anuncio) => {
    setEditandoId(anuncio.id);
    setTitulo(anuncio.titulo);
    setDescripcion(anuncio.descripcion);
    setErrores({});
    document.getElementById("titulo-anuncio")?.focus();
  };

  const eliminar = (id: string, tit: string) => {
    if (!window.confirm("¿Eliminar el anuncio \"" + tit + "\"?")) return;
    setAnuncios((prev) => prev.filter((a) => a.id !== id));
    anunciar("Anuncio eliminado.");
  };

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {mensaje}
      </div>

      <h2 className="text-2xl font-bold text-center text-foreground mb-6">Anuncios</h2>

      {/* Formulario */}
      <section aria-labelledby="h-nuevo-anuncio">
        <h3 id="h-nuevo-anuncio" className="text-lg font-bold text-foreground mb-4">
          {editandoId ? "Editar anuncio" : "Nuevo anuncio"}
        </h3>

        <div className="space-y-3 mb-5">
          <div>
            <label htmlFor="titulo-anuncio" className="block text-sm font-medium text-foreground mb-1">
              Título del anuncio <span aria-hidden="true" className="text-destructive">*</span>
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
                "w-full px-4 py-2 border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 " +
                (errores.titulo ? "border-destructive" : "border-border")
              }
            />
            {errores.titulo && (
              <p id="err-titulo" role="alert" className="mt-1 text-xs text-destructive">{errores.titulo}</p>
            )}
          </div>

          <div>
            <label htmlFor="desc-anuncio" className="block text-sm font-medium text-foreground mb-1">
              Descripción de publicación <span aria-hidden="true" className="text-destructive">*</span>
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
                "w-full px-4 py-2 border rounded-md text-sm resize-none bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 " +
                (errores.descripcion ? "border-destructive" : "border-border")
              }
            />
            {errores.descripcion && (
              <p id="err-desc" role="alert" className="mt-1 text-xs text-destructive">{errores.descripcion}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={publicar}
            className="px-6 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {editandoId ? "Actualizar" : "Publicar"}
          </button>
          <button
            onClick={limpiar}
            className="px-6 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Descartar
          </button>
        </div>
      </section>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <caption className="sr-only">Lista de anuncios publicados con opciones para editar y eliminar</caption>
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
            {anuncios.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">No hay anuncios publicados.</td>
              </tr>
            ) : (
              anuncios.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 text-foreground font-medium">{a.titulo}</td>
                  <td className="py-3 pr-4">
                    <a href={"mailto:" + a.autor} className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                      {a.autor}
                    </a>
                  </td>
                  <td className="py-3 pr-4 text-foreground">{a.fecha}</td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => iniciarEdicion(a)}
                      aria-label={"Editar anuncio: " + a.titulo}
                      className="p-1 rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <IcoEditar />
                    </button>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => eliminar(a.id, a.titulo)}
                      aria-label={"Eliminar anuncio: " + a.titulo}
                      className="p-1 rounded text-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
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
          onClick={() => anunciar("Cambios guardados.")}
          className="px-8 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default Anuncios;
