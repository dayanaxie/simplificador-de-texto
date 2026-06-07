import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function RestablecerContrasena() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [codeSent, setCodeSent] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSendCode = async () => {
    setError(null);
    setSuccess(null);

    const emailLimpio = email.trim().toLowerCase();

    if (!emailLimpio) {
      setError("Ingrese su correo electrónico");
      return;
    }

    setLoadingSend(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailLimpio,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        throw error;
      }

      setCodeSent(true);
      setSuccess(
        "Si el correo está registrado, se enviará un código de verificación."
      );
    } catch (err) {
      console.error("Error al enviar código:", err);

      setError(
        "No se pudo enviar el código. Verifique el correo o inténtelo nuevamente."
      );
    } finally {
      setLoadingSend(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    setSuccess(null);

    const emailLimpio = email.trim().toLowerCase();
    const codeLimpio = code.trim();

    if (!emailLimpio) {
      setError("Ingrese su correo electrónico");
      return;
    }

    if (!codeLimpio) {
      setError("Ingrese el código de verificación");
      return;
    }

    if (codeLimpio.length < 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    setLoadingVerify(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: emailLimpio,
        token: codeLimpio,
        type: "email",
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        setError("No se pudo iniciar la sesión de recuperación");
        return;
      }

      navigate("/changePassword");
    } catch (err) {
      console.error("Error al verificar código:", err);

      setError("El código no es válido o ya venció.");
    } finally {
      setLoadingVerify(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-[845px] bg-white border border-[#E0E0E0] rounded-sm shadow-sm">
          <div className="px-6 sm:px-12 md:px-16 py-10 md:py-14">
            <h1
              className="text-3xl sm:text-[32px] font-semibold text-black leading-[150%] mb-4"
              style={{ fontFamily: "Lexend, sans-serif" }}
            >
              Restablecer Contraseña
            </h1>

            <p
              className="text-[#002855] font-medium text-sm sm:text-base leading-snug mb-8"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Ingrese el correo vinculado a la cuenta y presione el botón de
              enviar. Luego ingrese el código de verificación que llegará a su
              correo.
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

            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
              <div className="flex flex-col gap-2 flex-1 max-w-[346px]">
                <label
                  htmlFor="email"
                  className="text-[#1E1E1E] text-base font-normal leading-[140%]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Correo electrónico
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo@gmail.com"
                  disabled={loadingSend || loadingVerify}
                  className="px-4 py-3 border border-[#D9D9D9] bg-white text-[#1E1E1E] text-base font-normal outline-none focus:border-[#002855] transition-colors placeholder:text-[#1E1E1E]/60 disabled:opacity-50"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={loadingSend || loadingVerify}
                className="h-[39px] px-4 bg-[#002855] text-white text-sm font-medium hover:bg-[#002855]/90 transition-colors whitespace-nowrap disabled:opacity-50"
                style={{ fontFamily: "Inter, sans-serif", minWidth: "100px" }}
              >
                {loadingSend
                  ? "Enviando..."
                  : codeSent
                    ? "Reenviar"
                    : "Enviar"}
              </button>
            </div>

            <div className="flex flex-col gap-2 max-w-[346px] mb-10">
              <label
                htmlFor="code"
                className="text-[#1E1E1E] text-base font-normal leading-[140%]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Ingrese código de verificación
              </label>

              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                placeholder="Código de verificación"
                disabled={loadingSend || loadingVerify}
                className="px-4 py-3 border border-[#D9D9D9] bg-white text-[#1E1E1E] text-base font-normal outline-none focus:border-[#002855] transition-colors placeholder:text-[#1E1E1E]/60 disabled:opacity-50"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </div>

            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                disabled={loadingSend || loadingVerify}
                className="px-4 py-2 text-black text-base font-medium hover:text-[#002855] transition-colors disabled:opacity-50"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={loadingVerify || loadingSend}
                className="h-[39px] px-6 bg-[#002855] text-white text-lg font-semibold hover:bg-[#002855]/90 transition-colors disabled:opacity-50"
                style={{ fontFamily: "Lexend, sans-serif", minWidth: "146px" }}
              >
                {loadingVerify ? "Verificando..." : "Verificar"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}