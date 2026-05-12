import { useState, useCallback } from "react";
import { Link } from "react-router-dom";

const WORD_LIMIT = 500;

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

const announcements = [
  {
    title: "Nueva Actualización",
    content:
      "El equipo está trabajando en una nueva actualización, donde los usuarios podrán ingresar documentos PDFs para simplificar.",
    validity: "15 de marzo de 2025 al 27 de marzo de 2025",
  },
  {
    title: "Aumento de límite de palabras por simplificación.",
    content:
      "Luego de varios reportes de parte de los usuarios, se tomó la decisión de aumentar el límite de palabras por simplificación a 2000 palabras.",
    validity: "01 de marzo de 2025 al 27 de marzo de 2025",
  },
];

export default function Index() {
  const [inputText, setInputText] = useState("");
  const [simplifiedText, setSimplifiedText] = useState("");
  const [isSimplifying, setIsSimplifying] = useState(false);

  const wordCount = countWords(inputText);
  const isOverLimit = wordCount > WORD_LIMIT;

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch {
      // clipboard access denied
    }
  }, []);

  const handleSimplify = useCallback(() => {
    if (!inputText.trim() || isOverLimit) return;
    setIsSimplifying(true);
    setTimeout(() => {
      setSimplifiedText(inputText);
      setIsSimplifying(false);
    }, 800);
  }, [inputText, isOverLimit]);

  const handleExport = useCallback(() => {
    if (!simplifiedText) return;
    const blob = new Blob([simplifiedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "texto-simplificado.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [simplifiedText]);

  const handleNewSimplification = useCallback(() => {
    setInputText("");
    setSimplifiedText("");
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      
      {/* Main content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 lg:px-[52px] py-6 sm:py-8 lg:py-[30px]">
        <div className="bg-white border border-[#E0E0E0] w-full p-5 sm:p-8 lg:p-10 flex flex-col gap-6 sm:gap-8">

          {/* Text Simplifier Section */}
          <section className="flex flex-col gap-5 sm:gap-6">
            <h1 className="font-lexend font-semibold text-2xl sm:text-3xl lg:text-[32px] leading-[150%] text-black">
              Simplificador de Texto
            </h1>

            {/* Input field */}
            <div className="flex flex-col gap-2">
              <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
                Ingrese un texto menor a {WORD_LIMIT} palabras
              </label>
              <textarea
                className="w-full min-h-[90px] sm:min-h-[100px] border border-[#D9D9D9] bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] leading-[140%] resize-y outline-none focus:border-[#002855] transition-colors"
                placeholder="Ingrese el texto original"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />

              {/* Word counter + action buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
                <span
                  className={`font-lexend font-normal text-[13px] leading-[100%] text-right sm:text-left ${
                    isOverLimit ? "text-red-600" : "text-black"
                  }`}
                >
                  {wordCount}/{WORD_LIMIT} palabras
                </span>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handlePaste}
                    className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[33px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors whitespace-nowrap"
                  >
                    Pegar
                  </button>
                  <button
                    onClick={handleSimplify}
                    disabled={!inputText.trim() || isOverLimit || isSimplifying}
                    className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[33px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSimplifying ? "Simplificando..." : "Simplificar"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Result Section */}
          <section className="flex flex-col gap-5 sm:gap-6">
            <h2 className="font-lexend font-semibold text-2xl sm:text-3xl lg:text-[32px] leading-[150%] text-black">
              Resultado de la Simplificación
            </h2>

            {/* Output field */}
            <div className="flex flex-col gap-2">
              <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
                Texto simplificado
              </label>
              <div className="w-full min-h-[90px] sm:min-h-[105px] border border-[#D9D9D9] bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] leading-[140%]">
                {simplifiedText || (
                  <span className="text-[#1E1E1E]/40">Texto simplificado</span>
                )}
              </div>
            </div>

            {/* Export / New simplification buttons */}
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={handleExport}
                disabled={!simplifiedText}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Exportar texto
              </button>
              <button
                onClick={handleNewSimplification}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors whitespace-nowrap"
              >
                Nueva simplificación
              </button>
            </div>
          </section>

          {/* Announcements Section */}
          <section className="flex flex-col gap-4 sm:gap-5">
            <h2 className="font-lexend font-semibold text-2xl sm:text-3xl lg:text-[32px] leading-[150%] text-black">
              Anuncios
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.map((ann, i) => (
                <div
                  key={i}
                  className="border-2 border-[#002855] bg-[#F5F5F5] p-4"
                >
                  <p className="font-lexend text-[15px] leading-[150%] text-black">
                    <span className="font-bold">Título</span>
                    <span className="font-light">: {ann.title}</span>
                    <br />
                    <span className="font-bold">Contenido</span>
                    <span className="font-light">: {ann.content}</span>
                    <br />
                    <span className="font-bold">Vigencia del anuncio</span>
                    <span className="font-light">: {ann.validity}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
