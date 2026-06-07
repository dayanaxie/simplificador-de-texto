import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import DialogoConfirmar from "./DialogoConfirmar";
import BotonAyuda from "../../../components/BotonAyuda";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Guia {
  id: number;
  title: string;
  content: string;
  module: string;
  is_active: boolean;
  updated_at: string;
}

// Módulos del sistema — deben coincidir con los props que usará BotonAyuda
const MODULOS = [
  "Simplificación",
  "Textos guardados",
  "Diccionario personal",
  "Estadísticas personales",
  "Perfil",
  "Login",
  "Registro",
  "Panel de administración",
  "Anuncios",
  "Auditoría",
  "Configuración",
  "Glosario",
  "Métricas",
  "Reportes",
  "Solicitudes",
  "Usuarios",
  "Guías de ayuda",
];

// ── Estilos ───────────────────────────────────────────────────────────────────
const btnAzul =
  "inline-flex items-center justify-center min-h-[44px] px-6 " +
  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
  "text-sm font-medium rounded-md hover:opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
  "transition-opacity duration-150";

const inputCls = (error?: string) =>
  "w-full px-4 min-h-[44px] border rounded-md text-sm bg-background text-foreground " +
  "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
  (error ? "border-destructive" : "border-border");

// ── Íconos ────────────────────────────────────────────────────────────────────
const IcoVer = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

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

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatearFecha = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CR") + " " +
    d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
};

// ── Modal ver detalle (admin) ─────────────────────────────────────────────────
interface ModalDetalleProps { guia: Guia; onCerrar: () => void; }

const ModalDetalle = ({ guia, onCerrar }: ModalDetalleProps) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { btnRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-guia-titulo"
        className="relative z-10 bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-y-auto"
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="modal-guia-titulo" className="text-lg font-bold text-foreground">
              {guia.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Módulo: {guia.module}</span>
              <span className={
                "inline-block px-2 py-0.5 rounded-full text-xs font-medium " +
                (guia.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")
              }>
                {guia.is_active ? "Activa" : "Inactiva"}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="prose prose-sm max-w-none mb-6">
          <p className="text-xs text-muted-foreground mb-3">
            Última modificación: {formatearFecha(guia.updated_at)}
          </p>
          <div className="border border-border rounded-md p-4 bg-gray-50">
            {guia.content.split("\n").map((linea, i) => (
              linea.trim()
                ? <p key={i} className="text-sm text-foreground mb-2">{linea}</p>
                : <br key={i} />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button ref={btnRef} onClick={onCerrar} className={btnAzul}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const GuiasAyuda = () => {
  const [guias, setGuias]               = useState<Guia[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [errorCarga, setErrorCarga]     = useState("");

  // Formulario
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [editandoId, setEditandoId]     = useState<number | null>(null);
  const [titulo, setTitulo]             = useState("");
  const [contenido, setContenido]       = useState("");
  const [modulo, setModulo]             = useState(MODULOS[0]);
  const [activa, setActiva]             = useState(true);
  const [errores, setErrores]           = useState<Record<string, string>>({});
  const [guardando, setGuardando]       = useState(false);

  // Filtros
  const [filtroModulo, setFiltroModulo] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  // Detalle y eliminar
  const [detalleGuia, setDetalleGuia]   = useState<Guia | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const [mensaje, setMensaje]           = useState("");
  const botonOrigenRef = useRef<HTMLButtonElement | null>(null);
  const primerCampoRef = useRef<HTMLInputElement>(null);

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  useEffect(() => {
    if (mostrarForm) setTimeout(() => primerCampoRef.current?.focus(), 50);
  }, [mostrarForm]);

  // ── Carga ──────────────────────────────────────────────────────────────────
  const cargarGuias = async () => {
    setCargando(true); setErrorCarga("");
    const { data, error } = await supabase
      .from("help_guides")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) { console.error(error); setErrorCarga("No se pudieron cargar las guías."); }
    else setGuias(data ?? []);
    setCargando(false);
  };

  useEffect(() => { cargarGuias(); }, []);

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const filtradas = guias.filter((g) => {
    const okModulo = filtroModulo === "Todos" || g.module === filtroModulo;
    const okEstado =
      filtroEstado === "Todos" ||
      (filtroEstado === "Activa" && g.is_active) ||
      (filtroEstado === "Inactiva" && !g.is_active);
    return okModulo && okEstado;
  });

  // ── Validar ────────────────────────────────────────────────────────────────
  const validar = () => {
    const e: Record<string, string> = {};
    if (!titulo.trim())    e.titulo    = "El título es obligatorio.";
    if (!contenido.trim()) e.contenido = "El contenido es obligatorio.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const limpiarFormulario = () => {
    setTitulo(""); setContenido(""); setModulo(MODULOS[0]); setActiva(true);
    setErrores({}); setEditandoId(null); setMostrarForm(false);
  };

  // ── Crear / Actualizar ─────────────────────────────────────────────────────
  const guardar = async () => {
    if (!validar()) { primerCampoRef.current?.focus(); return; }
    setGuardando(true);

    const payload = {
      title:      titulo.trim(),
      content:    contenido.trim(),
      module:     modulo,
      is_active:  activa,
      updated_at: new Date().toISOString(),
    };

    if (editandoId !== null) {
      const { error } = await supabase
        .from("help_guides").update(payload).eq("id", editandoId);
      if (error) { console.error(error); anunciar("Error al actualizar la guía."); }
      else { anunciar(`Guía "${titulo}" actualizada correctamente.`); limpiarFormulario(); await cargarGuias(); }
    } else {
      const { error } = await supabase
        .from("help_guides").insert([payload]);
      if (error) { console.error(error); anunciar("Error al crear la guía."); }
      else { anunciar(`Guía "${titulo}" creada correctamente.`); limpiarFormulario(); await cargarGuias(); }
    }
    setGuardando(false);
  };

  const iniciarEdicion = (g: Guia) => {
    setEditandoId(g.id);
    setTitulo(g.title);
    setContenido(g.content ?? "");
    setModulo(g.module ?? MODULOS[0]);
    setActiva(g.is_active ?? true);
    setErrores({});
    setMostrarForm(true);
    setTimeout(() => primerCampoRef.current?.focus(), 50);
  };

  // ── Cambio rápido de estado activa/inactiva ────────────────────────────────
  const toggleEstado = async (g: Guia, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn;
    const { error } = await supabase
      .from("help_guides")
      .update({ is_active: !g.is_active, updated_at: new Date().toISOString() })
      .eq("id", g.id);
    if (error) { console.error(error); anunciar("Error al cambiar el estado."); }
    else {
      anunciar(`Guía "${g.title}" ${!g.is_active ? "activada" : "desactivada"}.`);
      await cargarGuias();
    }
    botonOrigenRef.current?.focus();
    botonOrigenRef.current = null;
  };

  // ── Detalle ────────────────────────────────────────────────────────────────
  const abrirDetalle = (g: Guia, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn; setDetalleGuia(g);
  };
  const cerrarDetalle = () => {
    setDetalleGuia(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const abrirEliminar = (id: number, btn: HTMLButtonElement) => {
    botonOrigenRef.current = btn; setEliminandoId(id);
  };
  const confirmarEliminar = async () => {
    if (eliminandoId === null) return;
    const guia = guias.find((g) => g.id === eliminandoId);
    const { error } = await supabase.from("help_guides").delete().eq("id", eliminandoId);
    if (error) { console.error(error); anunciar("Error al eliminar la guía."); }
    else { anunciar(`Guía "${guia?.title ?? ""}" eliminada.`); await cargarGuias(); }
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };
  const cancelarEliminar = () => {
    setEliminandoId(null); botonOrigenRef.current?.focus(); botonOrigenRef.current = null;
  };

  const guiaAEliminar = guias.find((g) => g.id === eliminandoId);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      {eliminandoId !== null && guiaAEliminar && (
        <DialogoConfirmar
          titulo="Eliminar guía de ayuda"
          mensaje={`¿Estás segura de que querés eliminar la guía "${guiaAEliminar.title}"? Esta acción no se puede deshacer.`}
          onConfirmar={confirmarEliminar}
          onCancelar={cancelarEliminar}
        />
      )}

      {detalleGuia && (
        <ModalDetalle guia={detalleGuia} onCerrar={cerrarDetalle} />
      )}

      <h2 id="h-guias" className="text-2xl font-bold text-center text-foreground mb-6">
        Guías de Ayuda
      </h2>

      {/* ── Formulario crear / editar ──────────────────────────────────────── */}
      <section aria-labelledby="h-form-guia" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 id="h-form-guia" className="text-sm font-semibold text-foreground">
            {mostrarForm ? (editandoId !== null ? "Editar guía" : "Nueva guía de ayuda") : ""}
          </h3>
          <button
            onClick={() => {
              if (mostrarForm) { limpiarFormulario(); } else { setMostrarForm(true); }
            }}
            aria-expanded={mostrarForm}
            aria-controls="form-guia"
            className={btnAzul}
          >
            {mostrarForm ? "Cancelar" : "+ Nueva guía"}
          </button>
        </div>

        {mostrarForm && (
          <div id="form-guia" className="border border-border rounded-lg p-5 bg-page-bg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Título */}
              <div className="sm:col-span-2">
                <label htmlFor="guia-titulo" className="block text-xs font-medium text-foreground mb-1">
                  Título <span aria-hidden="true" className="text-destructive">*</span>
                  <span className="sr-only">(obligatorio)</span>
                </label>
                <input
                  id="guia-titulo"
                  ref={primerCampoRef}
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Cómo simplificar un texto"
                  aria-required="true"
                  aria-invalid={errores.titulo ? true : undefined}
                  aria-describedby={errores.titulo ? "err-guia-titulo" : undefined}
                  className={inputCls(errores.titulo)}
                />
                {errores.titulo && (
                  <p id="err-guia-titulo" role="alert" className="mt-1 text-xs text-destructive">
                    {errores.titulo}
                  </p>
                )}
              </div>

              {/* Módulo */}
              <div>
                <label htmlFor="guia-modulo" className="block text-xs font-medium text-foreground mb-1">
                  Módulo al que aplica <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <select
                  id="guia-modulo"
                  value={modulo}
                  onChange={(e) => setModulo(e.target.value)}
                  className="w-full px-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
                >
                  {MODULOS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label htmlFor="guia-estado" className="block text-xs font-medium text-foreground mb-1">
                  Estado
                </label>
                <select
                  id="guia-estado"
                  value={activa ? "activa" : "inactiva"}
                  onChange={(e) => setActiva(e.target.value === "activa")}
                  className="w-full px-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
                >
                  <option value="activa">Activa — visible para usuarios</option>
                  <option value="inactiva">Inactiva — solo visible en admin</option>
                </select>
              </div>

              {/* Contenido */}
              <div className="sm:col-span-2">
                <label htmlFor="guia-contenido" className="block text-xs font-medium text-foreground mb-1">
                  Contenido <span aria-hidden="true" className="text-destructive">*</span>
                  <span className="sr-only">(obligatorio)</span>
                </label>
                <p className="text-xs text-muted-foreground mb-1">
                  Escribí en lenguaje simple y claro. Cada párrafo en una línea separada.
                </p>
                <textarea
                  id="guia-contenido"
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  rows={8}
                  placeholder={"Ej:\nPara simplificar un texto:\n1. Escribí o pegá tu texto en el cuadro superior.\n2. Verificá que no supere las 500 palabras.\n3. Presioná el botón Simplificar.\n4. El resultado aparecerá en el cuadro inferior."}
                  aria-required="true"
                  aria-invalid={errores.contenido ? true : undefined}
                  aria-describedby={errores.contenido ? "err-guia-contenido" : undefined}
                  className={
                    "w-full px-4 py-3 border rounded-md text-sm bg-background text-foreground resize-y " +
                    "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
                    (errores.contenido ? "border-destructive" : "border-border")
                  }
                />
                {errores.contenido && (
                  <p id="err-guia-contenido" role="alert" className="mt-1 text-xs text-destructive">
                    {errores.contenido}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={guardar}
                disabled={guardando}
                className={btnAzul + (guardando ? " opacity-50 cursor-not-allowed" : "")}
              >
                {guardando ? "Guardando..." : editandoId !== null ? "Actualizar guía" : "Crear guía"}
              </button>
              <button
                onClick={limpiarFormulario}
                className="min-h-[44px] px-5 text-sm font-medium border border-border rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label htmlFor="filtro-guia-modulo" className="sr-only">Filtrar por módulo</label>
          <select
            id="filtro-guia-modulo"
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
            className="min-h-[44px] px-3 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          >
            <option value="Todos">Todos los módulos</option>
            {MODULOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filtro-guia-estado" className="sr-only">Filtrar por estado</label>
          <select
            id="filtro-guia-estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="min-h-[44px] px-3 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Activa">Activas</option>
            <option value="Inactiva">Inactivas</option>
          </select>
        </div>
        {(filtroModulo !== "Todos" || filtroEstado !== "Todos") && (
          <button
            onClick={() => { setFiltroModulo("Todos"); setFiltroEstado("Todos"); }}
            className="min-h-[44px] px-4 text-sm text-muted-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded"
          >
            Limpiar filtros
          </button>
        )}
        {(filtroModulo !== "Todos" || filtroEstado !== "Todos") && (
          <p className="self-center text-xs text-muted-foreground" aria-live="polite">
            Mostrando {filtradas.length} de {guias.length} guía(s).
          </p>
        )}
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left" aria-labelledby="h-guias">
          <caption className="sr-only">
            Guías de ayuda del sistema con módulo, estado y opciones de gestión
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Título</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Módulo</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Estado</th>
              <th scope="col" className="py-3 pr-4 font-semibold text-foreground">Última modificación</th>
              <th scope="col" className="py-3 pr-2 font-semibold text-foreground">Ver</th>
              <th scope="col" className="py-3 pr-2 font-semibold text-foreground">Editar</th>
              <th scope="col" className="py-3 font-semibold text-foreground">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Cargando guías...
                </td>
              </tr>
            ) : errorCarga ? (
              <tr>
                <td colSpan={7} className="py-8 text-center" role="alert">
                  <span className="text-destructive">{errorCarga}</span>
                  <button onClick={cargarGuias} className="ml-3 text-primary underline text-sm">
                    Reintentar
                  </button>
                </td>
              </tr>
            ) : filtradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  {guias.length === 0
                    ? "No hay guías de ayuda creadas."
                    : "No hay guías con el filtro seleccionado."}
                </td>
              </tr>
            ) : (
              filtradas.map((g) => (
                <tr key={g.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 text-foreground font-medium max-w-[200px]">
                    <p className="truncate" title={g.title}>{g.title}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {g.module}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={(e) => toggleEstado(g, e.currentTarget)}
                      aria-label={`${g.is_active ? "Desactivar" : "Activar"} guía: ${g.title}`}
                      className={
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer " +
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] " +
                        (g.is_active
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                      }
                    >
                      {g.is_active ? "✓ Activa" : "○ Inactiva"}
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap text-xs">
                    {formatearFecha(g.updated_at)}
                  </td>
                  {/* Ver detalle */}
                  <td className="py-3 pr-2">
                    <button
                      onClick={(e) => abrirDetalle(g, e.currentTarget)}
                      aria-label={`Ver detalle de la guía: ${g.title}`}
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
                    >
                      <IcoVer />
                    </button>
                  </td>
                  {/* Editar */}
                  <td className="py-3 pr-2">
                    <button
                      onClick={() => iniciarEdicion(g)}
                      aria-label={`Editar guía: ${g.title}`}
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
                    >
                      <IcoEditar />
                    </button>
                  </td>
                  {/* Eliminar */}
                  <td className="py-3">
                    <button
                      onClick={(e) => abrirEliminar(g.id, e.currentTarget)}
                      aria-label={`Eliminar guía: ${g.title}`}
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
      <BotonAyuda modulo="Guías de Ayuda" />
    </div>
  );
};

export default GuiasAyuda;
