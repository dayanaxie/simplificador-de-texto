import { useState } from "react";

type ProfileTab = "datos" | "password" | "preferencias";

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

  return (
    <main className="flex-1 bg-surface min-h-screen flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-[1008px]">
        <div className="bg-white border border-card-border">
          {/* Inner tab navigation */}
          <div
            className="flex overflow-x-auto border-b"
            style={{
              backgroundColor: "#002855", // Usa un valor hexadecimal temporalmente
              borderColor: "#002855",
            }}
          >
            {profileTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-col justify-end items-center px-4 h-[52px] shrink-0`}
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

          {/* Tab content */}
          <div className="p-6 md:p-10 min-h-[400px]">
            {activeTab === "datos" && (
              <DatosPersonalesTab
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                nombre={nombre}
                setNombre={setNombre}
                correo={correo}
                setCorreo={setCorreo}
              />
            )}
            {activeTab === "password" && <PasswordTab />}
            {activeTab === "preferencias" && <PreferenciasTab />}
          </div>
        </div>
      </div>
    </main>
  );
}

function DatosPersonalesTab({
  isEditing,
  setIsEditing,
  nombre,
  setNombre,
  correo,
  setCorreo,
}: {
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  nombre: string;
  setNombre: (v: string) => void;
  correo: string;
  setCorreo: (v: string) => void;
}) {
  const [draft, setDraft] = useState({ nombre, correo });

  const handleEdit = () => {
    setDraft({ nombre, correo });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    setNombre(draft.nombre);
    setCorreo(draft.correo);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div>
        <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-8">
          Editar Datos Personales
        </h2>

        <div className="flex flex-col gap-6 max-w-[317px]">
          <div className="flex flex-col gap-2">
            <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
              Nombre
            </label>
            <div className="border border-input-border bg-white px-4 py-3">
              <input
                type="text"
                value={draft.nombre}
                onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
              Correo electrónico
            </label>
            <div className="border border-input-border bg-white px-4 py-3">
              <input
                type="email"
                value={draft.correo}
                onChange={(e) => setDraft((d) => ({ ...d, correo: e.target.value }))}
                className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none"
              />
            </div>
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
            className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors whitespace-nowrap rounded"
            style={{ backgroundColor: "hsl(var(--navy))" }}
          >
            Guardar y continuar
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

      <div className="flex flex-col gap-6 max-w-[317px]">
        <div className="flex flex-col gap-2">
          <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
            Nombre
          </label>
          <div className="border border-input-border bg-white px-4 py-3">
            <span className="font-inter font-normal text-base text-[#1E1E1E] leading-none">
              {nombre}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
            Correo electrónico
          </label>
          <div className="border border-input-border bg-white px-4 py-3">
            <span className="font-inter font-normal text-base text-[#1E1E1E] leading-none">
              {correo}
            </span>
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

function PasswordTab() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const handleCancel = () => {
    setActual("");
    setNueva("");
    setConfirmar("");
  };

  return (
    <div className="relative">
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-2">
        Cambiar Contraseña
      </h2>
      <p className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%] mb-8 max-w-[600px]">
        Ingrese su contraseña actual y luego la nueva contraseña dos veces para confirmar.
      </p>

      <div className="flex flex-col gap-6 max-w-[317px]">
        <div className="flex flex-col gap-2">
          <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
            Contraseña actual
          </label>
          <div className="border border-input-border bg-white px-4 py-3">
            <input
              type="password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder="••••••••••••••"
              className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent placeholder:text-[#1E1E1E]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
            Nueva contraseña
          </label>
          <div className="border border-input-border bg-white px-4 py-3">
            <input
              type="password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              placeholder="••••••••••••••"
              className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent placeholder:text-[#1E1E1E]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
            Confirmar nueva contraseña
          </label>
          <div className="border border-input-border bg-white px-4 py-3">
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="••••••••••••••"
              className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent placeholder:text-[#1E1E1E]"
            />
          </div>
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
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors whitespace-nowrap rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Guardar y continuar
        </button>
      </div>
    </div>
  );
}

type FontSize = "pequeño" | "mediano" | "grande";
type Contrast = "activar" | "desactivar";

function PreferenciasTab() {
  const [fontSize, setFontSize] = useState<FontSize>("grande");
  const [contrast, setContrast] = useState<Contrast>("desactivar");

  const previewTextSize =
    fontSize === "pequeño" ? "text-sm" : fontSize === "mediano" ? "text-lg" : "text-2xl";

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-6">
        Preferencias
      </h2>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Left: controls */}
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-3">
            <span className="font-inter font-medium text-base text-[#1E1E1E]">
              Tamaño de letra
            </span>
            <div className="flex gap-0">
              {(["pequeño", "mediano", "grande"] as FontSize[]).map((size) => {
                const active = fontSize === size;
                const label = size.charAt(0).toUpperCase() + size.slice(1);
                return (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`h-10 px-5 font-inter font-normal text-base border border-[#D9D9D9] transition-colors first:rounded-none last:rounded-none
                      ${active ? "text-white" : "bg-white text-[#1E1E1E] hover:bg-gray-50"}`}
                    style={active ? { backgroundColor: "hsl(var(--navy))", borderColor: "hsl(var(--navy))" } : {}}
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
              {(["activar", "desactivar"] as Contrast[]).map((opt) => {
                const active = contrast === opt;
                const label = opt.charAt(0).toUpperCase() + opt.slice(1);
                return (
                  <button
                    key={opt}
                    onClick={() => setContrast(opt)}
                    className={`h-10 px-5 font-inter font-normal text-base border border-[#D9D9D9] transition-colors
                      ${active ? "text-white" : "bg-white text-[#1E1E1E] hover:bg-gray-50"}`}
                    style={active ? { backgroundColor: "hsl(var(--navy))", borderColor: "hsl(var(--navy))" } : {}}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: preview */}
        <div className="flex-1 max-w-[320px] md:max-w-[360px]">
          <div
            className={`w-full h-full min-h-[220px] bg-[#F5F5F5] flex items-center justify-center p-6 text-center
              ${contrast === "activar" ? "bg-black" : "bg-[#F5F5F5]"}`}
          >
            <p
              className={`font-lexend font-bold leading-snug
                ${previewTextSize}
                ${contrast === "activar" ? "text-white" : "text-black"}`}
            >
              El texto se verá así.{" "}
              1234567890!{" "}
              @#%&*()_+-=
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-8">
        <button
          onClick={() => { setFontSize("grande"); setContrast("desactivar"); }}
          className="h-10 px-4 font-inter font-medium text-base bg-white border border-gray-300 text-black transition-colors rounded"
        >
          Cancelar
        </button>
        <button
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors whitespace-nowrap rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Guardar y continuar
        </button>
      </div>
    </div>
  );
}