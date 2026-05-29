import { useState, useCallback, useRef } from "react";
import { simplifyText } from "../lib/simplifierApi";

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
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState("");

  const inputTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const wordCount = countWords(inputText);
  const isOverLimit = wordCount > WORD_LIMIT;

  const handlePaste = useCallback(async () => {
    setErrorMessage("");
    setSuccessMessage("");

    inputTextareaRef.current?.focus();

    try {
      if (!window.isSecureContext) {
        setErrorMessage(
          "El navegador bloqueó el botón Pegar. Haz clic en el cuadro y usa Ctrl + V."
        );
        return;
      }

      if (!navigator.clipboard?.readText) {
        setErrorMessage(
          "Este navegador no permite pegar con botón. Haz clic en el cuadro y usa Ctrl + V."
        );
        return;
      }

      const text = await navigator.clipboard.readText();

      if (!text.trim()) {
        setErrorMessage("El portapapeles está vacío.");
        return;
      }

      setInputText(text);
      setSuccessMessage("Texto pegado correctamente.");
    } catch (error) {
      console.error("Error al pegar:", error);
      setErrorMessage(
        "El navegador bloqueó el botón Pegar. Ya enfoqué el cuadro: presiona Ctrl + V."
      );
    }
  }, []);

  const handleSimplify = useCallback(async () => {
    if (!inputText.trim() || isOverLimit || isSimplifying) return;

    try {
      setIsSimplifying(true);
      setErrorMessage("");
      setSuccessMessage("");
      setSimplifiedText("");

      const result = await simplifyText(inputText.trim());

      setSimplifiedText(result.simplifiedText);
      setSuccessMessage("Texto simplificado correctamente.");
    } catch (error) {
      console.error("Error simplificando:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo simplificar el texto. Revisa que Ollama y el servidor estén encendidos."
      );
      setSuccessMessage("");
    } finally {
      setIsSimplifying(false);
    }
  }, [inputText, isOverLimit, isSimplifying]);

  const handleCopyResult = useCallback(async () => {
    if (!simplifiedText.trim()) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(simplifiedText);
        setSuccessMessage("Texto copiado correctamente.");
        return;
      }

      outputTextareaRef.current?.focus();
      outputTextareaRef.current?.select();

      const copied = document.execCommand("copy");

      if (!copied) {
        throw new Error("No se pudo copiar.");
      }

      setSuccessMessage("Texto copiado correctamente.");
    } catch (error) {
      console.error("Error al copiar:", error);
      setErrorMessage(
        "El navegador no permitió copiar. Selecciona el resultado y usa Ctrl + C."
      );
    }
  }, [simplifiedText]);

  const handleOpenReportModal = useCallback(() => {
    if (!simplifiedText.trim()) return;
    setErrorMessage("");
    setSuccessMessage("");
    setIsReportModalOpen(true);
  }, [simplifiedText]);

  const handleCancelReport = useCallback(() => {
    setIsReportModalOpen(false);
    setReportDescription("");
  }, []);

  const handleSendReport = useCallback(() => {
    if (!reportDescription.trim()) return;

    const reportData = {
      originalText: inputText,
      simplifiedText,
      description: reportDescription,
      createdAt: new Date().toISOString(),
    };

    console.log("Reporte enviado:", reportData);

    setIsReportModalOpen(false);
    setReportDescription("");
    setSuccessMessage("Reporte enviado correctamente.");
    setErrorMessage("");
  }, [inputText, simplifiedText, reportDescription]);

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
    setErrorMessage("");
    setSuccessMessage("");
    setReportDescription("");
    setIsReportModalOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 lg:px-[52px] py-6 sm:py-8 lg:py-[30px]">
        <div className="bg-white border border-[#E0E0E0] w-full p-5 sm:p-8 lg:p-10 flex flex-col gap-6 sm:gap-8">
          <section className="flex flex-col gap-5 sm:gap-6">
            <h1 className="font-lexend font-semibold text-2xl sm:text-3xl lg:text-[32px] leading-[150%] text-black">
              Simplificador de Texto
            </h1>

            <div className="flex flex-col gap-2">
              <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
                Ingrese un texto menor a {WORD_LIMIT} palabras
              </label>

              <textarea
                ref={inputTextareaRef}
                className="w-full min-h-[90px] sm:min-h-[100px] border border-[#D9D9D9] bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] leading-[140%] resize-y outline-none focus:border-[#002855] transition-colors"
                placeholder="Ingrese el texto original"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
              />

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
                    type="button"
                    onClick={handlePaste}
                    className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[33px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors whitespace-nowrap"
                  >
                    Pegar
                  </button>

                  <button
                    type="button"
                    onClick={handleSimplify}
                    disabled={!inputText.trim() || isOverLimit || isSimplifying}
                    className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[33px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSimplifying ? "Simplificando..." : "Simplificar"}
                  </button>
                </div>
              </div>

              {isOverLimit && (
                <p className="text-sm text-red-600 font-inter">
                  El texto supera el límite permitido de {WORD_LIMIT} palabras.
                </p>
              )}

              {errorMessage && (
                <p className="text-sm text-red-600 font-inter">
                  {errorMessage}
                </p>
              )}

              {successMessage && (
                <p className="text-sm text-green-600 font-inter">
                  {successMessage}
                </p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-5 sm:gap-6">
            <h2 className="font-lexend font-semibold text-2xl sm:text-3xl lg:text-[32px] leading-[150%] text-black">
              Resultado de la Simplificación
            </h2>

            <div className="flex flex-col gap-2">
              <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
                Texto simplificado
              </label>

              <textarea
                ref={outputTextareaRef}
                readOnly
                className="w-full min-h-[90px] sm:min-h-[105px] border border-[#D9D9D9] bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] leading-[140%] resize-y outline-none focus:border-[#002855] transition-colors"
                placeholder="Texto simplificado"
                value={simplifiedText}
              />
            </div>

            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={handleOpenReportModal}
                disabled={!simplifiedText}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Reportar resultado
              </button>

              <button
                type="button"
                onClick={handleCopyResult}
                disabled={!simplifiedText}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Copiar texto
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={!simplifiedText}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Exportar texto
              </button>

              <button
                type="button"
                onClick={handleNewSimplification}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors whitespace-nowrap"
              >
                Nueva simplificación
              </button>
            </div>
          </section>

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

      {isReportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCancelReport}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-inter font-semibold text-xl text-black mb-5">
              Ingrese el motivo del reporte
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="font-inter font-normal text-base text-[#1E1E1E]">
                Descripción
              </label>

              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Escriba su descripción aquí..."
                className="w-full min-h-[95px] border border-[#D9D9D9] rounded px-4 py-3 font-inter text-base text-[#1E1E1E] resize-none outline-none focus:border-[#002855] transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleCancelReport}
                className="px-6 py-2 font-inter font-normal text-sm text-[#1E1E1E] border border-[#D9D9D9] bg-white hover:bg-[#F5F5F5] transition-colors rounded"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSendReport}
                disabled={!reportDescription.trim()}
                className="px-6 py-2 font-inter font-medium text-sm text-white bg-[#002855] hover:bg-[#003d80] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}