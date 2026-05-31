import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

// La tabla system_config usa key/value — estas son las claves esperadas
const CLAVES = {
  nombrePlataforma:  "nombre_plataforma",
  limitePalabras:    "limite_palabras",
  mensajeBienvenida: "mensaje_bienvenida",
  estadoSistema:     "estado_sistema",
  modoRegistro:      "modo_registro",
} as const;

const DEFAULTS = {
  [CLAVES.nombrePlataforma]:  "Simplificador de Textos",
  [CLAVES.limitePalabras]:    "500",
  [CLAVES.mensajeBienvenida]: "Bienvenido al Simplificador de Textos",
  [CLAVES.estadoSistema]:     "Activo",
  [CLAVES.modoRegistro]:      "Abierto",
};

const btnAzul =
  "inline-flex items-center justify-center min-h-[44px] px-6 " +
  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
  "text-sm font-medium rounded-md hover:opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
  "transition-opacity duration-150";

const Configuracion = () => {
  const [nombrePlataforma,  setNombre]   = useState("");
  const [limitePalabras,    setLimite]   = useState("");
  const [mensajeBienvenida, setMensaje_] = useState("");
  const [estadoSistema,     setEstado]   = useState("Activo");
  const [modoRegistro,      setModo]     = useState("Abierto");

  const [cargando,   setCargando]   = useState(true);
  const [guardando,  setGuardando]  = useState(false);
  const [hayCambios, setHayCambios] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [errores,    setErrores]    = useState<Record<string, string>>({});
  const [mensaje,    setMensaje]    = useState("");

  const anunciar = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(""), 5000); };

  // ── Carga: lee las filas key/value y las mapea a estado local ─────────────
  const cargarConfig = async () => {
    setCargando(true); setErrorCarga("");

    const { data, error } = await supabase
      .from("system_config")
      .select("key, value");

    if (error) {
      console.error(error);
      setErrorCarga("No se pudo cargar la configuración. Intentá de nuevo.");
      setCargando(false);
      return;
    }

    const mapa: Record<string, string> = {};
    (data ?? []).forEach((row: { key: string; value: string }) => { mapa[row.key] = row.value; });

    setNombre(mapa[CLAVES.nombrePlataforma]  ?? DEFAULTS[CLAVES.nombrePlataforma]);
    setLimite(mapa[CLAVES.limitePalabras]    ?? DEFAULTS[CLAVES.limitePalabras]);
    setMensaje_(mapa[CLAVES.mensajeBienvenida] ?? DEFAULTS[CLAVES.mensajeBienvenida]);
    setEstado(mapa[CLAVES.estadoSistema]     ?? DEFAULTS[CLAVES.estadoSistema]);
    setModo(mapa[CLAVES.modoRegistro]        ?? DEFAULTS[CLAVES.modoRegistro]);

    setHayCambios(false);
    setCargando(false);
  };

  useEffect(() => { cargarConfig(); }, []);

  // ── Upsert: inserta o actualiza cada clave ────────────────────────────────
  const upsertClave = async (key: string, value: string) => {
    // Buscar si ya existe la fila
    const { data: existente } = await supabase
      .from("system_config")
      .select("id")
      .eq("key", key)
      .single();

    if (existente) {
      return supabase.from("system_config").update({ value }).eq("key", key);
    } else {
      // La tabla no tiene secuencia — obtenemos el max id
      const { data: maxRow } = await supabase
        .from("system_config")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .single();
      const nuevoId = maxRow ? (maxRow.id as number) + 1 : 1;
      return supabase.from("system_config").insert([{ id: nuevoId, key, value }]);
    }
  };

  // ── Validar ───────────────────────────────────────────────────────────────
  const validar = () => {
    const e: Record<string, string> = {};
    if (!nombrePlataforma.trim())   e.nombre  = "El nombre de la plataforma es obligatorio.";
    if (!limitePalabras.trim() || isNaN(Number(limitePalabras)) || Number(limitePalabras) < 50)
      e.limite  = "Ingresá un número válido (mínimo 50).";
    if (!mensajeBienvenida.trim())  e.mensaje = "El mensaje de bienvenida es obligatorio.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const guardar = async () => {
    if (!validar()) return;
    setGuardando(true);

    const cambios = [
      { key: CLAVES.nombrePlataforma,  value: nombrePlataforma },
      { key: CLAVES.limitePalabras,    value: limitePalabras },
      { key: CLAVES.mensajeBienvenida, value: mensajeBienvenida },
      { key: CLAVES.estadoSistema,     value: estadoSistema },
      { key: CLAVES.modoRegistro,      value: modoRegistro },
    ];

    const resultados = await Promise.all(cambios.map(({ key, value }) => upsertClave(key, value)));
    const hayError   = resultados.some((r) => r.error);

    if (hayError) {
      console.error("Errores guardando configuración:", resultados);
      anunciar("Error al guardar algunos campos. Revisá la consola.");
    } else {
      setHayCambios(false);
      anunciar("Configuración guardada correctamente.");
    }
    setGuardando(false);
  };

  // ── Restaurar ─────────────────────────────────────────────────────────────
  const restaurar = () => {
    setNombre(DEFAULTS[CLAVES.nombrePlataforma]);
    setLimite(DEFAULTS[CLAVES.limitePalabras]);
    setMensaje_(DEFAULTS[CLAVES.mensajeBienvenida]);
    setEstado(DEFAULTS[CLAVES.estadoSistema]);
    setModo(DEFAULTS[CLAVES.modoRegistro]);
    setErrores({});
    setHayCambios(true);
    anunciar("Valores restaurados. Presioná Guardar para aplicar los cambios.");
  };

  const marcarCambio = () => setHayCambios(true);

  const inputCls = (campo: string) =>
    "w-full px-4 min-h-[44px] border rounded-md text-sm bg-background text-foreground " +
    "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
    (errores[campo] ? "border-destructive" : "border-border");

  if (cargando) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-muted-foreground text-sm">Cargando configuración...</p>
    </div>
  );

  if (errorCarga) return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <p className="text-destructive text-sm" role="alert">{errorCarga}</p>
      <button onClick={cargarConfig} className={btnAzul}>Reintentar</button>
    </div>
  );

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      <h2 className="text-2xl font-bold text-center text-foreground mb-8">
        Configuración General del Sistema
      </h2>

      <div className="max-w-lg mx-auto space-y-5">

        {/* Nombre */}
        <div>
          <label htmlFor="cfg-nombre" className="block text-sm font-medium text-foreground mb-1">
            Nombre de la plataforma <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input id="cfg-nombre" type="text" value={nombrePlataforma}
            onChange={(e) => { setNombre(e.target.value); marcarCambio(); }}
            placeholder="Ingrese el nombre de la plataforma"
            aria-required="true" aria-invalid={errores.nombre ? true : undefined}
            aria-describedby={errores.nombre ? "err-nombre" : undefined}
            className={inputCls("nombre")} />
          {errores.nombre && <p id="err-nombre" role="alert" className="mt-1 text-xs text-destructive">{errores.nombre}</p>}
        </div>

        {/* Límite */}
        <div>
          <label htmlFor="cfg-limite" className="block text-sm font-medium text-foreground mb-1">
            Límite de palabras <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input id="cfg-limite" type="text" inputMode="numeric" value={limitePalabras}
            onChange={(e) => { setLimite(e.target.value); marcarCambio(); }}
            placeholder="Ingrese la cantidad de palabras"
            aria-required="true" aria-invalid={errores.limite ? true : undefined}
            aria-describedby={errores.limite ? "err-limite" : "cfg-limite-hint"}
            className={inputCls("limite")} />
          <p id="cfg-limite-hint" className="mt-1 text-xs text-muted-foreground">Mínimo 50 palabras. El valor actual del proyecto es 500.</p>
          {errores.limite && <p id="err-limite" role="alert" className="mt-1 text-xs text-destructive">{errores.limite}</p>}
        </div>

        {/* Mensaje bienvenida */}
        <div>
          <label htmlFor="cfg-bienvenida" className="block text-sm font-medium text-foreground mb-1">
            Mensaje de bienvenida <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input id="cfg-bienvenida" type="text" value={mensajeBienvenida}
            onChange={(e) => { setMensaje_(e.target.value); marcarCambio(); }}
            placeholder="Ingrese el mensaje de bienvenida"
            aria-required="true" aria-invalid={errores.mensaje ? true : undefined}
            aria-describedby={errores.mensaje ? "err-mensaje" : undefined}
            className={inputCls("mensaje")} />
          {errores.mensaje && <p id="err-mensaje" role="alert" className="mt-1 text-xs text-destructive">{errores.mensaje}</p>}
        </div>

        {/* Estado del sistema */}
        <div>
          <label htmlFor="cfg-estado" className="block text-sm font-medium text-foreground mb-1">
            Estado del sistema
          </label>
          <select id="cfg-estado" value={estadoSistema}
            onChange={(e) => { setEstado(e.target.value); marcarCambio(); }}
            className="w-full px-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="Activo">Activo</option>
            <option value="Mantenimiento">Mantenimiento</option>
          </select>
          {estadoSistema === "Mantenimiento" && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              ⚠️ En modo mantenimiento los usuarios no podrán acceder al sistema.
            </p>
          )}
        </div>

        {/* Modo de registro */}
        <div>
          <label htmlFor="cfg-registro" className="block text-sm font-medium text-foreground mb-1">
            Modo de registro
          </label>
          <select id="cfg-registro" value={modoRegistro}
            onChange={(e) => { setModo(e.target.value); marcarCambio(); }}
            className="w-full px-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="Abierto">Abierto</option>
            <option value="Con aprobación">Con aprobación</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-2">
          <button onClick={guardar} disabled={!hayCambios || guardando}
            className={btnAzul + (!hayCambios || guardando ? " opacity-40 cursor-not-allowed" : "")}>
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button onClick={restaurar} className={btnAzul}>
            Restaurar valores por defecto
          </button>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
