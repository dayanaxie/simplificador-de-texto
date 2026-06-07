import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

type AdminTab = "datos" | "password";

const adminTabs: { id: AdminTab; label: string }[] = [
  { id: "datos",    label: "Datos personales" },
  { id: "password", label: "Cambiar contraseña" },
];

export default function AdminProfile() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>("datos");
  const [userId, setUserId]       = useState<number | null>(null);
  const [nombre, setNombre]       = useState("");
  const [email, setEmail]         = useState("");
  const [cargando, setCargando]   = useState(true);
  const [mensaje, setMensaje]     = useState("");
  const [esError, setEsError]     = useState(false);

  const anunciar = (texto: string, error = false) => {
    setMensaje(texto);
    setEsError(error);
    setTimeout(() => setMensaje(""), 5000);
  };

  // ── Lee el usuario desde localStorage (igual que hace el Login) ───────────
  useEffect(() => {
    const raw = localStorage.getItem("usuario");
    if (!raw) {
      navigate("/");
      return;
    }

    try {
      const usuario = JSON.parse(raw);
      setUserId(usuario.id);
      setNombre(usuario.name ?? "");
      setEmail(usuario.email ?? "");
    } catch {
      navigate("/");
    }

    setCargando(false);
  }, [navigate]);

  if (cargando) return (
    <main className="flex-1 bg-surface min-h-screen flex items-center justify-center">
      <p className="font-inter text-base text-[#1E1E1E]">Cargando perfil...</p>
    </main>
  );

  return (
    <main className="flex-1 bg-surface min-h-screen flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-[1008px]">

        {/* Mensaje global */}
        {mensaje && (
          <div
            role="alert"
            aria-live="polite"
            className={
              "mb-4 px-4 py-3 rounded text-sm font-inter " +
              (esError
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200")
            }
          >
            {mensaje}
          </div>
        )}

        <div className="bg-white border border-card-border">
          {/* Tabs — mismo estilo que Perfil.tsx */}
          <div
            className="flex overflow-x-auto border-b"
            style={{ backgroundColor: "#002855", borderColor: "#002855" }}
          >
            {adminTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-selected={isActive}
                  className="relative flex flex-col justify-end items-center px-4 h-[52px] shrink-0"
                >
                  <span className="font-roboto font-medium text-base md:text-lg leading-5 tracking-[0.1px] text-white whitespace-nowrap pb-3">
                    {tab.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1 right-1 h-[3px] bg-white rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Contenido */}
          <div className="p-6 md:p-10 min-h-[400px]">
            {activeTab === "datos" && (
              <DatosTab
                userId={userId}
                nombre={nombre}
                setNombre={(nuevoNombre) => {
                  setNombre(nuevoNombre);
                  // Actualizar también en localStorage
                  const raw = localStorage.getItem("usuario");
                  if (raw) {
                    const u = JSON.parse(raw);
                    localStorage.setItem("usuario", JSON.stringify({ ...u, name: nuevoNombre }));
                  }
                }}
                email={email}
                anunciar={anunciar}
              />
            )}
            {activeTab === "password" && (
              <PasswordTab
                email={email}
                anunciar={anunciar}
              />
            )}
          </div>
        </div>

        {/* Volver al panel */}
        <div className="flex justify-end mt-4">
          <button
            onClick={() => navigate("/admin")}
            className="font-inter font-medium text-sm text-[#002855] underline hover:opacity-70 transition-opacity"
          >
            ← Volver al panel de administración
          </button>
        </div>
      </div>
    </main>
  );
}

// ── Tab: Datos personales ─────────────────────────────────────────────────────
function DatosTab({
  userId,
  nombre,
  setNombre,
  email,
  anunciar,
}: {
  userId: number | null;
  nombre: string;
  setNombre: (v: string) => void;
  email: string;
  anunciar: (msg: string, error?: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft]         = useState(nombre);
  const [guardando, setGuardando] = useState(false);

  const handleEdit   = () => { setDraft(nombre); setIsEditing(true); };
  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    if (!draft.trim()) { anunciar("El nombre no puede estar vacío.", true); return; }
    setGuardando(true);

    const { error } = await supabase
      .from("users")
      .update({ name: draft.trim() })
      .eq("id", userId);

    if (error) {
      console.error(error);
      anunciar("Error al actualizar el nombre.", true);
    } else {
      setNombre(draft.trim());
      setIsEditing(false);
      anunciar("Nombre actualizado correctamente.");
    }
    setGuardando(false);
  };

  if (isEditing) return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-8">
        Editar Datos Personales
      </h2>
      <div className="flex flex-col gap-6 max-w-[317px]">
        <div className="flex flex-col gap-2">
          <label htmlFor="admin-nombre" className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
            Nombre
          </label>
          <div className="border border-input-border bg-white px-4 py-3">
            <input
              id="admin-nombre"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
            Correo electrónico
          </label>
          <div className="border border-input-border bg-[#f5f5f5] px-4 py-3">
            <span className="font-inter font-normal text-base text-[#666] leading-none">{email}</span>
          </div>
          <p className="text-xs text-[#666] font-inter">El correo no se puede modificar.</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-8">
        <button
          onClick={handleCancel}
          className="h-10 px-4 font-inter font-medium text-base bg-white border border-gray-300 text-black transition-colors rounded"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={guardando}
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors whitespace-nowrap rounded disabled:opacity-50"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          {guardando ? "Guardando..." : "Guardar y continuar"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-8">
        Datos Personales
      </h2>
      <div className="flex flex-col gap-6 max-w-[317px]">
        <div className="flex flex-col gap-2">
          <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">Nombre</label>
          <div className="border border-input-border bg-white px-4 py-3">
            <span className="font-inter font-normal text-base text-[#1E1E1E] leading-none">{nombre}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">Correo electrónico</label>
          <div className="border border-input-border bg-white px-4 py-3">
            <span className="font-inter font-normal text-base text-[#1E1E1E] leading-none">{email}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-8">
        <button
          onClick={handleEdit}
          className="text-white font-inter font-medium text-base px-8 h-10 flex items-center justify-center transition-colors rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Editar
        </button>
      </div>
    </div>
  );
}

// ── Tab: Cambiar contraseña ───────────────────────────────────────────────────
function PasswordTab({
  email,
  anunciar,
}: {
  email: string;
  anunciar: (msg: string, error?: boolean) => void;
}) {
  const [actual, setActual]       = useState("");
  const [nueva, setNueva]         = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [mostrarActual, setMostrarActual]       = useState(false);
  const [mostrarNueva, setMostrarNueva]         = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores]     = useState<Record<string, string>>({});

  const limpiarFormulario = () => {
    setActual("");
    setNueva("");
    setConfirmar("");
    setMostrarActual(false);
    setMostrarNueva(false);
    setMostrarConfirmar(false);
    setErrores({});
  };

  const handleCancel = () => {
    limpiarFormulario();
  };

  const handleSave = async () => {
    const nuevosErrores: Record<string, string> = {};

    /*
     * No se usa trim() en las contraseñas porque un espacio
     * podría formar parte de una contraseña válida.
     */
    if (!actual) {
      nuevosErrores.actual = "Ingrese su contraseña actual.";
    }

    if (!nueva) {
      nuevosErrores.nueva = "Ingrese la nueva contraseña.";
    } else if (nueva.length < 8) {
      nuevosErrores.nueva = "La nueva contraseña debe tener al menos 8 caracteres.";
    }

    if (!confirmar) {
      nuevosErrores.confirmar = "Confirme la nueva contraseña.";
    } else if (nueva !== confirmar) {
      nuevosErrores.confirmar = "Las contraseñas no coinciden.";
    }

    if (actual && nueva && actual === nueva) {
      nuevosErrores.nueva = "La nueva contraseña debe ser diferente de la actual.";
    }

    if (!email) {
      nuevosErrores.actual = "No se encontró el correo del administrador.";
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    setGuardando(true);

    try {
      /*
       * Primero se valida realmente la contraseña actual.
       * Si la contraseña está mala, signInWithPassword devuelve error
       * y no se permite continuar con el cambio.
       */
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: actual,
      });

      if (loginError) {
        setErrores({
          actual: "La contraseña actual es incorrecta.",
        });
        anunciar("La contraseña actual es incorrecta.", true);
        return;
      }

      /*
       * Después de validar la contraseña actual, Supabase deja una sesión
       * activa para este usuario. Por eso updateUser cambia la contraseña
       * del administrador autenticado.
       */
      const { error: updateError } = await supabase.auth.updateUser({
        password: nueva,
      });

      if (updateError) {
        throw updateError;
      }

      limpiarFormulario();
      anunciar("Contraseña actualizada correctamente.");
    } catch (err: unknown) {
      console.error("Error al actualizar la contraseña:", err);

      const authError = err as {
        code?: string;
        message?: string;
        status?: number;
      };

      const code = authError.code?.toLowerCase() ?? "";
      const message = authError.message?.toLowerCase() ?? "";

      if (
        code === "invalid_credentials" ||
        message.includes("invalid login") ||
        message.includes("invalid credentials") ||
        message.includes("invalid password")
      ) {
        setErrores({
          actual: "La contraseña actual es incorrecta.",
        });
        anunciar("La contraseña actual es incorrecta.", true);
      } else if (
        code === "same_password" ||
        message.includes("same password")
      ) {
        setErrores({
          nueva: "La nueva contraseña debe ser diferente de la actual.",
        });
        anunciar("La nueva contraseña debe ser diferente de la actual.", true);
      } else if (
        code === "weak_password" ||
        message.includes("weak password") ||
        message.includes("password should") ||
        message.includes("password must")
      ) {
        setErrores({
          nueva: "La nueva contraseña no cumple con los requisitos de seguridad.",
        });
        anunciar("La nueva contraseña no cumple con los requisitos de seguridad.", true);
      } else if (
        code === "session_not_found" ||
        message.includes("session") ||
        authError.status === 401
      ) {
        anunciar("La sesión venció. Inicie sesión nuevamente.", true);
      } else {
        anunciar("Error al actualizar la contraseña.", true);
      }
    } finally {
      setGuardando(false);
    }
  };

  const inputCls = (campo: string) =>
    "relative border bg-white px-4 py-3 pr-24 " +
    (errores[campo] ? "border-red-400" : "border-input-border");

  return (
    <div className="relative">
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-2">
        Cambiar Contraseña
      </h2>

      <p className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%] mb-8 max-w-[600px]">
        Ingrese su contraseña actual y luego la nueva contraseña dos veces para confirmar.
      </p>

      <div className="flex flex-col gap-6 max-w-[420px]">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="pass-actual"
            className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
          >
            Contraseña actual
          </label>

          <div className={inputCls("actual")}>
            <input
              id="pass-actual"
              type={mostrarActual ? "text" : "password"}
              value={actual}
              onChange={(e) => {
                setActual(e.target.value);
                setErrores((prev) => ({ ...prev, actual: "" }));
              }}
              placeholder="Ingrese su contraseña actual"
              autoComplete="current-password"
              disabled={guardando}
              className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent placeholder:text-[#1E1E1E]/60 disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() => setMostrarActual((valor) => !valor)}
              disabled={guardando}
              aria-label={
                mostrarActual
                  ? "Ocultar contraseña actual"
                  : "Mostrar contraseña actual"
              }
              aria-pressed={mostrarActual}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-inter font-medium text-[#002855] hover:underline disabled:opacity-50"
            >
              {mostrarActual ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {errores.actual && (
            <p role="alert" className="text-xs text-red-600 font-inter">
              {errores.actual}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="pass-nueva"
            className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
          >
            Nueva contraseña
          </label>

          <div className={inputCls("nueva")}>
            <input
              id="pass-nueva"
              type={mostrarNueva ? "text" : "password"}
              value={nueva}
              onChange={(e) => {
                setNueva(e.target.value);
                setErrores((prev) => ({ ...prev, nueva: "" }));
              }}
              placeholder="Ingrese la nueva contraseña"
              autoComplete="new-password"
              minLength={8}
              disabled={guardando}
              className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent placeholder:text-[#1E1E1E]/60 disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() => setMostrarNueva((valor) => !valor)}
              disabled={guardando}
              aria-label={
                mostrarNueva
                  ? "Ocultar nueva contraseña"
                  : "Mostrar nueva contraseña"
              }
              aria-pressed={mostrarNueva}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-inter font-medium text-[#002855] hover:underline disabled:opacity-50"
            >
              {mostrarNueva ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {errores.nueva && (
            <p role="alert" className="text-xs text-red-600 font-inter">
              {errores.nueva}
            </p>
          )}

          {!errores.nueva && (
            <p className="text-xs text-[#666] font-inter">
              Debe contener al menos 8 caracteres.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="pass-confirmar"
            className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
          >
            Confirmar nueva contraseña
          </label>

          <div className={inputCls("confirmar")}>
            <input
              id="pass-confirmar"
              type={mostrarConfirmar ? "text" : "password"}
              value={confirmar}
              onChange={(e) => {
                setConfirmar(e.target.value);
                setErrores((prev) => ({ ...prev, confirmar: "" }));
              }}
              placeholder="Vuelva a ingresar la nueva contraseña"
              autoComplete="new-password"
              minLength={8}
              disabled={guardando}
              className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent placeholder:text-[#1E1E1E]/60 disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() => setMostrarConfirmar((valor) => !valor)}
              disabled={guardando}
              aria-label={
                mostrarConfirmar
                  ? "Ocultar confirmación de contraseña"
                  : "Mostrar confirmación de contraseña"
              }
              aria-pressed={mostrarConfirmar}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-inter font-medium text-[#002855] hover:underline disabled:opacity-50"
            >
              {mostrarConfirmar ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {errores.confirmar && (
            <p role="alert" className="text-xs text-red-600 font-inter">
              {errores.confirmar}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-8">
        <button
          type="button"
          onClick={handleCancel}
          disabled={guardando}
          className="h-10 px-4 font-inter font-medium text-base bg-white border border-gray-300 text-black transition-colors rounded disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={guardando}
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors whitespace-nowrap rounded disabled:opacity-50"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          {guardando ? "Actualizando..." : "Guardar y continuar"}
        </button>
      </div>
    </div>
  );
}
