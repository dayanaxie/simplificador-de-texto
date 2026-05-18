import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import DialogoConfirmar from "./DialogoConfirmar";

type EstadoSolicitud = "Pendiente" | "Aceptada" | "Denegada";

interface Solicitud {
  id: number;
  fecha: string;
  nombre: string;
  correo: string;
  motivo: string;
  estado: EstadoSolicitud;
  password_hash?: string | null;
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

const IcoEliminar = () => (
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const badgeEstado = (estado: EstadoSolicitud) => {
  const estilos: Record<EstadoSolicitud, string> = {
    Pendiente: "bg-yellow-100 text-yellow-800",
    Aceptada: "bg-green-100 text-green-800",
    Denegada: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={
        "inline-block px-2 py-0.5 rounded-full text-xs font-medium " +
        estilos[estado]
      }
    >
      {estado}
    </span>
  );
};

interface PanelProps {
  solicitud: Solicitud;
  onGuardar: (datos: Partial<Solicitud>) => void | Promise<void>;
  onCancelar: () => void;
}

const PanelEdicion = ({ solicitud, onGuardar, onCancelar }: PanelProps) => {
  const [nombre, setNombre] = useState(solicitud.nombre);
  const [correo, setCorreo] = useState(solicitud.correo);
  const [motivo, setMotivo] = useState(solicitud.motivo);
  const [errores, setErrores] = useState<{
    nombre?: string;
    correo?: string;
  }>({});

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
      motivo,
    });
  };

  return (
    <div
      role="region"
      aria-label={"Editar solicitud de " + solicitud.nombre}
      className="absolute left-0 right-0 z-20 bg-white border border-border rounded-lg shadow-xl p-5 mt-1"
    >
      <h3 className="text-base font-bold text-foreground mb-4">
        Editar solicitud
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label
            htmlFor="sol-edit-nombre"
            className="block text-xs font-medium text-foreground mb-1"
          >
            Nombre{" "}
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </label>

          <input
            id="sol-edit-nombre"
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
            htmlFor="sol-edit-correo"
            className="block text-xs font-medium text-foreground mb-1"
          >
            Correo{" "}
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </label>

          <input
            id="sol-edit-correo"
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

        <div className="sm:col-span-2">
          <label
            htmlFor="sol-edit-motivo"
            className="block text-xs font-medium text-foreground mb-1"
          >
            Motivo
          </label>

          <input
            id="sol-edit-motivo"
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full px-3 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          />
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

const Solicitudes = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<
    "Todos" | EstadoSolicitud
  >("Pendiente");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevaPassword, setNuevaPass] = useState("");
  const [nuevoMotivo, setNuevoMotivo] = useState("");
  const [erroresNuevo, setErroresNuevo] = useState<Record<string, string>>({});

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);
  const primerCampoRef = useRef<HTMLInputElement>(null);

  const anunciar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 5000);
  };

  const estadoDesdeDB = (estado: string | null): EstadoSolicitud => {
    if (estado === "approved") return "Aceptada";
    if (estado === "rejected") return "Denegada";
    return "Pendiente";
  };

  const estadoParaDB = (estado: EstadoSolicitud) => {
    if (estado === "Aceptada") return "approved";
    if (estado === "Denegada") return "rejected";
    return "pending";
  };

  const formatearFecha = (fecha?: string | null) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-CR");
  };

  const cargarSolicitudes = async () => {
    setCargando(true);

    const { data, error } = await supabase
      .from("access_requests")
      .select("id, name, email, reason, status, created_at, password_hash")
      .order("created_at", { ascending: false });

    setCargando(false);

    if (error) {
      console.error("Error cargando solicitudes:", error);
      alert("Error cargando solicitudes: " + error.message);
      return;
    }

    const solicitudesConvertidas: Solicitud[] = (data || []).map(
      (item: any) => ({
        id: item.id,
        fecha: formatearFecha(item.created_at),
        nombre: item.name || "",
        correo: item.email || "",
        motivo: item.reason || "",
        estado: estadoDesdeDB(item.status),
        password_hash: item.password_hash,
      })
    );

    setSolicitudes(solicitudesConvertidas);
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  useEffect(() => {
    if (mostrarForm) {
      setTimeout(() => primerCampoRef.current?.focus(), 50);
    }
  }, [mostrarForm]);

  const filtros: Array<"Todos" | EstadoSolicitud> = [
    "Todos",
    "Pendiente",
    "Aceptada",
    "Denegada",
  ];

  const filtradas = solicitudes.filter((s) => {
    return filtroEstado === "Todos" || s.estado === filtroEstado;
  });

  const aceptarSolicitud = async (solicitud: Solicitud) => {
    if (!solicitud.password_hash) {
      alert("La solicitud no tiene contraseña guardada.");
      return;
    }

    const { data: nuevoUsuario, error: userError } = await supabase
      .from("users")
      .insert([
        {
          name: solicitud.nombre,
          email: solicitud.correo,
          password_hash: solicitud.password_hash,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (userError) {
      console.error("Error creando usuario:", userError);
      alert("Error creando usuario: " + userError.message);
      return;
    }

    const { error: rolError } = await supabase.from("user_roles").insert([
      {
        user_id: nuevoUsuario.id,
        role_id: 1,
      },
    ]);

    if (rolError) {
      console.error("Error asignando rol:", rolError);
      alert("Usuario creado, pero no se pudo asignar el rol.");
      return;
    }

    const { error: requestError } = await supabase
      .from("access_requests")
      .update({ status: estadoParaDB("Aceptada") })
      .eq("id", solicitud.id);

    if (requestError) {
      console.error("Error actualizando solicitud:", requestError);
      alert("Usuario creado, pero no se pudo actualizar la solicitud.");
      return;
    }

    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === solicitud.id ? { ...s, estado: "Aceptada" } : s
      )
    );

    anunciar("Solicitud aceptada y usuario creado correctamente.");
  };

  const denegarSolicitud = async (id: number) => {
    const { error } = await supabase
      .from("access_requests")
      .update({ status: estadoParaDB("Denegada") })
      .eq("id", id);

    if (error) {
      console.error("Error denegando solicitud:", error);
      alert("Error denegando solicitud: " + error.message);
      return;
    }

    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: "Denegada" } : s))
    );

    anunciar("Solicitud denegada correctamente.");
  };

  const crearSolicitudManual = async () => {
    const nuevosErrores: Record<string, string> = {};

    if (!nuevoNombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    }

    if (!nuevoCorreo.trim()) {
      nuevosErrores.correo = "El correo es obligatorio.";
    }

    if (!nuevaPassword.trim() || nuevaPassword.length < 6) {
      nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    setErroresNuevo(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      primerCampoRef.current?.focus();
      return;
    }

    const { data, error } = await supabase
      .from("access_requests")
      .insert([
        {
          name: nuevoNombre,
          email: nuevoCorreo,
          password_hash: nuevaPassword,
          reason: nuevoMotivo || "Solicitud creada manualmente por administrador.",
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creando solicitud:", error);
      alert("Error creando solicitud: " + error.message);
      return;
    }

    const nuevaSolicitud: Solicitud = {
      id: data.id,
      fecha: formatearFecha(data.created_at),
      nombre: data.name,
      correo: data.email,
      motivo: data.reason,
      estado: estadoDesdeDB(data.status),
      password_hash: data.password_hash,
    };

    setSolicitudes((prev) => [nuevaSolicitud, ...prev]);

    setNuevoNombre("");
    setNuevoCorreo("");
    setNuevaPass("");
    setNuevoMotivo("");
    setErroresNuevo({});
    setMostrarForm(false);

    anunciar("Solicitud creada correctamente.");
  };

  const abrirEdicion = (id: number, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn;
    setEditandoId(id);
    setEliminandoId(null);
  };

  const cerrarEdicion = () => {
    setEditandoId(null);
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;
  };

  const guardarEdicion = async (id: number, datos: Partial<Solicitud>) => {
    const { error } = await supabase
      .from("access_requests")
      .update({
        name: datos.nombre,
        email: datos.correo,
        reason: datos.motivo,
      })
      .eq("id", id);

    if (error) {
      console.error("Error actualizando solicitud:", error);
      alert("Error actualizando solicitud: " + error.message);
      return;
    }

    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...datos } : s))
    );

    cerrarEdicion();
    anunciar("Solicitud actualizada correctamente.");
  };

  const abrirEliminar = (id: number, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn;
    setEliminandoId(id);
    setEditandoId(null);
  };

  const confirmarEliminar = async () => {
    if (!eliminandoId) return;

    const solicitud = solicitudes.find((s) => s.id === eliminandoId);

    const { error } = await supabase
      .from("access_requests")
      .delete()
      .eq("id", eliminandoId);

    if (error) {
      console.error("Error eliminando solicitud:", error);
      alert("Error eliminando solicitud: " + error.message);
      return;
    }

    setSolicitudes((prev) => prev.filter((s) => s.id !== eliminandoId));
    setEliminandoId(null);
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;

    anunciar("Solicitud de " + (solicitud?.nombre ?? "") + " eliminada.");
  };

  const cancelarEliminar = () => {
    setEliminandoId(null);
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;
  };

  const solicitudAEliminar = solicitudes.find((s) => s.id === eliminandoId);

  const inputCls = (campo: string) =>
    "w-full px-3 min-h-[44px] border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
    (erroresNuevo[campo] ? "border-destructive" : "border-border");

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

      {eliminandoId && solicitudAEliminar && (
        <DialogoConfirmar
          titulo="Eliminar solicitud"
          mensaje={
            "¿Estás segura de que querés eliminar la solicitud de " +
            solicitudAEliminar.nombre +
            "? Esta acción no se puede deshacer."
          }
          onConfirmar={confirmarEliminar}
          onCancelar={cancelarEliminar}
        />
      )}

      <h2
        id="h-solicitudes"
        className="text-2xl font-bold text-center text-foreground mb-6"
      >
        Solicitudes de Acceso
      </h2>

      <section aria-labelledby="h-nueva-cuenta" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3
            id="h-nueva-cuenta"
            className="text-sm font-semibold text-foreground"
          >
            {mostrarForm ? "Crear solicitud manual" : ""}
          </h3>

          <button
            onClick={() => setMostrarForm((v) => !v)}
            aria-expanded={mostrarForm}
            aria-controls="form-nueva-cuenta"
            className={btnAzul}
          >
            {mostrarForm ? "Cancelar" : "+ Crear solicitud"}
          </button>
        </div>

        {mostrarForm && (
          <div
            id="form-nueva-cuenta"
            className="border border-border rounded-lg p-5 bg-page-bg"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="nc-nombre"
                  className="block text-xs font-medium text-foreground mb-1"
                >
                  Nombre completo{" "}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </label>

                <input
                  id="nc-nombre"
                  ref={primerCampoRef}
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Nombre completo"
                  aria-required="true"
                  className={inputCls("nombre")}
                />

                {erroresNuevo.nombre && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {erroresNuevo.nombre}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="nc-correo"
                  className="block text-xs font-medium text-foreground mb-1"
                >
                  Correo electrónico{" "}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </label>

                <input
                  id="nc-correo"
                  type="email"
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  aria-required="true"
                  className={inputCls("correo")}
                />

                {erroresNuevo.correo && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {erroresNuevo.correo}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="nc-password"
                  className="block text-xs font-medium text-foreground mb-1"
                >
                  Contraseña inicial{" "}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </label>

                <input
                  id="nc-password"
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  aria-required="true"
                  aria-describedby="nc-password-hint"
                  className={inputCls("password")}
                />

                <p
                  id="nc-password-hint"
                  className="mt-1 text-xs text-muted-foreground"
                >
                  La cuenta se creará cuando la solicitud sea aceptada.
                </p>

                {erroresNuevo.password && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {erroresNuevo.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="nc-motivo"
                  className="block text-xs font-medium text-foreground mb-1"
                >
                  Motivo / Nota
                </label>

                <input
                  id="nc-motivo"
                  type="text"
                  value={nuevoMotivo}
                  onChange={(e) => setNuevoMotivo(e.target.value)}
                  placeholder="Motivo de creación"
                  className={inputCls("motivo")}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={crearSolicitudManual} className={btnAzul}>
                Crear solicitud
              </button>

              <button
                onClick={() => {
                  setMostrarForm(false);
                  setNuevoNombre("");
                  setNuevoCorreo("");
                  setNuevaPass("");
                  setNuevoMotivo("");
                  setErroresNuevo({});
                }}
                className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="flex gap-3 mb-6">
        <div className="flex items-center gap-2 border border-border rounded-md px-3 min-h-[44px] bg-background flex-1">
          <span aria-hidden="true" className="text-muted-foreground text-sm">
            ▼
          </span>

          <label htmlFor="filtro-sol" className="sr-only">
            Filtrar por estado de solicitud
          </label>

          <select
            id="filtro-sol"
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value as "Todos" | EstadoSolicitud)
            }
            className="w-full text-sm bg-transparent text-foreground focus:outline-none"
          >
            {filtros.map((f) => (
              <option key={f} value={f}>
                {f === "Todos" ? "Todos los estados" : f}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() =>
            anunciar("Mostrando " + filtradas.length + " solicitud(es).")
          }
          className={btnAzul}
        >
          Filtrar
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="relative">
          <table
            className="w-full text-sm text-left"
            aria-labelledby="h-solicitudes"
          >
            <caption className="sr-only">
              Lista de solicitudes de acceso con opciones para aceptar, denegar,
              editar y eliminar
            </caption>

            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="py-3 pr-3 font-semibold text-foreground"
                >
                  Fecha
                </th>
                <th
                  scope="col"
                  className="py-3 pr-3 font-semibold text-foreground"
                >
                  Nombre
                </th>
                <th
                  scope="col"
                  className="py-3 pr-3 font-semibold text-foreground"
                >
                  Correo
                </th>
                <th
                  scope="col"
                  className="py-3 pr-3 font-semibold text-foreground"
                >
                  Motivo
                </th>
                <th
                  scope="col"
                  className="py-3 pr-3 font-semibold text-foreground"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="py-3 pr-3 font-semibold text-foreground"
                >
                  Editar
                </th>
                <th
                  scope="col"
                  className="py-3 font-semibold text-foreground"
                >
                  Eliminar
                </th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Cargando solicitudes...
                  </td>
                </tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No hay solicitudes con el estado seleccionado.
                  </td>
                </tr>
              ) : (
                filtradas.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 pr-3 text-foreground whitespace-nowrap">
                      {s.fecha}
                    </td>

                    <td className="py-3 pr-3 text-foreground font-medium">
                      {s.nombre}
                    </td>

                    <td className="py-3 pr-3">
                      <a
                        href={"mailto:" + s.correo}
                        className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded"
                      >
                        {s.correo}
                      </a>
                    </td>

                    <td
                      className="py-3 pr-3 text-muted-foreground max-w-[180px] truncate"
                      title={s.motivo}
                    >
                      {s.motivo}
                    </td>

                    <td className="py-3 pr-3">
                      <div className="flex flex-col gap-1">
                        {badgeEstado(s.estado)}

                        {s.estado === "Pendiente" && (
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => aceptarSolicitud(s)}
                              aria-label={"Aceptar solicitud de " + s.nombre}
                              className="text-xs px-2 py-0.5 bg-green-600 text-white rounded hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                            >
                              Aceptar
                            </button>

                            <button
                              onClick={() => denegarSolicitud(s.id)}
                              aria-label={"Denegar solicitud de " + s.nombre}
                              className="text-xs px-2 py-0.5 bg-red-600 text-white rounded hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                            >
                              Denegar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 pr-3">
                      <button
                        onClick={(e) => abrirEdicion(s.id, e.currentTarget)}
                        aria-label={"Editar solicitud de " + s.nombre}
                        aria-expanded={editandoId === s.id}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
                      >
                        <IcoEditar />
                      </button>
                    </td>

                    <td className="py-3">
                      <button
                        onClick={(e) => abrirEliminar(s.id, e.currentTarget)}
                        aria-label={"Eliminar solicitud de " + s.nombre}
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

          {editandoId &&
            (() => {
              const solicitud = solicitudes.find((s) => s.id === editandoId);

              if (!solicitud) return null;

              return (
                <PanelEdicion
                  solicitud={solicitud}
                  onGuardar={(datos) => guardarEdicion(editandoId, datos)}
                  onCancelar={cerrarEdicion}
                />
              );
            })()}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button onClick={cargarSolicitudes} className={btnAzul + " px-10"}>
          Actualizar
        </button>
      </div>
    </div>
  );
};

export default Solicitudes;