import { useState } from "react";

type TextosTab = "guardados" | "edicion" | "historial" | "valoraciones";

const textosTabs: { id: TextosTab; label: string }[] = [
  { id: "guardados", label: "Textos guardados" },
  { id: "edicion", label: "Edición" },
  { id: "historial", label: "Historial de versiones" },
  { id: "valoraciones", label: "Valoraciones" },
];

export default function TextosGuardados() {
  const [activeTab, setActiveTab] = useState<TextosTab>("guardados");

  return (
    <main className="flex-1 bg-surface min-h-screen flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-[1440px]">
        <div className="bg-white border border-card-border">
          {/* Navegación interna */}
          <div
            className="flex overflow-x-auto border-b"
            style={{
              backgroundColor: "#002855",
              borderColor: "#002855",
            }}
          >
            {textosTabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
            {activeTab === "guardados" && (
              <TextosGuardadosTab setActiveTab={setActiveTab} />
            )}

            {activeTab === "edicion" && <EdicionTab />}

            {activeTab === "historial" && <HistorialTab />}

            {activeTab === "valoraciones" && <ValoracionesTab />}
          </div>
        </div>
      </div>
    </main>
  );
}

function TextosGuardadosTab({
  setActiveTab,
}: {
  setActiveTab: (tab: TextosTab) => void;
}) {
  const textos = [
    {
      titulo: "Contrato Bancario",
      categoria: "Contratos",
      fecha: "20/04/2026",
    },
    {
      titulo: "Hipoteca",
      categoria: "Hipoteca",
      fecha: "18/04/2026",
    },
    {
      titulo: "Educación Financiera",
      categoria: "Educación",
      fecha: "05/03/2026",
    },
  ];

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-8">
        Textos Guardados
      </h2>

      <div className="flex items-center gap-4 mb-10 max-w-[700px]">
        <div className="border border-input-border bg-white px-4 py-3 flex-1">
          <input
            type="text"
            placeholder="Inserte el nombre del texto simplificado"
            className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent"
          />
        </div>

        <button
          className="text-white font-inter font-medium text-base px-8 h-12 flex items-center justify-center transition-colors rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Buscar
        </button>
      </div>

      <table className="w-full text-left border-collapse font-inter text-base text-[#1E1E1E]">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-3 font-medium">Título</th>
            <th className="py-3 font-medium">Categoría</th>
            <th className="py-3 font-medium">Fecha</th>
            <th className="py-3 font-medium text-center">Editar</th>
            <th className="py-3 font-medium text-center">Eliminar</th>
          </tr>
        </thead>

        <tbody>
          {textos.map((texto, index) => (
            <tr key={index} className="border-b border-gray-300">
              <td className="py-3">{texto.titulo}</td>
              <td className="py-3">{texto.categoria}</td>
              <td className="py-3">{texto.fecha}</td>
              <td className="py-3 text-center">
                <button
                  onClick={() => setActiveTab("edicion")}
                  className="text-xl text-black"
                  title="Editar"
                >
                  ✎
                </button>
              </td>
              <td className="py-3 text-center">
                <button className="text-xl text-black" title="Eliminar">
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EdicionTab() {
  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-2">
        Texto: Contrato Bancario
      </h2>

      <h3 className="font-lexend font-semibold text-xl md:text-2xl leading-[150%] text-black mb-2">
        Simplificador de Texto
      </h3>

      <p className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%] mb-2">
        Ingrese un texto menor a 500 palabras
      </p>

      <div className="border border-input-border bg-white px-4 py-3 mb-4">
        <textarea
          className="w-full h-24 font-inter font-normal text-base text-[#1E1E1E] leading-[140%] outline-none resize-none bg-transparent"
          defaultValue="El contrato bancario es un acuerdo legal entre una entidad financiera y un cliente, mediante el cual se establecen derechos y obligaciones para ambas partes. En este contrato se detallan aspectos como la apertura de cuentas, uso de tarjetas, tasas de interés, comisiones, plazos de pago y condiciones para el manejo de productos financieros."
        />
      </div>

      <div className="flex justify-end gap-2 mb-8">
        <button
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Pegar
        </button>

        <button
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Simplificar
        </button>
      </div>

      <h3 className="font-lexend font-semibold text-xl md:text-2xl leading-[150%] text-black mb-2">
        Resultado de la Simplificación
      </h3>

      <p className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%] mb-2">
        Texto simplificado
      </p>

      <div className="border border-input-border bg-white px-4 py-3 mb-6">
        <textarea
          className="w-full h-24 font-inter font-normal text-base text-[#1E1E1E] leading-[140%] outline-none resize-none bg-transparent"
          defaultValue="Un contrato bancario es un acuerdo entre el banco y una persona. Ahí se explica qué puede hacer el cliente y qué reglas debe cumplir. También indica cosas como intereses, pagos, comisiones y uso de servicios del banco."
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Exportar texto
        </button>

        <button
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Guardar simplificación
        </button>
      </div>
    </div>
  );
}

function HistorialTab() {
  const versiones = [
    {
      version: "Versión 1",
      creacion: "20/04/2026",
      ultimaEdicion: "23/04/2026",
    },
    {
      version: "Versión 2",
      creacion: "18/04/2026",
      ultimaEdicion: "25/04/2026",
    },
    {
      version: "Versión 3",
      creacion: "05/03/2026",
      ultimaEdicion: "19/05/2026",
    },
  ];

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-12">
        Texto: Contrato Bancario
      </h2>

      <table className="w-full text-left border-collapse font-inter text-base text-[#1E1E1E]">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-3 font-medium">Versión #</th>
            <th className="py-3 font-medium">Fecha Creación</th>
            <th className="py-3 font-medium">Fecha última edición</th>
          </tr>
        </thead>

        <tbody>
          {versiones.map((item, index) => (
            <tr key={index} className="border-b border-gray-300">
              <td className="py-3">{item.version}</td>
              <td className="py-3">{item.creacion}</td>
              <td className="py-3">{item.ultimaEdicion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ValoracionesTab() {
  const valoraciones = [
    {
      titulo: "Versión 1",
      fecha: "20/04/2026",
      estrellas: "★★★★★",
    },
    {
      titulo: "Versión 2",
      fecha: "18/04/2026",
      estrellas: "★★★☆☆",
    },
    {
      titulo: "Versión 3",
      fecha: "05/03/2026",
      estrellas: "★★☆☆☆",
    },
  ];

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-12">
        Texto: Contrato Bancario
      </h2>

      <table className="w-full text-left border-collapse font-inter text-base text-[#1E1E1E]">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-3 font-medium">Título</th>
            <th className="py-3 font-medium">Fecha</th>
            <th className="py-3 font-medium text-center">Valoración</th>
          </tr>
        </thead>

        <tbody>
          {valoraciones.map((item, index) => (
            <tr key={index} className="border-b border-gray-300">
              <td className="py-3">{item.titulo}</td>
              <td className="py-3">{item.fecha}</td>
              <td className="py-3 text-center tracking-[2px]">
                {item.estrellas}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
