import { useState } from "react";

interface Entrada {
  id: string;
  termino: string;
  definicion: string;
}

const entradasIniciales: Entrada[] = [
  { id: "1", termino: "Activo",    definicion: "---" },
  { id: "2", termino: "Liquidez",  definicion: "---" },
  { id: "3", termino: "Capital",   definicion: "---" },
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

const Glosario = () => {
  const [entradas, setEntradas]   = useState<Entrada[]>(entradasIniciales);
  const [busqueda, setBusqueda]   = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [termEdit, setTermEdit]   = useState("");
  const [defEdit, setDefEdit]     = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoTerm, setNuevoTerm] = useState("");
  const [nuevaDef, setNuevaDef]   = useState("");
  const [erroresNuevo, setErroresNuevo] = useState<{ termino?: string; definicion?: string }>({});
  const [mensaje, setMensaje]     = useState("");

  const anunciar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 4000);
  };

  const filtradas = entradas.filter(
    (e) =>
      e.termino.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.definicion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const iniciarEdicion = (entrada: Entrada) => {
    setEditandoId(entrada.id);
    setTermEdit(entrada.termino);
    setDefEdit(entrada.definicion);
  };

  const guardarEdicion = (id: string) => {
    setEntradas((prev) =>
      prev.map((e) => e.id === id ? { ...e, termino: termEdit, definicion: defEdit } : e)
    );
    setEditandoId(null);
    anunciar("Entrada actualizada correctamente.");
  };

  const cancelarEdicion = () => setEditandoId(null);

  const eliminar = (id: string, term: string) => {
    if (!window.confirm("¿Eliminar \"" + term + "\" del glosario?")) return;
    setEntradas((prev) => prev.filter((e) => e.id !== id));
    anunciar("Entrada \"" + term + "\" eliminada.");
  };

  const agregarEntrada = () => {
    const e: { termino?: string; definicion?: string } = {};
    if (!nuevoTerm.trim()) e.termino = "El término es obligatorio.";
    if (!nuevaDef.trim())  e.definicion = "La definición es obligatoria.";
    setErroresNuevo(e);
    if (Object.keys(e).length > 0) return;

    setEntradas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), termino: nuevoTerm, definicion: nuevaDef },
    ]);
    setNuevoTerm("");
    setNuevaDef("");
    setMostrarForm(false);
    anunciar("Entrada agregada al glosario.");
  };

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {mensaje}
      </div>

      <h2 id="h-glosario" className="text-2xl font-bold text-center text-foreground mb-6">
        Glosario del sistema
      </h2>

      {/* Buscador */}
      <div className="flex gap-3 mb-6" role="search">
        <label htmlFor="buscar-glosario" className="sr-only">Buscar término en el glosario</label>
        <div className="relative flex-1">
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            🔍
          </span>
          <input
            id="buscar-glosario"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ingrese el término"
            className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          />
        </div>
        <button
          onClick={() => anunciar("Mostrando " + filtradas.length + " resultado(s).")}
          className="px-5 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Buscar
        </button>
      </div>

      {/* Botón agregar nueva entrada */}
      <div className="mb-4">
        <button
          onClick={() => setMostrarForm((v) => !v)}
          aria-expanded={mostrarForm}
          className="text-sm text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          {mostrarForm ? "Cancelar nueva entrada" : "+ Agregar nueva entrada"}
        </button>
      </div>

      {/* Formulario nueva entrada */}
      {mostrarForm && (
        <section aria-labelledby="h-nueva-entrada" className="mb-6 p-4 border border-border rounded-md bg-page-bg">
          <h3 id="h-nueva-entrada" className="text-sm font-semibold text-foreground mb-3">Nueva entrada</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="nuevo-term" className="block text-xs font-medium text-foreground mb-1">
                Término <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <input
                id="nuevo-term"
                type="text"
                value={nuevoTerm}
                onChange={(e) => setNuevoTerm(e.target.value)}
                placeholder="Término"
                aria-required="true"
                aria-invalid={erroresNuevo.termino ? true : undefined}
                className={
                  "w-full px-3 py-2 border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary " +
                  (erroresNuevo.termino ? "border-destructive" : "border-border")
                }
              />
              {erroresNuevo.termino && (
                <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.termino}</p>
              )}
            </div>
            <div>
              <label htmlFor="nueva-def" className="block text-xs font-medium text-foreground mb-1">
                Definición <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <input
                id="nueva-def"
                type="text"
                value={nuevaDef}
                onChange={(e) => setNuevaDef(e.target.value)}
                placeholder="Definición"
                aria-required="true"
                aria-invalid={erroresNuevo.definicion ? true : undefined}
                className={
                  "w-full px-3 py-2 border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary " +
                  (erroresNuevo.definicion ? "border-destructive" : "border-border")
                }
              />
              {erroresNuevo.definicion && (
                <p role="alert" className="mt-1 text-xs text-destructive">{erroresNuevo.definicion}</p>
              )}
            </div>
          </div>
          <button
            onClick={agregarEntrada}
            className="px-5 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Agregar
          </button>
        </section>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
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
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  No se encontraron términos en el glosario.
                </td>
              </tr>
            ) : (
              filtradas.map((entrada) => (
                <tr key={entrada.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 text-foreground font-medium">
                    {editandoId === entrada.id ? (
                      <>
                        <label htmlFor={"term-edit-" + entrada.id} className="sr-only">Editar término</label>
                        <input
                          id={"term-edit-" + entrada.id}
                          type="text"
                          value={termEdit}
                          onChange={(e) => setTermEdit(e.target.value)}
                          className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </>
                    ) : (
                      entrada.termino
                    )}
                  </td>
                  <td className="py-3 pr-4 text-foreground">
                    {editandoId === entrada.id ? (
                      <>
                        <label htmlFor={"def-edit-" + entrada.id} className="sr-only">Editar definición</label>
                        <input
                          id={"def-edit-" + entrada.id}
                          type="text"
                          value={defEdit}
                          onChange={(e) => setDefEdit(e.target.value)}
                          className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </>
                    ) : (
                      entrada.definicion
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {editandoId === entrada.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => guardarEdicion(entrada.id)}
                          aria-label={"Guardar cambios de " + entrada.termino}
                          className="text-xs text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          aria-label="Cancelar edición"
                          className="text-xs text-muted-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => iniciarEdicion(entrada)}
                        aria-label={"Editar término: " + entrada.termino}
                        className="p-1 rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <IcoEditar />
                      </button>
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => eliminar(entrada.id, entrada.termino)}
                      aria-label={"Eliminar término: " + entrada.termino}
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
          onClick={() => anunciar("Glosario guardado correctamente.")}
          className="px-8 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default Glosario;
