import { useState } from "react";

interface RegistroAuditoria {
  id: string;
  fecha: string;
  usuario: string;
  detalle: string;
  accion: string;
}

const registrosIniciales: RegistroAuditoria[] = [
  { id: "1", fecha: "18/04/2026", usuario: "ana@gmail.com",  detalle: "----", accion: "Incompleto"  },
  { id: "2", fecha: "18/03/2026", usuario: "juan@gmail.com", detalle: "----", accion: "Completado"  },
  { id: "3", fecha: "17/02/2026", usuario: "luis@gmail.com", detalle: "----", accion: "Completado"  },
];

const IcoEliminar = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const Auditoria = () => {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>(registrosIniciales);
  const [busqueda, setBusqueda]   = useState("");
  const [mensaje, setMensaje]     = useState("");

  const anunciar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 4000);
  };

  const filtrados = registros.filter((r) =>
    r.fecha.includes(busqueda) ||
    r.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.accion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const eliminar = (id: string, fecha: string, usuario: string) => {
    if (!window.confirm("¿Eliminar el registro del " + fecha + " de " + usuario + "?")) return;
    setRegistros((prev) => prev.filter((r) => r.id !== id));
    anunciar("Registro eliminado.");
  };

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {mensaje}
      </div>

      <h2 id="h-auditoria" className="text-2xl font-bold text-center text-foreground mb-6">
        Log de Auditoría
      </h2>

      {/* Buscador por fecha */}
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
            placeholder="Inserte la fecha"
            className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          />
        </div>
        <button
          onClick={() => anunciar("Mostrando " + filtrados.length + " registro(s).")}
          className="px-5 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Buscar
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left" aria-labelledby="h-auditoria">
          <caption className="sr-only">
            Log de auditoría del sistema con fecha, usuario, detalle, acción y opción de eliminar
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Fecha</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Usuario</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Detalle</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Acción</th>
              <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
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
                      className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
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
                  <td className="py-3">
                    <button
                      onClick={() => eliminar(r.id, r.fecha, r.usuario)}
                      aria-label={"Eliminar registro del " + r.fecha + " de " + r.usuario}
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
          onClick={() => anunciar("Cambios guardados correctamente.")}
          className="px-8 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default Auditoria;
