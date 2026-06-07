import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import BotonAyuda from "../components/BotonAyuda";

export default function RegistroPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    primerNombre: "",
    segundoApellido: "",
    primerApellido: "",
    contrasena: "",
    correo: "",
    motivo: "",
  });

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setError(null);
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!form.primerNombre.trim()) {
      setError("Por favor ingrese su primer nombre.");
      return false;
    }
    if (!form.primerApellido.trim()) {
      setError("Por favor ingrese su primer apellido.");
      return false;
    }
    if (!form.segundoApellido.trim()) {
      setError("Por favor ingrese su segundo apellido.");
      return false;
    }
    if (!form.correo.trim()) {
      setError("Por favor ingrese su correo electrónico.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      setError("Por favor ingrese un correo válido.");
      return false;
    }
    if (form.contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }
    if (!form.motivo.trim()) {
      setError("Por favor ingrese el motivo de su registro.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Verificar si el email ya existe en access_requests
      const { data: existingRequest } = await supabase
        .from("access_requests")
        .select("email, status")
        .eq("email", form.correo.trim())
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          setError("Este correo ya tiene una solicitud pendiente de revisión.");
        } else {
          setError("Este correo ya está registrado.");
        }
        setLoading(false);
        return;
      }

      // 2. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.correo.trim(),
        password: form.contrasena.trim(),
      });

      if (authError) {
        console.error("Error de autenticación:", authError);
        if (authError.message.includes("already registered")) {
          setError("Este correo ya está registrado.");
        } else if (authError.message.includes("rate limit")) {
          setError("Demasiados intentos. Por favor intenta más tarde.");
        } else {
          setError(authError.message || "Error al crear la cuenta.");
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Error al crear la cuenta.");
        setLoading(false);
        return;
      }

      // 3. Guardar solicitud de acceso con password_hash
      const nombreCompleto = `${form.primerNombre} ${form.primerApellido} ${form.segundoApellido}`.trim();
      
      const { error: requestError } = await supabase
        .from("access_requests")
        .insert([
          {
            name: nombreCompleto,
            email: form.correo.trim(),
            reason: form.motivo.trim(),
            status: "pending",
          },
        ]);

      if (requestError) {
        console.error("Error al guardar solicitud:", requestError);
        setError("Error al procesar su solicitud.");
        setLoading(false);
        return;
      }

      // Limpiar formulario y mostrar modal
      setForm({
        primerNombre: "",
        segundoApellido: "",
        primerApellido: "",
        contrasena: "",
        correo: "",
        motivo: "",
      });

      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Ocurrió un error inesperado. Por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Accessible error notification */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {error && `Error: ${error}`}
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-10 md:py-14">
        <div className="w-full max-w-5xl bg-white border border-[#E0E0E0] px-6 sm:px-10 md:px-16 lg:px-24 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1E1E1E] mb-8 md:mb-10">
            Registro
          </h1>

          {error && (
            <div
              className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <FormField
                label="Primer nombre"
                name="primerNombre"
                value={form.primerNombre}
                placeholder="Ingrese su primer nombre"
                onChange={handleChange}
              />
              <FormField
                label="Primer apellido"
                name="primerApellido"
                value={form.primerApellido}
                placeholder="Ingrese su primer apellido"
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <FormField
                label="Segundo apellido"
                name="segundoApellido"
                value={form.segundoApellido}
                placeholder="Ingrese su segundo apellido"
                onChange={handleChange}
              />

              <FormField
                label="Contraseña"
                name="contrasena"
                type="password"
                value={form.contrasena}
                placeholder="Ingrese su contraseña"
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <FormField
                label="Correo electrónico"
                name="correo"
                type="email"
                value={form.correo}
                placeholder="Ingrese su correo"
                onChange={handleChange}
              />

              <div className="hidden md:block" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#1E1E1E] text-base font-normal leading-[140%]">
                ¿Motivo de su registro?
              </label>

              <textarea
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                placeholder="Escriba el motivo por el cual desea registrarse en la plataforma"
                rows={4}
                className="w-full border border-[#D9D9D9] bg-white px-4 py-3 text-[#1E1E1E] text-base font-normal placeholder:text-[#1E1E1E] resize-none focus:outline-none focus:border-[#0D2149] transition-colors"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-4 mt-2">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="w-full sm:w-auto px-10 py-3 bg-[#0D2149] text-white font-bold text-base hover:bg-[#162d5e] transition-colors focus:outline-none disabled:opacity-60"
              >
                Regresar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-10 py-3 bg-[#0D2149] text-white font-bold text-base hover:bg-[#162d5e] transition-colors focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                aria-busy={loading}
              >
                {loading ? "Registrando..." : "Registrarse"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-modal-title"
        >
          <div className="w-full max-w-md rounded-md bg-white px-6 py-7 shadow-xl">
            <h2 id="success-modal-title" className="mb-4 text-xl font-bold text-[#1E1E1E]">
              ¡Registro Exitoso!
            </h2>

            <p className="mb-4 text-base leading-relaxed text-[#444444]">
              Se ha enviado un correo de confirmación. 
              Por favor verifica tu correo para completar el registro.
            </p>

            <p className="mb-6 text-base leading-relaxed text-[#444444]">
              Tu solicitud de acceso quedó pendiente de revisión por el administrador.
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-md bg-[#0D2149] px-6 py-3 font-bold text-white transition-colors hover:bg-[#162d5e]"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function FormField({
  label,
  name,
  value,
  placeholder,
  type = "text",
  onChange,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={name}
        className="text-[#1E1E1E] text-base font-normal leading-[140%]"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full border border-[#D9D9D9] bg-white px-4 py-3 text-[#1E1E1E] text-base font-normal placeholder:text-[#1E1E1E] focus:outline-none focus:border-[#0D2149] transition-colors"
        required
      />
      <BotonAyuda modulo="Registro" />
    </div>
  );
}