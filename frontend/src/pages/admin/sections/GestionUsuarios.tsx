import { useState } from "react";

type Rol = "Usuario" | "Administrador";
type Estado = "Activo" | "Inactivo";

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: Estado;
}

const usuariosIniciales: Usuario[] = [
  { id: "1", nombre: "Ana Pérez",  correo: "ana@gmail.com",  rol: "Usuario",       estado: "Activo"   },
  { id: "2", nombre: "Juan Mora",  correo: "juan@gmail.com", rol: "Administrador", estado: "Activo"   },
  { id: "3", nombre: "Luis Rojas", correo: "luis@gmail.com", rol: "Usuario",       estado: "Inactivo" },
];

const GestionUsuarios = () => {
  const [usuarios, setUsuarios]     = useState<Usuario[]>(usuariosIniciales);
  const [busqueda, setBusqueda]     = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [cambios, setCambios]       = useState<Record<string, Partial<Usuario>>>({});
  const [mensaje, setMensaje]       = useState("");

  const anunciar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 4000);
  };

  const filtrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const iniciarEdicion = (id: string) => {
    const u = usuarios.find((u) => u.id === id)!;
    setEditandoId(id);
    setCambios((prev) => ({ ...prev, [id]: { rol: u.rol } }));
  };

  const cancelar = () => {
    setEditandoId(null);
    setCambios({});
  };

  const cambiarRol = (id: string, rol: Rol) => {
    setCambios((prev) => ({ ...prev, [id]: { ...prev[id], rol } }));
  };

  const toggleEstado = (id: string, nombre: string) => {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, estado: u.estado === "Activo" ? "Inactivo" : "Activo" } : u
      )
    );
    anunciar("Estado de " + nombre + " actualizado.");
  };

  const guardar = () => {
    setUsuarios((prev) =>
      prev.map((u) => (cambios[u.id] ? { ...u, ...cambios[u.id] } : u))
    );
    setEditandoId(null);
    setCambios({});
    anunciar("Cambios guardados correctamente.");
  };

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {mensaje}
      </div>

      <h2 id="h-usuarios" className="text-2xl font-bold text-center text-foreground mb-6">
        Gestión de usuarios
      </h2>

      {/* Buscador */}
      <div className="flex gap-3 mb-6" role="search">
        <label htmlFor="buscar-usuario" className="sr-only">
          Buscar usuario por nombre o correo electrónico
        </label>
        <div className="relative flex-1">
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            🔍
          </span>
          <input
            id="buscar-usuario"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Inserte el nombre o correo electrónico"
            className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          />
        </div>
        <button
          onClick={() => anunciar("Mostrando " + filtrados.length + " resultado(s).")}
          className="px-5 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Buscar
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left" aria-labelledby="h-usuarios">
          <caption className="sr-only">
            Lista de usuarios con opciones para editar rol y cambiar estado de cuenta
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Nombre</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Correo</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Rol</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Estado</th>
              <th scope="col" className="py-3 font-semibold text-foreground">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No se encontraron usuarios.
                </td>
              </tr>
            ) : (
              filtrados.map((usuario) => (
                <tr key={usuario.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 text-foreground">{usuario.nombre}</td>
                  <td className="py-3 pr-4">
                    <a
                      href={"mailto:" + usuario.correo}
                      className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                      {usuario.correo}
                    </a>
                  </td>
                  <td className="py-3 pr-4">
                    {editandoId === usuario.id ? (
                      <>
                        <label htmlFor={"rol-" + usuario.id} className="sr-only">
                          Rol de {usuario.nombre}
                        </label>
                        <select
                          id={"rol-" + usuario.id}
                          value={cambios[usuario.id]?.rol ?? usuario.rol}
                          onChange={(e) => cambiarRol(usuario.id, e.target.value as Rol)}
                          className="border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="Usuario">Usuario</option>
                          <option value="Administrador">Administrador</option>
                        </select>
                      </>
                    ) : (
                      <span>{usuario.rol}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        "inline-block px-2 py-0.5 rounded-full text-xs font-medium " +
                        (usuario.estado === "Activo"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800")
                      }
                    >
                      {usuario.estado}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-3">
                      {editandoId === usuario.id ? (
                        <button
                          onClick={cancelar}
                          className="text-sm text-muted-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                          aria-label={"Cancelar edición de " + usuario.nombre}
                        >
                          Cancelar
                        </button>
                      ) : (
                        <button
                          onClick={() => iniciarEdicion(usuario.id)}
                          className="text-sm text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                          aria-label={"Editar rol de " + usuario.nombre}
                        >
                          Editar
                        </button>
                      )}
                      <button
                        onClick={() => toggleEstado(usuario.id, usuario.nombre)}
                        className="text-sm text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        aria-label={(usuario.estado === "Activo" ? "Desactivar" : "Activar") + " cuenta de " + usuario.nombre}
                      >
                        {usuario.estado === "Activo" ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={guardar}
          disabled={Object.keys(cambios).length === 0}
          className="px-8 py-2 bg-navy text-navy-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default GestionUsuarios;
