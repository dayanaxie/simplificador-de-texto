import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RestablecerContrasena() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-[845px] bg-white border border-[#E0E0E0] rounded-sm shadow-sm">
          <div className="px-6 sm:px-12 md:px-16 py-10 md:py-14">
            {/* Title */}
            <h1
              className="text-3xl sm:text-[32px] font-semibold text-black leading-[150%] mb-4"
              style={{ fontFamily: "Lexend, sans-serif" }}
            >
              Restablecer Contraseña
            </h1>

            {/* Description */}
            <p
              className="text-[#002855] font-medium text-sm sm:text-base leading-snug mb-8"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Ingrese el correo vinculado a la cuenta y presioné el boton de
              enviar. E ingrese el código de verificación que llegué a su
              correo.
            </p>

            {/* Email row */}
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
                  className="px-4 py-3 border border-[#D9D9D9] bg-white text-[#1E1E1E] text-base font-normal outline-none focus:border-[#002855] transition-colors placeholder:text-[#1E1E1E]/60"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>

              <button
                type="button"
                className="h-[34px] px-4 bg-[#002855] text-white text-sm font-medium hover:bg-[#002855]/90 transition-colors whitespace-nowrap"
                style={{ fontFamily: "Inter, sans-serif", minWidth: "100px" }}
              >
                Enviar
              </button>
            </div>

            {/* Verification code */}
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
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Código de verificación"
                className="px-4 py-3 border border-[#D9D9D9] bg-white text-[#1E1E1E] text-base font-normal outline-none focus:border-[#002855] transition-colors placeholder:text-[#1E1E1E]/60"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => {navigate("/")}}
                className="px-4 py-2 text-black text-base font-medium hover:text-[#002855] transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {navigate("/changePassword")}}
                className="h-[39px] px-6 bg-[#002855] text-white text-lg font-semibold hover:bg-[#002855]/90 transition-colors"
                style={{ fontFamily: "Lexend, sans-serif", minWidth: "146px" }}
              >
                Verificar
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavTab({
  label,
  selected,
}: {
  label: string;
  selected: boolean;
}) {
  return (
    <div
      className="relative flex flex-col justify-end items-center bg-[#002855] cursor-pointer"
      style={{ height: "46px", minWidth: selected ? "161px" : "auto", paddingBottom: 0 }}
    >
      <div className="flex items-center justify-center px-4 h-full gap-1">
        <span
          className="text-white text-center font-medium text-xl sm:text-2xl leading-5 tracking-[0.1px] whitespace-nowrap"
          style={{ fontFamily: "Roboto, sans-serif" }}
        >
          {label}
        </span>
      </div>
      {selected && (
        <div className="absolute bottom-0 left-2 right-2 h-[3px] rounded-t-full bg-white" />
      )}
    </div>
  );
}