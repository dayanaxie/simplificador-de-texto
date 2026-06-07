import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";

type ProfileTab = "datos" | "password" | "preferencias";

type MessageSetter = (value: string | null) => void;

type FontSize = "pequeño" | "mediano" | "grande";
type Contrast = "activar" | "desactivar";

const profileTabs: { id: ProfileTab; label: string }[] = [
  { id: "datos", label: "Datos personales" },
  { id: "password", label: "Cambiar contraseña" },
  { id: "preferencias", label: "Preferencias de lectura" },
];

export default function Perfil() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("datos");

  const [isEditing, setIsEditing] = useState(false);

  const [nombre, setNombre] = useState("Nombre de Usuario");
  const [correo, setCorreo] = useState("Correo@gmail.com");
  const [userId, setUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const getUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          setError("No hay una sesión activa");
          return;
        }

        if (!session.user.email) {
          setError("La cuenta no tiene un correo electrónico asociado");
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("email", session.user.email)
          .single();

        if (userError) {
          throw userError;
        }

        if (!userData) {
          setError("No se encontraron los datos del usuario");
          return;
        }

        setUserId(userData.id);
        setNombre(userData.name || "Nombre de Usuario");
        setCorreo(userData.email || session.user.email);
      } catch (err) {
        console.error("Error al obtener los datos:", err);
        setError("Error al obtener los datos del usuario");
      } finally {
        setLoading(false);
      }
    };

    void getUserData();
  }, []);

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <main className="flex-1 bg-surface min-h-screen flex items-center justify-center">
        <p className="text-[#1E1E1E]">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-surface min-h-screen flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-[1008px]">
        {error && (
          <div
            className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded"
            role="status"
            aria-live="polite"
          >
            {success}
          </div>
        )}

        <div className="bg-white border border-card-border">
          {/* Navegación de pestañas */}
          <div
            className="flex overflow-x-auto border-b"
            style={{
              backgroundColor: "#002855",
              borderColor: "#002855",
            }}
          >
            {profileTabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className="relative flex flex-col justify-end items-center px-4 h-[52px] shrink-0"
                  aria-selected={isActive}
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

          {/* Contenido de las pestañas */}
          <div className="p-6 md:p-10 min-h-[400px]">
            {activeTab === "datos" && (
              <DatosPersonalesTab
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                nombre={nombre}
                setNombre={setNombre}
                correo={correo}
                userId={userId}
                setError={setError}
                setSuccess={setSuccess}
              />
            )}

            {activeTab === "password" && (
              <PasswordTab
                setError={setError}
                setSuccess={setSuccess}
              />
            )}

            {activeTab === "preferencias" && (
              <PreferenciasTab
                setError={setError}
                setSuccess={setSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   PESTAÑA DE DATOS PERSONALES
========================================================= */

function DatosPersonalesTab({
  isEditing,
  setIsEditing,
  nombre,
  setNombre,
  correo,
  userId,
  setError,
  setSuccess,
}: {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  nombre: string;
  setNombre: (value: string) => void;
  correo: string;
  userId: number | null;
  setError: MessageSetter;
  setSuccess: MessageSetter;
}) {
  const [draft, setDraft] = useState({
    nombre,
    correo,
  });

  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setError(null);
    setSuccess(null);

    setDraft({
      nombre,
      correo,
    });

    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft({
      nombre,
      correo,
    });

    setError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const nombreLimpio = draft.nombre.trim();

    if (!nombreLimpio) {
      setError("El nombre no puede estar vacío");
      return;
    }

    if (userId === null) {
      setError("Usuario no identificado");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userAuthError,
      } = await supabase.auth.getUser();

      if (userAuthError) {
        throw userAuthError;
      }

      if (!user) {
        setError("No hay una sesión activa");
        return;
      }

      if (!user.email) {
        setError("La cuenta no tiene un correo electrónico asociado");
        return;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: nombreLimpio,
        })
        .eq("email", user.email);

      if (updateError) {
        throw updateError;
      }

      setNombre(nombreLimpio);
      setIsEditing(false);
      setSuccess("Datos actualizados correctamente");

      window.setTimeout(() => {
        setSuccess(null);
      }, 4000);
    } catch (err) {
      console.error("Error al guardar los datos:", err);
      setError("Error al guardar los datos");
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div>
        <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-8">
          Editar Datos Personales
        </h2>

        <div className="flex flex-col gap-6 max-w-[500px]">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="profile-name"
              className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
            >
              Nombre
            </label>

            <div className="border border-input-border bg-white px-4 py-3">
              <input
                id="profile-name"
                type="text"
                value={draft.nombre}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    nombre: event.target.value,
                  }))
                }
                disabled={saving}
                autoComplete="name"
                className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="profile-email"
              className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
            >
              Correo electrónico
            </label>

            <div className="border border-input-border bg-gray-50 px-4 py-3">
              <input
                id="profile-email"
                type="email"
                value={draft.correo}
                disabled
                className="w-full font-inter font-normal text-base text-[#999] leading-none outline-none bg-gray-50 cursor-not-allowed"
              />

              <p className="text-xs text-[#999] mt-1">
                El correo no puede ser modificado
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-8">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="h-10 px-4 font-inter font-medium text-base bg-white border border-gray-300 text-black transition-colors rounded disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors whitespace-nowrap rounded disabled:opacity-50"
            style={{
              backgroundColor: "hsl(var(--navy))",
            }}
          >
            {saving ? "Guardando..." : "Guardar y continuar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-8">
        Datos Personales
      </h2>

      <div className="flex flex-col gap-6 max-w-[500px]">
        <div className="flex flex-col gap-2">
          <span className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
            Nombre
          </span>

          <div className="border border-input-border bg-white px-4 py-3">
            <span className="font-inter font-normal text-base text-[#1E1E1E] leading-none">
              {nombre}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
            Correo electrónico
          </span>

          <div className="border border-input-border bg-white px-4 py-3">
            <span className="font-inter font-normal text-base text-[#1E1E1E] leading-none">
              {correo}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={handleEdit}
          className="text-white font-inter font-medium text-base px-8 h-10 flex items-center justify-center transition-colors rounded"
          style={{
            backgroundColor: "hsl(var(--navy))",
          }}
        >
          Editar
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PESTAÑA PARA CAMBIAR LA CONTRASEÑA
========================================================= */

function PasswordTab({
  setError,
  setSuccess,
}: {
  setError: MessageSetter;
  setSuccess: MessageSetter;
}) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [saving, setSaving] = useState(false);

  const handleCancel = () => {
    setActual("");
    setNueva("");
    setConfirmar("");
    setMostrarActual(false);
    setMostrarNueva(false);
    setMostrarConfirmar(false);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (!actual) {
      setError("Ingrese su contraseña actual");
      return;
    }

    if (!nueva) {
      setError("Ingrese la nueva contraseña");
      return;
    }

    if (nueva.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!confirmar) {
      setError("Confirme la nueva contraseña");
      return;
    }

    if (nueva !== confirmar) {
      setError("Las nuevas contraseñas no coinciden");
      return;
    }

    if (actual === nueva) {
      setError(
        "La nueva contraseña debe ser diferente de la contraseña actual"
      );
      return;
    }

    setSaving(true);

    try {
      // Obtener al usuario autenticado.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("La sesión venció. Inicie sesión nuevamente");
        return;
      }

      if (!user.email) {
        setError("El usuario no tiene un correo asociado");
        return;
      }

      /*
      * Verificar realmente la contraseña actual.
      * Si es incorrecta, Supabase devuelve un error y no continúa.
      */
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: actual,
        });

      if (loginError) {
        setError("La contraseña actual es incorrecta");
        return;
      }

      // Cambiar la contraseña solamente después de validarla.
      const { error: passwordError } =
        await supabase.auth.updateUser({
          password: nueva,
        });

      if (passwordError) {
        throw passwordError;
      }

      setActual("");
      setNueva("");
      setConfirmar("");

      setMostrarActual(false);
      setMostrarNueva(false);
      setMostrarConfirmar(false);

      setSuccess("Contraseña actualizada correctamente");

      window.setTimeout(() => {
        setSuccess(null);
      }, 4000);
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
        code === "same_password" ||
        message.includes("same password")
      ) {
        setError(
          "La nueva contraseña debe ser diferente de la contraseña actual"
        );
      } else if (
        code === "weak_password" ||
        message.includes("weak password") ||
        message.includes("password should") ||
        message.includes("password must")
      ) {
        setError(
          "La nueva contraseña no cumple con los requisitos de seguridad"
        );
      } else if (
        code === "session_not_found" ||
        message.includes("session") ||
        authError.status === 401
      ) {
        setError("La sesión venció. Inicie sesión nuevamente");
      } else {
        setError(
          authError.message ||
            "No se pudo actualizar la contraseña"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-2">
        Cambiar Contraseña
      </h2>

      <p className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%] mb-8 max-w-[600px]">
        Ingrese su contraseña actual y luego escriba la nueva contraseña
        dos veces para confirmarla.
      </p>

      <form onSubmit={handleSave} noValidate>
        <div className="flex flex-col gap-6 max-w-[500px]">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="current-password"
              className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
            >
              Contraseña actual
            </label>

            <div className="relative border border-input-border bg-white px-4 py-3 pr-24">
              <input
                id="current-password"
                name="current-password"
                type={mostrarActual ? "text" : "password"}
                value={actual}
                onChange={(event) => setActual(event.target.value)}
                placeholder="Ingrese su contraseña actual"
                autoComplete="current-password"
                required
                disabled={saving}
                className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent placeholder:text-[#1E1E1E] disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => setMostrarActual((valor) => !valor)}
                disabled={saving}
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
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="new-password"
              className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
            >
              Nueva contraseña
            </label>

            <div className="relative border border-input-border bg-white px-4 py-3 pr-24">
              <input
                id="new-password"
                name="new-password"
                type={mostrarNueva ? "text" : "password"}
                value={nueva}
                onChange={(event) => setNueva(event.target.value)}
                placeholder="Ingrese la nueva contraseña"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={saving}
                className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent placeholder:text-[#1E1E1E] disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => setMostrarNueva((valor) => !valor)}
                disabled={saving}
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

            <p className="text-xs text-[#666]">
              Debe contener al menos 8 caracteres.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirm-password"
              className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
            >
              Confirmar nueva contraseña
            </label>

            <div className="relative border border-input-border bg-white px-4 py-3 pr-24">
              <input
                id="confirm-password"
                name="confirm-password"
                type={mostrarConfirmar ? "text" : "password"}
                value={confirmar}
                onChange={(event) => setConfirmar(event.target.value)}
                placeholder="Vuelva a ingresar la nueva contraseña"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={saving}
                className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent placeholder:text-[#1E1E1E] disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => setMostrarConfirmar((valor) => !valor)}
                disabled={saving}
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
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-8">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="h-10 px-4 font-inter font-medium text-base bg-white border border-gray-300 text-black transition-colors rounded disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors whitespace-nowrap rounded disabled:opacity-50"
            style={{
              backgroundColor: "hsl(var(--navy))",
            }}
          >
            {saving ? "Actualizando..." : "Guardar y continuar"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   PESTAÑA DE PREFERENCIAS
========================================================= */

function PreferenciasTab({
  setError,
  setSuccess,
}: {
  setError: MessageSetter;
  setSuccess: MessageSetter;
}) {
  const [fontSize, setFontSize] =
    useState<FontSize>("grande");

  const [contrast, setContrast] =
    useState<Contrast>("desactivar");

  const [saving, setSaving] = useState(false);

  const previewTextSize =
    fontSize === "pequeño"
      ? "text-sm"
      : fontSize === "mediano"
        ? "text-lg"
        : "text-2xl";

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("No hay una sesión activa");
        return;
      }

      if (!user.email) {
        setError("La cuenta no tiene un correo electrónico asociado");
        return;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          font_size: fontSize,
          contrast_mode: contrast === "activar",
        })
        .eq("email", user.email);

      if (updateError) {
        throw updateError;
      }

      setSuccess("Preferencias guardadas correctamente");

      window.setTimeout(() => {
        setSuccess(null);
      }, 4000);
    } catch (err) {
      console.error("Error al guardar las preferencias:", err);
      setError("Error al guardar las preferencias");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFontSize("grande");
    setContrast("desactivar");
    setError(null);
    setSuccess(null);
  };

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-6">
        Preferencias
      </h2>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Controles */}
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-3">
            <span className="font-inter font-medium text-base text-[#1E1E1E]">
              Tamaño de letra
            </span>

            <div className="flex gap-0">
              {(
                [
                  "pequeño",
                  "mediano",
                  "grande",
                ] as FontSize[]
              ).map((size) => {
                const active = fontSize === size;

                const label =
                  size.charAt(0).toUpperCase() +
                  size.slice(1);

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontSize(size)}
                    disabled={saving}
                    className={`h-10 px-5 font-inter font-normal text-base border border-[#D9D9D9] transition-colors disabled:opacity-50 ${
                      active
                        ? "text-white"
                        : "bg-white text-[#1E1E1E] hover:bg-gray-50"
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor:
                              "hsl(var(--navy))",
                            borderColor:
                              "hsl(var(--navy))",
                          }
                        : {}
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-inter font-medium text-base text-[#1E1E1E]">
              Modo de alto contraste
            </span>

            <div className="flex gap-0">
              {(
                [
                  "activar",
                  "desactivar",
                ] as Contrast[]
              ).map((option) => {
                const active = contrast === option;

                const label =
                  option.charAt(0).toUpperCase() +
                  option.slice(1);

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setContrast(option)}
                    disabled={saving}
                    className={`h-10 px-5 font-inter font-normal text-base border border-[#D9D9D9] transition-colors disabled:opacity-50 ${
                      active
                        ? "text-white"
                        : "bg-white text-[#1E1E1E] hover:bg-gray-50"
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor:
                              "hsl(var(--navy))",
                            borderColor:
                              "hsl(var(--navy))",
                          }
                        : {}
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div className="flex-1 max-w-[320px] md:max-w-[360px]">
          <div
            className={`w-full h-full min-h-[220px] flex items-center justify-center p-6 text-center ${
              contrast === "activar"
                ? "bg-black"
                : "bg-[#F5F5F5]"
            }`}
          >
            <p
              className={`font-lexend font-bold leading-snug ${previewTextSize} ${
                contrast === "activar"
                  ? "text-white"
                  : "text-black"
              }`}
            >
              El texto se verá así. 1234567890! @#%&amp;*()_+-=
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-8">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="h-10 px-4 font-inter font-medium text-base bg-white border border-gray-300 text-black transition-colors rounded disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors whitespace-nowrap rounded disabled:opacity-50"
          style={{
            backgroundColor: "hsl(var(--navy))",
          }}
        >
          {saving ? "Guardando..." : "Guardar y continuar"}
        </button>
      </div>
    </div>
  );
}