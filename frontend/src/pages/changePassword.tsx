import { useState } from "react";
import { Link } from "react-router-dom";

export default function Index() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white border border-[#E0E0E0] w-full max-w-3xl px-8 sm:px-14 py-12 sm:py-14">
          <h1
            className="text-[#000000] text-3xl sm:text-4xl font-semibold mb-4"
            style={{ fontFamily: "Lexend, sans-serif" }}
          >
            Cambiar Contraseña
          </h1>

          <p className="text-[#002855] font-inter text-base font-medium mb-10">
            Crea una contraseña nueva que no utilices en otros sitios web
          </p>

          <form onSubmit={handleSave} className="flex flex-col gap-8">
            {/* New password field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-[#1E1E1E] font-inter text-base font-normal"
              >
                Crear una nueva contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese nueva contraseña"
                className="w-full sm:w-[346px] px-4 py-3 border border-[#D9D9D9] bg-white text-[#1E1E1E] font-inter text-base outline-none focus:border-[#002855] transition-colors placeholder:text-[#1E1E1E]"
              />
            </div>

            {/* Confirm password field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirm"
                className="text-[#1E1E1E] font-inter text-base font-normal"
              >
                Confirmación de contraseña
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ingrese la confirmación"
                className="w-full sm:w-[346px] px-4 py-3 border border-[#D9D9D9] bg-white text-[#1E1E1E] font-inter text-base outline-none focus:border-[#002855] transition-colors placeholder:text-[#1E1E1E]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-8 mt-4">
              <button
                type="button"
                className="text-[#1E1E1E] font-inter text-base font-medium hover:opacity-70 transition-opacity"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#002855] text-white px-8 py-2.5 font-semibold text-xl hover:bg-[#003a7a] transition-colors"
                style={{ fontFamily: "Lexend, sans-serif", minWidth: "186px" }}
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
