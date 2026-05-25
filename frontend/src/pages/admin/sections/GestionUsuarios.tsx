import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import DialogoConfirmar from "./DialogoConfirmar";

type Rol = "Usuario" | "Administrador";
type Estado = "Activo" | "Inactivo";

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: Estado;
  fechaRegistro: string;
  simplificaciones: number;
}

const btnAzul =
  "inline-flex items-center justify-center min-h-[44px] px-6 " +
  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
  "text-sm font-medium rounded-md hover:opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
  "transition-opacity duration-150";

const IcoEditar = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IcoEstado = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

interface PanelProps {
  usuario: Usuario;
  onGuardar: (datos: Partial<Usuario>) => void | Promise<void>;
  onCancelar: () => void;
}

const PanelEdicion = ({ usuario, onGuardar, onCancelar }: PanelProps) => {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [correo, setCorreo] = useState(usuario.correo);
  const [rol, setRol] = useState<Rol>(usuario.rol);
  const [estado, setEstado] = useState<Estado>(usuario.estado);
  const [errores, setErrores] = useState<{ nombre?: string; correo?: string }>({});
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelar();
    };

    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancelar]);

  const guardar = () => {
    const nuevosErrores: { nombre?: string; correo?: string } = {};

    if (!nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    }

    if (!correo.trim()) {
      nuevosErrores.correo = "El correo es obligatorio.";
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      ref.current?.focus();
      return;
    }

    onGuardar({
      nombre,
      correo,
      rol,
      estado,
    });
  };

  return (
    <div
      role="region"
      aria-label={"Editar usuario: " + usuario.nombre}
      className="absolute left-0 right-0 z-20 bg-white border border-border rounded-lg shadow-xl p-5 mt-1"
    >
      <h3 className="text-base font-bold text-foreground mb-4">
        Editar usuario
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label
            htmlFor="u-edit-nombre"
            className="block text-xs font-medium text-foreground mb-1"
          >
            Nombre <span aria-hidden="true" className="text-destructive">*</span>
          </label>

          <input
            id="u-edit-nombre"
            ref={ref}
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-required="true"
            aria-invalid={errores.nombre ? true : undefined}
            className={
              "w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
              (errores.nombre ? "border-destructive" : "border-border")
            }
          />

          {errores.nombre && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errores.nombre}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="u-edit-correo"
            className="block text-xs font-medium text-foreground mb-1"
          >
            Correo <span aria-hidden="true" className="text-destructive">*</span>
          </label>

          <input
            id="u-edit-correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            aria-required="true"
            aria-invalid={errores.correo ? true : undefined}
            className={
              "w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
              (errores.correo ? "border-destructive" : "border-border")
            }
          />

          {errores.correo && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errores.correo}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="u-edit-rol"
            className="block text-xs font-medium text-foreground mb-1"
          >
            Rol
          </label>

          <select
            id="u-edit-rol"
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          >
            <option value="Usuario">Usuario</option>
            <option value="Administrador">Administrador</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="u-edit-estado"
            className="block text-xs font-medium text-foreground mb-1"
          >
            Estado
          </label>

          <select
            id="u-edit-estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value as Estado)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={guardar} className={btnAzul}>
          Guardar cambios
        </button>

        <button
          onClick={onCancelar}
          className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);

  const anunciar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 5000);
  };

  const formatearFecha = (fecha?: string | null) => {
    if (!fecha) return "-";

    return new Date(fecha).toLocaleString("es-CR", {
      timeZone: "America/Costa_Rica",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cargarUsuarios = async () => {
    setCargando(true);

    const { data: usuariosData, error: usuariosError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        is_active,
        created_at,
        user_roles (
          role_id,
          roles (
            id,
            name
          )
        )
      `)
      .order("id", { ascending: true });

    if (usuariosError) {
      console.error("Error cargando usuarios:", usuariosError);
      alert("Error cargando usuarios: " + usuariosError.message);
      setCargando(false);
      return;
    }

    const { data: simplificacionesData, error: simplificacionesError } =
      await supabase.from("simplifications").select("user_id");

    if (simplificacionesError) {
      console.error("Error cargando simplificaciones:", simplificacionesError);
      alert("Error cargando métricas: " + simplificacionesError.message);
      setCargando(false);
      return;
    }

    const conteoSimplificaciones = new Map<number, number>();

    (simplificacionesData || []).forEach((item: any) => {
      const userId = item.user_id;

      if (!userId) return;

      conteoSimplificaciones.set(
        userId,
        (conteoSimplificaciones.get(userId) || 0) + 1
      );
    });

    const usuariosConvertidos: Usuario[] = (usuariosData || []).map((u: any) => {
      const relacionRol = Array.isArray(u.user_roles) ? u.user_roles[0] : null;
      const nombreRol = relacionRol?.roles?.name;

      return {
        id: u.id,
        nombre: u.name || "",
        correo: u.email || "",
        rol: nombreRol === "Administrador" ? "Administrador" : "Usuario",
        estado: u.is_active ? "Activo" : "Inactivo",
        fechaRegistro: formatearFecha(u.created_at),
        simplificaciones: conteoSimplificaciones.get(u.id) || 0,
      };
    });

    setUsuarios(usuariosConvertidos);
    setCargando(false);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const metricas = useMemo(() => {
    const totalUsuarios = usuarios.length;
    const totalActivos = usuarios.filter((u) => u.estado === "Activo").length;
    const totalInactivos = usuarios.filter((u) => u.estado === "Inactivo").length;
    const totalAdmins = usuarios.filter((u) => u.rol === "Administrador").length;
    const totalSimplificaciones = usuarios.reduce(
      (total, u) => total + u.simplificaciones,
      0
    );

    const promedioSimplificaciones =
      totalUsuarios > 0
        ? Math.round(totalSimplificaciones / totalUsuarios)
        : 0;

    return {
      totalUsuarios,
      totalActivos,
      totalInactivos,
      totalAdmins,
      totalSimplificaciones,
      promedioSimplificaciones,
    };
  }, [usuarios]);

  const filtrados = usuarios.filter((u) => {
    const coincideTexto =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase());

    const coincideRol = filtroRol === "Todos" || u.rol === filtroRol;
    const coincideEstado = filtroEstado === "Todos" || u.estado === filtroEstado;

    return coincideTexto && coincideRol && coincideEstado;
  });

  const obtenerRolId = async (rol: Rol) => {
    const { data, error } = await supabase
      .from("roles")
      .select("id")
      .eq("name", rol)
      .maybeSingle();

    if (error || !data) {
      console.error("Error obteniendo rol:", error);
      alert("No se encontró el rol: " + rol);
      return null;
    }

    return data.id as number;
  };

  const actualizarRolUsuario = async (userId: number, rol: Rol) => {
    const rolId = await obtenerRolId(rol);

    if (!rolId) return false;

    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error eliminando rol anterior:", deleteError);
      alert("Error actualizando rol: " + deleteError.message);
      return false;
    }

    const { error: insertError } = await supabase.from("user_roles").insert([
      {
        user_id: userId,
        role_id: rolId,
      },
    ]);

    if (insertError) {
      console.error("Error asignando rol:", insertError);
      alert("Error asignando rol: " + insertError.message);
      return false;
    }

    return true;
  };

  const abrirEdicion = (id: number, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn;
    setEditandoId(id);
    setCambiandoEstadoId(null);
  };

  const cerrarEdicion = () => {
    setEditandoId(null);
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;
  };

  const guardarEdicion = async (id: number, datos: Partial<Usuario>) => {
    const usuarioActual = usuarios.find((u) => u.id === id);

    if (!usuarioActual) return;

    const nuevoNombre = datos.nombre ?? usuarioActual.nombre;
    const nuevoCorreo = datos.correo ?? usuarioActual.correo;
    const nuevoEstado = datos.estado ?? usuarioActual.estado;
    const nuevoRol = datos.rol ?? usuarioActual.rol;

    const { error: userError } = await supabase
      .from("users")
      .update({
        name: nuevoNombre,
        email: nuevoCorreo,
        is_active: nuevoEstado === "Activo",
      })
      .eq("id", id);

    if (userError) {
      console.error("Error actualizando usuario:", userError);
      alert("Error actualizando usuario: " + userError.message);
      return;
    }

    if (nuevoRol !== usuarioActual.rol) {
      const rolActualizado = await actualizarRolUsuario(id, nuevoRol);

      if (!rolActualizado) return;
    }

    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              nombre: nuevoNombre,
              correo: nuevoCorreo,
              estado: nuevoEstado,
              rol: nuevoRol,
            }
          : u
      )
    );

    cerrarEdicion();
    anunciar("Usuario actualizado correctamente.");
  };

  const abrirCambioEstado = (id: number, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn;
    setCambiandoEstadoId(id);
    setEditandoId(null);
  };

  const confirmarCambioEstado = async () => {
    if (!cambiandoEstadoId) return;

    const usuario = usuarios.find((u) => u.id === cambiandoEstadoId);

    if (!usuario) return;

    const nuevoEstado: Estado =
      usuario.estado === "Activo" ? "Inactivo" : "Activo";

    const { error } = await supabase
      .from("users")
      .update({
        is_active: nuevoEstado === "Activo",
      })
      .eq("id", usuario.id);

    if (error) {
      console.error("Error cambiando estado:", error);
      alert("Error cambiando estado: " + error.message);
      return;
    }

    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === usuario.id
          ? {
              ...u,
              estado: nuevoEstado,
            }
          : u
      )
    );

    setCambiandoEstadoId(null);
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;

    anunciar(
      nuevoEstado === "Activo"
        ? "Usuario activado correctamente."
        : "Usuario inactivado correctamente."
    );
  };

  const cancelarCambioEstado = () => {
    setCambiandoEstadoId(null);
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;
  };

  const usuarioACambiarEstado = usuarios.find(
    (u) => u.id === cambiandoEstadoId
  );

  return (
    <div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {mensaje}
      </div>

      {cambiandoEstadoId && usuarioACambiarEstado && (
        <DialogoConfirmar
          titulo={
            usuarioACambiarEstado.estado === "Activo"
              ? "Inactivar usuario"
              : "Activar usuario"
          }
          mensaje={
            usuarioACambiarEstado.estado === "Activo"
              ? "¿Deseás inactivar la cuenta de " +
                usuarioACambiarEstado.nombre +
                " (" +
                usuarioACambiarEstado.correo +
                ")?"
              : "¿Deseás activar la cuenta de " +
                usuarioACambiarEstado.nombre +
                " (" +
                usuarioACambiarEstado.correo +
                ")?"
          }
          onConfirmar={confirmarCambioEstado}
          onCancelar={cancelarCambioEstado}
        />
      )}

      <h2
        id="h-usuarios"
        className="text-2xl font-bold text-center text-foreground mb-6"
      >
        Gestión de usuarios
      </h2>

      <div
        className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6"
        role="list"
        aria-label="Resumen de usuarios"
      >
        <article className="border border-border rounded-lg p-4 text-center" role="listitem">
          <p className="text-2xl font-bold text-foreground">
            {metricas.totalUsuarios}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total usuarios</p>
        </article>

        <article className="border border-border rounded-lg p-4 text-center" role="listitem">
          <p className="text-2xl font-bold text-green-700">
            {metricas.totalActivos}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Activos</p>
        </article>

        <article className="border border-border rounded-lg p-4 text-center" role="listitem">
          <p className="text-2xl font-bold text-red-700">
            {metricas.totalInactivos}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Inactivos</p>
        </article>

        <article className="border border-border rounded-lg p-4 text-center" role="listitem">
          <p className="text-2xl font-bold text-foreground">
            {metricas.totalAdmins}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Admins</p>
        </article>

        <article className="border border-border rounded-lg p-4 text-center" role="listitem">
          <p className="text-2xl font-bold text-foreground">
            {metricas.totalSimplificaciones}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Simplif. totales</p>
        </article>

        <article className="border border-border rounded-lg p-4 text-center" role="listitem">
          <p className="text-2xl font-bold text-foreground">
            {metricas.promedioSimplificaciones}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Promedio</p>
        </article>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]" role="search">
          <label htmlFor="buscar-usuario" className="sr-only">
            Buscar usuario por nombre o correo
          </label>

          <span
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            🔍
          </span>

          <input
            id="buscar-usuario"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Inserte el nombre o correo electrónico"
            className="w-full pl-9 pr-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          />
        </div>

        <div>
          <label htmlFor="filtro-rol" className="sr-only">
            Filtrar por rol
          </label>

          <select
            id="filtro-rol"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="min-h-[44px] px-3 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          >
            <option value="Todos">Todos los roles</option>
            <option value="Usuario">Usuario</option>
            <option value="Administrador">Administrador</option>
          </select>
        </div>

        <div>
          <label htmlFor="filtro-estado-u" className="sr-only">
            Filtrar por estado
          </label>

          <select
            id="filtro-estado-u"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="min-h-[44px] px-3 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        <button
          onClick={() =>
            anunciar("Mostrando " + filtrados.length + " usuario(s).")
          }
          className={btnAzul}
        >
          Buscar
        </button>
      </div>

      {filtrados.length !== usuarios.length && (
        <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
          Mostrando {filtrados.length} de {usuarios.length} usuario(s).
        </p>
      )}

      <div className="overflow-x-auto">
        <div className="relative">
          <table className="w-full text-sm text-left" aria-labelledby="h-usuarios">
            <caption className="sr-only">
              Lista de usuarios con opciones para editar y activar o inactivar
              cada cuenta
            </caption>

            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">
                  Nombre
                </th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">
                  Correo
                </th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">
                  Rol
                </th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">
                  Estado
                </th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">
                  Registro
                </th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">
                  Simplif.
                </th>
                <th scope="col" className="py-3 pr-3 font-semibold text-foreground">
                  Editar
                </th>
                <th scope="col" className="py-3 font-semibold text-foreground">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filtrados.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 text-foreground font-medium">
                      {u.nombre}
                    </td>

                    <td className="py-3 pr-3">
                      <a
                        href={"mailto:" + u.correo}
                        className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded"
                      >
                        {u.correo}
                      </a>
                    </td>

                    <td className="py-3 pr-3">
                      <span
                        className={
                          "inline-block px-2 py-0.5 rounded-full text-xs font-medium " +
                          (u.rol === "Administrador"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700")
                        }
                      >
                        {u.rol}
                      </span>
                    </td>

                    <td className="py-3 pr-3">
                      <span
                        className={
                          "inline-block px-2 py-0.5 rounded-full text-xs font-medium " +
                          (u.estado === "Activo"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800")
                        }
                      >
                        {u.estado}
                      </span>
                    </td>

                    <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">
                      {u.fechaRegistro}
                    </td>

                    <td className="py-3 pr-3 text-foreground text-center">
                      {u.simplificaciones}
                    </td>

                    <td className="py-3 pr-3">
                      <button
                        onClick={(e) => abrirEdicion(u.id, e.currentTarget)}
                        aria-label={"Editar usuario: " + u.nombre}
                        aria-expanded={editandoId === u.id}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
                      >
                        <IcoEditar />
                      </button>
                    </td>

                    <td className="py-3">
                      <button
                        onClick={(e) => abrirCambioEstado(u.id, e.currentTarget)}
                        aria-label={
                          u.estado === "Activo"
                            ? "Inactivar usuario " + u.nombre
                            : "Activar usuario " + u.nombre
                        }
                        className={
                          "p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 " +
                          (u.estado === "Activo"
                            ? "text-red-700 hover:text-red-900 focus-visible:ring-red-700"
                            : "text-green-700 hover:text-green-900 focus-visible:ring-green-700")
                        }
                      >
                        <IcoEstado />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {editandoId &&
            (() => {
              const usuario = usuarios.find((u) => u.id === editandoId);

              if (!usuario) return null;

              return (
                <PanelEdicion
                  usuario={usuario}
                  onGuardar={(datos) => guardarEdicion(editandoId, datos)}
                  onCancelar={cerrarEdicion}
                />
              );
            })()}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button onClick={cargarUsuarios} className={btnAzul + " px-10"}>
          Actualizar métricas
        </button>
      </div>
    </div>
  );
};

export default GestionUsuarios;