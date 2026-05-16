import { useState } from "react";

type EstadoSistema = "Activo" | "Mantenimiento";
type ModoRegistro  = "Abierto" | "Con aprobación";

interface Config {
  nombrePlataforma:  string;
  limitePalabras:    string;
  mensajeBienvenida: string;
  estadoSistema:     EstadoSistema;
  modoRegistro:      ModoRegistro;
}

const configDefecto: Config = {
  nombrePlataforma:  "",
  limitePalabras:    "",
  mensajeBienvenida: "",
  estadoSistema:     "Activo",
  modoRegistro:      "Abierto",
};

const btnAzul =
  "inline-flex items-center justify-center min-h-[44px] px-6 " +
  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
  "text-sm font-medium rounded-md hover:opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
  "transition-opacity duration-150";

const Configuracion = () => {
  const [config, setConfig]         = useState<Config>(configDefecto);
  const [errores, setErrores]       = useState<Partial<Record<keyof Config, string>>>({});
  const [mensaje, setMensaje]       = useState("");
  const [hayCambios, setHayCambios] = useState(false);

  const anunciar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 5000);
  };

  const set = <K extends keyof Config>(campo: K, valor: Config[K]) => {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
    setHayCambios(true);
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const validar = () => {
    const e: Partial<Record<keyof Config, string>> = {};
    if (!config.nombrePlataforma.trim())
      e.nombrePlataforma = "El nombre de la plataforma es obligatorio.";
    if (!config.limitePalabras.trim())
      e.limitePalabras = "El límite de palabras es obligatorio.";
    else if (isNaN(Number(config.limitePalabras)) || Number(config.limitePalabras) < 50)
      e.limitePalabras = "Ingrese un número válido (mínimo 50).";
    if (!config.mensajeBienvenida.trim())
      e.mensajeBienvenida = "El mensaje de bienvenida es obligatorio.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = () => {
    if (!validar()) return;
    setHayCambios(false);
    anunciar("Configuración guardada correctamente.");
  };

  const restaurar = () => {
    setConfig(configDefecto);
    setErrores({});
    setHayCambios(false);
    anunciar("Valores restaurados a los valores por defecto.");
  };

  const inputClass = (campo: keyof Config) =>
    "w-full px-4 min-h-[44px] border rounded-md text-sm bg-background text-foreground " +
    "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 " +
    (errores[campo] ? "border-destructive" : "border-border");

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{mensaje}</div>

      <h2 className="text-2xl font-bold text-center text-foreground mb-8">
        Configuración General del Sistema
      </h2>

      <div className="max-w-lg mx-auto space-y-5">

        <div>
          <label htmlFor="cfg-nombre" className="block text-sm font-medium text-foreground mb-1">
            Nombre de la plataforma <span aria-hidden="true" className="text-destructive">*</span>
            <span className="sr-only">(obligatorio)</span>
          </label>
          <input id="cfg-nombre" type="text" value={config.nombrePlataforma}
            onChange={(e) => set("nombrePlataforma", e.target.value)}
            placeholder="Ingrese el nombre de la plataforma"
            aria-required="true"
            aria-invalid={errores.nombrePlataforma ? true : undefined}
            aria-describedby={errores.nombrePlataforma ? "err-cfg-nombre" : undefined}
            className={inputClass("nombrePlataforma")} />
          {errores.nombrePlataforma && (
            <p id="err-cfg-nombre" role="alert" className="mt-1 text-xs text-destructive">{errores.nombrePlataforma}</p>
          )}
        </div>

        <div>
          <label htmlFor="cfg-limite" className="block text-sm font-medium text-foreground mb-1">
            Límite de palabras <span aria-hidden="true" className="text-destructive">*</span>
            <span className="sr-only">(obligatorio)</span>
          </label>
          <input id="cfg-limite" type="text" inputMode="numeric" value={config.limitePalabras}
            onChange={(e) => set("limitePalabras", e.target.value)}
            placeholder="Ingrese la cantidad de palabras"
            aria-required="true"
            aria-invalid={errores.limitePalabras ? true : undefined}
            aria-describedby={errores.limitePalabras ? "err-cfg-limite" : "cfg-limite-hint"}
            className={inputClass("limitePalabras")} />
          <p id="cfg-limite-hint" className="mt-1 text-xs text-muted-foreground">Mínimo 50 palabras.</p>
          {errores.limitePalabras && (
            <p id="err-cfg-limite" role="alert" className="mt-1 text-xs text-destructive">{errores.limitePalabras}</p>
          )}
        </div>

        <div>
          <label htmlFor="cfg-bienvenida" className="block text-sm font-medium text-foreground mb-1">
            Mensaje de bienvenida <span aria-hidden="true" className="text-destructive">*</span>
            <span className="sr-only">(obligatorio)</span>
          </label>
          <input id="cfg-bienvenida" type="text" value={config.mensajeBienvenida}
            onChange={(e) => set("mensajeBienvenida", e.target.value)}
            placeholder="Ingrese el mensaje de bienvenida"
            aria-required="true"
            aria-invalid={errores.mensajeBienvenida ? true : undefined}
            aria-describedby={errores.mensajeBienvenida ? "err-cfg-bienvenida" : undefined}
            className={inputClass("mensajeBienvenida")} />
          {errores.mensajeBienvenida && (
            <p id="err-cfg-bienvenida" role="alert" className="mt-1 text-xs text-destructive">{errores.mensajeBienvenida}</p>
          )}
        </div>

        <div>
          <label htmlFor="cfg-estado" className="block text-sm font-medium text-foreground mb-1">Estado del sistema</label>
          <select id="cfg-estado" value={config.estadoSistema}
            onChange={(e) => set("estadoSistema", e.target.value as EstadoSistema)}
            className="w-full px-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="Activo">Activo</option>
            <option value="Mantenimiento">Mantenimiento</option>
          </select>
          {config.estadoSistema === "Mantenimiento" && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              ⚠️ En modo mantenimiento los usuarios no podrán acceder al sistema.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cfg-registro" className="block text-sm font-medium text-foreground mb-1">Modo de registro</label>
          <select id="cfg-registro" value={config.modoRegistro}
            onChange={(e) => set("modoRegistro", e.target.value as ModoRegistro)}
            className="w-full px-4 min-h-[44px] border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1">
            <option value="Abierto">Abierto</option>
            <option value="Con aprobación">Con aprobación</option>
          </select>
        </div>

        <div className="flex gap-4 pt-2">
          <button onClick={guardar} disabled={!hayCambios}
            className={btnAzul + (!hayCambios ? " opacity-40 cursor-not-allowed" : "")}>
            Guardar Cambios
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
