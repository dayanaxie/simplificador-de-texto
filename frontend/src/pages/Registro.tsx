import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.primerNombre ||
      !form.primerApellido ||
      !form.segundoApellido ||
      !form.correo ||
      !form.contrasena ||
      !form.motivo
    ) {
      alert("Por favor complete todos los campos.");
      return;
    }

    setLoading(true);

    const nombreCompleto =
      `${form.primerNombre} ${form.primerApellido} ${form.segundoApellido}`.trim();

    const { data, error } = await supabase
      .from("access_requests")
        .insert([
          {
            name: nombreCompleto,
            email: form.correo,
            password_hash: form.contrasena,
            reason: form.motivo,
            status: "pending",
          },
        ])
      .select();

    setLoading(false);

    if (error) {
      console.error("Error al registrar:", error);
      alert("Error al registrar: " + error.message);
      return;
    }

    console.log("Usuario registrado:", data);

    setForm({
      primerNombre: "",
      segundoApellido: "",
      primerApellido: "",
      contrasena: "",
      correo: "",
      motivo: "",
    });

    setShowSuccessModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-10 md:py-14">
        <div className="w-full max-w-5xl bg-white border border-[#E0E0E0] px-6 sm:px-10 md:px-16 lg:px-24 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1E1E1E] mb-8 md:mb-10">
            Registro
          </h1>

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
                label="Segundo apellido"
                name="segundoApellido"
                value={form.segundoApellido}
                placeholder="Ingrese su segundo apellido"
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <FormField
                label="Primer apellido"
                name="primerApellido"
                value={form.primerApellido}
                placeholder="Ingrese su primer apellido"
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
                className="w-full sm:w-auto px-10 py-3 bg-[#0D2149] text-white font-bold text-base hover:bg-[#162d5e] transition-colors focus:outline-none"
              >
                Regresar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-10 py-3 bg-[#0D2149] text-white font-bold text-base hover:bg-[#162d5e] transition-colors focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Registrando..." : "Registrarse"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-md bg-white px-6 py-7 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-[#1E1E1E]">
              ¡Atención!
            </h2>

            <p className="mb-6 text-base leading-relaxed text-[#444444]">
              Su solicitud fue registrada correctamente y quedó pendiente de
              revisión.
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
      />
    </div>
  );
}