import { useState } from "react";
import { Link } from "react-router-dom";

export default function RegistroPage() {
  const [form, setForm] = useState({
    primerNombre: "",
    segundoApellido: "",
    primerApellido: "",
    contrasena: "",
    correo: "",
    motivo: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: handle registration submission
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
    
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 md:py-14">
        <div className="w-full max-w-5xl bg-white border border-[#E0E0E0] px-6 sm:px-10 md:px-16 lg:px-24 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1E1E1E] mb-8 md:mb-10">
            Registro
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            {/* Row 1: Primer nombre + Segundo apellido */}
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

            {/* Row 2: Primer apellido + Contraseña */}
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

            {/* Row 3: Correo electrónico (left column only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <FormField
                label="Correo electrónico"
                name="correo"
                type="email"
                value={form.correo}
                placeholder="Ingrese su correo"
                onChange={handleChange}
              />
              {/* Empty right column on desktop */}
              <div className="hidden md:block" />
            </div>

            {/* Row 4: Motivo (full width) */}
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

            {/* Buttons */}
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
                className="w-full sm:w-auto px-10 py-3 bg-[#0D2149] text-white font-bold text-base hover:bg-[#162d5e] transition-colors focus:outline-none"
              >
                Registrarse
              </button>
            </div>
          </form>
        </div>
      </main>
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
      <label htmlFor={name} className="text-[#1E1E1E] text-base font-normal leading-[140%]">
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
