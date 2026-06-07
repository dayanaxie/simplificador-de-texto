import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [checkingSession, setCheckingSession] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/restablecer-contrasena");
        return;
      }

      setCheckingSession(false);
    };

    void checkSession();
  }, [navigate]);

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    if (!password) {
      setError("Ingrese la nueva contraseña");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!confirm) {
      setError("Confirme la nueva contraseña");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setPassword("");
      setConfirm("");
      setShowPassword(false);
      setShowConfirm(false);

      setSuccess("Contraseña actualizada correctamente.");

      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);

      const authError = err as {
        message?: string;
        code?: string;
      };

      const message = authError.message?.toLowerCase() ?? "";
      const code = authError.code?.toLowerCase() ?? "";

      if (
        code === "weak_password" ||
        message.includes("weak password") ||
        message.includes("password should") ||
        message.includes("password must")
      ) {
        setError("La contraseña no cumple con los requisitos de seguridad");
      } else if (
        code === "same_password" ||
        message.includes("same password")
      ) {
        setError("La nueva contraseña debe ser diferente de la anterior");
      } else {
        setError("No se pudo actualizar la contraseña");
      }
    } finally {
      setSaving(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <p className="text-[#1E1E1E]">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white border border-[#E0E0E0] w-full max-w-3xl px-8 sm:px-14 py-12 sm:py-14">
          <h1
            className="text-[#000000] text-3xl sm:text-4xl font-semibold mb-4"
            style={{ fontFamily: "Lexend, sans-serif" }}
          >
            Cambiar Contraseña
          </h1>

          <p className="text-[#002855] font-inter text-base font-medium mb-10">
            Crea una contraseña nueva que no utilices en otros sitios web.
          </p>

          {error && (
            <div
              className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
              role="status"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-[#1E1E1E] font-inter text-base font-normal"
              >
                Crear una nueva contraseña
              </label>

              <div className="relative w-full sm:w-[346px]">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese nueva contraseña"
                  autoComplete="new-password"
                  minLength={8}
                  disabled={saving}
                  className="w-full px-4 py-3 pr-24 border border-[#D9D9D9] bg-white text-[#1E1E1E] font-inter text-base outline-none focus:border-[#002855] transition-colors placeholder:text-[#1E1E1E] disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={saving}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#002855] hover:underline disabled:opacity-50"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirm"
                className="text-[#1E1E1E] font-inter text-base font-normal"
              >
                Confirmación de contraseña
              </label>

              <div className="relative w-full sm:w-[346px]">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Ingrese la confirmación"
                  autoComplete="new-password"
                  minLength={8}
                  disabled={saving}
                  className="w-full px-4 py-3 pr-24 border border-[#D9D9D9] bg-white text-[#1E1E1E] font-inter text-base outline-none focus:border-[#002855] transition-colors placeholder:text-[#1E1E1E] disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                  disabled={saving}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#002855] hover:underline disabled:opacity-50"
                >
                  {showConfirm ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-8 mt-4">
              <button
                type="button"
                onClick={() => {
                  void supabase.auth.signOut();
                  navigate("/");
                }}
                disabled={saving}
                className="text-[#1E1E1E] font-inter text-base font-medium hover:opacity-70 transition-opacity disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-[#002855] text-white px-8 py-2.5 font-semibold text-xl hover:bg-[#003a7a] transition-colors disabled:opacity-50"
                style={{ fontFamily: "Lexend, sans-serif", minWidth: "186px" }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}