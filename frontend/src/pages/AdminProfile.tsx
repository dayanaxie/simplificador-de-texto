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
                userId={userId}
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
  userId,
  email,
  anunciar,
}: {
  userId: number | null;
  email: string;
  anunciar: (msg: string, error?: boolean) => void;
}) {
  const [actual, setActual]       = useState("");
  const [nueva, setNueva]         = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores]     = useState<Record<string, string>>({});

  const handleCancel = () => {
    setActual(""); setNueva(""); setConfirmar(""); setErrores({});
  };

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!actual.trim())      e.actual    = "Ingresá tu contraseña actual.";
    if (!nueva.trim())       e.nueva     = "Ingresá la nueva contraseña.";
    if (nueva.length < 8)    e.nueva     = "Mínimo 8 caracteres.";
    if (nueva !== confirmar) e.confirmar = "Las contraseñas no coinciden.";
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setGuardando(true);

    // Verificar que la contraseña actual sea correcta consultando la tabla users
    const { data: userCheck, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .eq("password_hash", actual)
      .maybeSingle();

    if (checkError || !userCheck) {
      setErrores({ actual: "La contraseña actual es incorrecta." });
      setGuardando(false);
      return;
    }

    // Actualizar la contraseña en la tabla users
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: nueva })
      .eq("id", userId);

    if (updateError) {
      console.error(updateError);
      anunciar("Error al actualizar la contraseña.", true);
    } else {
      setActual(""); setNueva(""); setConfirmar(""); setErrores({});
      anunciar("Contraseña actualizada correctamente.");
    }
    setGuardando(false);
  };

  const inputCls = (campo: string) =>
    "border bg-white px-4 py-3 " +
    (errores[campo] ? "border-red-400" : "border-input-border");

  return (
    <div className="relative">
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-2">
        Cambiar Contraseña
      </h2>
      <p className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%] mb-8 max-w-[600px]">
        Ingrese su contraseña actual y luego la nueva contraseña dos veces para confirmar.
      </p>

      <div className="flex flex-col gap-6 max-w-[317px]">
        {[
          { id: "pass-actual",    label: "Contraseña actual",          val: actual,    set: setActual,    campo: "actual" },
          { id: "pass-nueva",     label: "Nueva contraseña",           val: nueva,     set: setNueva,     campo: "nueva" },
          { id: "pass-confirmar", label: "Confirmar nueva contraseña", val: confirmar, set: setConfirmar, campo: "confirmar" },
        ].map(({ id, label, val, set, campo }) => (
          <div key={id} className="flex flex-col gap-2">
            <label htmlFor={id} className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
              {label}
            </label>
            <div className={inputCls(campo)}>
              <input
                id={id}
                type="password"
                value={val}
                onChange={(e) => {
                  set(e.target.value);
                  setErrores((prev) => ({ ...prev, [campo]: "" }));
                }}
                placeholder="••••••••••••••"
                className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent placeholder:text-[#1E1E1E]"
              />
            </div>
            {errores[campo] && (
              <p role="alert" className="text-xs text-red-600 font-inter">{errores[campo]}</p>
            )}
          </div>
        ))}
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
          {guardando ? "Actualizando..." : "Guardar y continuar"}
        </button>
      </div>
    </div>
  );
}
