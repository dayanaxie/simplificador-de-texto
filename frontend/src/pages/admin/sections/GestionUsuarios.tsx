import { useState, useEffect, useRef } from "react";
import DialogoConfirmar from "../sections/DialogoConfirmar";

type Rol    = "Usuario" | "Administrador";
type Estado = "Activo" | "Inactivo";

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: Estado;
  fechaRegistro: string;
  simplificaciones: number;
}

const usuariosIniciales: Usuario[] = [
  { id: "1", nombre: "Ana Pérez",  correo: "ana@gmail.com",  rol: "Usuario",       estado: "Activo",   fechaRegistro: "01/01/2026", simplificaciones: 42 },
  { id: "2", nombre: "Juan Mora",  correo: "juan@gmail.com", rol: "Administrador", estado: "Activo",   fechaRegistro: "15/01/2026", simplificaciones: 8  },
  { id: "3", nombre: "Luis Rojas", correo: "luis@gmail.com", rol: "Usuario",       estado: "Inactivo", fechaRegistro: "20/02/2026", simplificaciones: 17 },
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
interface PanelProps { usuario: Usuario; onGuardar: (d: Partial<Usuario>) => void; onCancelar: () => void; }

const PanelEdicion = ({ usuario, onGuardar, onCancelar }: PanelProps) => {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [correo, setCorreo] = useState(usuario.correo);
  const [rol, setRol]       = useState<Rol>(usuario.rol);
  const [estado, setEstado] = useState<Estado>(usuario.estado);
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
    onGuardar({ nombre, correo, rol, estado });
  };

  return (
    <div role="region" aria-label={"Editar usuario: " + usuario.nombre}
      className="absolute left-0 right-0 z-20 bg-white border border-border rounded-lg shadow-xl p-5 mt-1">
      <h3 className="text-base font-bold text-foreground mb-4">Editar usuario</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="u-edit-nombre" className="block text-xs font-medium text-foreground mb-1">Nombre <span aria-hidden="true" className="text-destructive">*</span></label>
          <input id="u-edit-nombre" ref={ref} type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            aria-required="true" aria-invalid={errores.nombre ? true : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.nombre ? "border-destructive" : "border-border")} />
          {errores.nombre && <p role="alert" className="mt-1 text-xs text-destructive">{errores.nombre}</p>}
        </div>
        <div>
          <label htmlFor="u-edit-correo" className="block text-xs font-medium text-foreground mb-1">Correo <span aria-hidden="true" className="text-destructive">*</span></label>
          <input id="u-edit-correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
            aria-required="true" aria-invalid={errores.correo ? true : undefined}
            className={"w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " + (errores.correo ? "border-destructive" : "border-border")} />
          {errores.correo && <p role="alert" className="mt-1 text-xs text-destructive">{errores.correo}</p>}
        </div>
        <div>
          <label htmlFor="u-edit-rol" className="block text-xs font-medium text-foreground mb-1">Rol</label>
          <select id="u-edit-rol" value={rol} onChange={(e) => setRol(e.target.value as Rol)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="Usuario">Usuario</option>
            <option value="Administrador">Administrador</option>
          </select>
        </div>
        <div>
          <label htmlFor="u-edit-estado" className="block text-xs font-medium text-foreground mb-1">Estado</label>
          <select id="u-edit-estado" value={estado} onChange={(e) => setEstado(e.target.value as Estado)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
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

const GestionUsuarios = () => {
  const [usuarios, setUsuarios]         = useState<Usuario[]>(usuariosIniciales);
  const [busqueda, setBusqueda]         = useState("");
  const [filtroRol, setFiltroRol]       = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [editandoId, setEditandoId]     = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [mensaje, setMensaje]           = useState("");
  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  const filtrados = usuarios.filter((u) => {
    const coincideTexto = u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || u.correo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol   = filtroRol === "Todos" || u.rol === filtroRol;
    const coincideEst   = filtroEstado === "Todos" || u.estado === filtroEstado;
    return coincideTexto && coincideRol && coincideEst;
  });

  // Estadísticas rápidas
  const totalActivos       = usuarios.filter((u) => u.estado === "Activo").length;
  const totalAdmins        = usuarios.filter((u) => u.rol === "Administrador").length;
  const totalSimplificaciones = usuarios.reduce((acc, u) => acc + u.simplificaciones, 0);

  const abrirEdicion = (id: string, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEditandoId(id); setEliminandoId(null); };
  const cerrarEdicion = () => { setEditandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };
  const guardarEdicion = (id: string, datos: Partial<Usuario>) => {
    setUsuarios((prev) => prev.map((u) => u.id === id ? { ...u, ...datos } : u));
    cerrarEdicion(); anunciar("Usuario actualizado correctamente.");
  };

  const abrirEliminar = (id: string, btn: HTMLButtonElement) => { botonOrigenRef.current = btn; setEliminandoId(id); setEditandoId(null); };
  const confirmarEliminar = () => {
    const u = usuarios.find((u) => u.id === eliminandoId);
    setUsuarios((prev) => prev.filter((u) => u.id !== eliminandoId));
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
    anunciar("Cuenta de " + (u?.nombre ?? "") + " eliminada.");
  };
  const cancelarEliminar = () => { setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null; };

  const usuarioAEliminar = usuarios.find((u) => u.id === eliminandoId);

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId && usuarioAEliminar && (
        <DialogoConfirmar titulo="Eliminar cuenta"
          mensaje={"¿Estás segura de que querés eliminar la cuenta de " + usuarioAEliminar.nombre + " (" + usuarioAEliminar.correo + ")? Esta acción no se puede deshacer."}
          onConfirmar={confirmarEliminar} onCancelar={cancelarEliminar} />
      )}

      <h2 id="h-usuarios" className="text-2xl font-bold text-center text-foreground mb-6">Gestión de usuarios</h2>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-3 gap-3 mb-6" role="list" aria-label="Resumen de usuarios">
        <article className="border border-border rounded-lg p-4 text-center" role="listitem">
          <p className="text-2xl font-bold text-foreground" aria-label={"Total de usuarios: " + usuarios.length}>{usuarios.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total usuarios</p>
        </article>
        <article className="border border-border rounded-lg p-4 text-center" role="listitem">
          <p className="text-2xl font-bold text-green-700" aria-label={"Usuarios activos: " + totalActivos}>{totalActivos}</p>
          <p className="text-xs text-muted-foreground mt-1">Activos</p>
        </article>
        <article className="border border-border rounded-lg p-4 text-center" role="listitem">
          <p className="text-2xl font-bold text-foreground" aria-label={"Total simplificaciones: " + totalSimplificaciones}>{totalSimplificaciones}</p>
          <p className="text-xs text-muted-foreground mt-1">Simplificaciones totales</p>
        </article>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]" role="search">
          <label htmlFor="buscar-usuario" className="sr-only">Buscar usuario por nombre o correo</label>
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          <input id="buscar-usuario" type="search" value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Inserte el nombre o correo electrónico"
            className="w-full pl-9 pr-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1" />
        </div>
        <div>
          <label htmlFor="filtro-rol" className="sr-only">Filtrar por rol</label>
          <select id="filtro-rol" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}
            className="min-h-[44px] px-3 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="Todos">Todos los roles</option>
            <option value="Usuario">Usuario</option>
            <option value="Administrador">Administrador</option>
          </select>
        </div>
        <div>
          <label htmlFor="filtro-estado-u" className="sr-only">Filtrar por estado</label>
          <select id="filtro-estado-u" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="min-h-[44px] px-3 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="Todos">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
        <button onClick={() => anunciar("Mostrando " + filtrados.length + " usuario(s).")} className={btnAzul}>Buscar</button>
      </div>

      {filtrados.length !== usuarios.length && (
        <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
          Mostrando {filtrados.length} de {usuarios.length} usuario(s).
        </p>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <div className="relative">
          <table className="w-full text-sm text-left" aria-labelledby="h-usuarios">
            <caption className="sr-only">Lista de usuarios con opciones para editar y eliminar cada cuenta</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Nombre</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Correo</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Rol</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Estado</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Registro</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Simplif.</th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">Editar</th>
                <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No se encontraron usuarios.</td></tr>
              ) : (
                filtrados.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 text-foreground font-medium">{u.nombre}</td>
                    <td className="py-3 pr-3">
                      <a href={"mailto:" + u.correo} className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded">{u.correo}</a>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={"inline-block px-2 py-0.5 rounded-full text-xs font-medium " + (u.rol === "Administrador" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700")}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={"inline-block px-2 py-0.5 rounded-full text-xs font-medium " + (u.estado === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                        {u.estado}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">{u.fechaRegistro}</td>
                    <td className="py-3 pr-3 text-foreground text-center">{u.simplificaciones}</td>
                    <td className="py-3 pr-3">
                      <button onClick={(e) => abrirEdicion(u.id, e.currentTarget)}
                        aria-label={"Editar usuario: " + u.nombre} aria-expanded={editandoId === u.id}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]">
                        <IcoEditar />
                      </button>
                    </td>
                    <td className="py-3">
                      <button onClick={(e) => abrirEliminar(u.id, e.currentTarget)}
                        aria-label={"Eliminar cuenta de " + u.nombre}
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
            const usuario = usuarios.find((u) => u.id === editandoId);
            if (!usuario) return null;
            return <PanelEdicion usuario={usuario} onGuardar={(d) => guardarEdicion(editandoId, d)} onCancelar={cerrarEdicion} />;
          })()}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button onClick={() => anunciar("Cambios guardados correctamente.")} className={btnAzul + " px-10"}>Guardar</button>
      </div>
    </div>
  );
};

export default GestionUsuarios;
