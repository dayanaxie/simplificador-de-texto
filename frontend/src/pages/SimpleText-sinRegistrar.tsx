import { useState, useCallback, useRef, useEffect } from "react";
import { simplifyText } from "../lib/simplifierApi";
import { supabase } from "../lib/supabaseClient";

const WORD_LIMIT = 500;

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

interface Anuncio {
  id: number;
  title: string;
  content: string;
  start_date: string;
  end_date: string;
}

const formatearFecha = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export default function Index() {
  const [inputText, setInputText] = useState("");
  const [simplifiedText, setSimplifiedText] = useState("");
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);

  const inputTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const wordCount = countWords(inputText);
  const isOverLimit = wordCount > WORD_LIMIT;

  // ── Carga de anuncios vigentes ────────────────────────────────────────────
  useEffect(() => {
    const cargarAnuncios = async () => {
      const hoy = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .lte("start_date", hoy)
        .gte("end_date", hoy)
        .order("start_date", { ascending: false });
      if (!error) setAnuncios(data ?? []);
    };
    cargarAnuncios();
  }, []);

  const handlePaste = useCallback(async () => {
    setErrorMessage("");
    setSuccessMessage("");
    inputTextareaRef.current?.focus();
    try {
      if (!window.isSecureContext) {
        setErrorMessage("El navegador bloqueó el botón Pegar. Haz clic en el cuadro y usa Ctrl + V.");
        return;
      }
      if (!navigator.clipboard?.readText) {
        setErrorMessage("Este navegador no permite pegar con botón. Haz clic en el cuadro y usa Ctrl + V.");
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { setErrorMessage("El portapapeles está vacío."); return; }
      setInputText(text);
      setSuccessMessage("Texto pegado correctamente.");
    } catch (error) {
      console.error("Error al pegar:", error);
      setErrorMessage("El navegador bloqueó el botón Pegar. Ya enfoqué el cuadro: presiona Ctrl + V.");
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
      setErrorMessage(error instanceof Error ? error.message : "No se pudo simplificar el texto.");
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
      if (!copied) throw new Error("No se pudo copiar.");
      setSuccessMessage("Texto copiado correctamente.");
    } catch (error) {
      console.error("Error al copiar:", error);
      setErrorMessage("El navegador no permitió copiar. Selecciona el resultado y usa Ctrl + C.");
    }
  }, [simplifiedText]);

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
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 lg:px-[52px] py-6 sm:py-8 lg:py-[30px]">
        <div className="bg-white border border-[#E0E0E0] w-full p-5 sm:p-8 lg:p-10 flex flex-col gap-6 sm:gap-8">

          {/* Simplificador */}
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
                onChange={(e) => { setInputText(e.target.value); setErrorMessage(""); setSuccessMessage(""); }}
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
                <span className={`font-lexend font-normal text-[13px] leading-[100%] text-right sm:text-left ${isOverLimit ? "text-red-600" : "text-black"}`}>
                  {wordCount}/{WORD_LIMIT} palabras
                </span>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={handlePaste}
                    className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[33px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors whitespace-nowrap">
                    Pegar
                  </button>
                  <button type="button" onClick={handleSimplify}
                    disabled={!inputText.trim() || isOverLimit || isSimplifying}
                    className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[33px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                    {isSimplifying ? "Simplificando..." : "Simplificar"}
                  </button>
                </div>
              </div>
              {isOverLimit && <p className="text-sm text-red-600 font-inter">El texto supera el límite permitido de {WORD_LIMIT} palabras.</p>}
              {errorMessage && <p className="text-sm text-red-600 font-inter">{errorMessage}</p>}
              {successMessage && <p className="text-sm text-green-600 font-inter">{successMessage}</p>}
            </div>
          </section>

          {/* Resultado */}
          <section className="flex flex-col gap-5 sm:gap-6">
            <h2 className="font-lexend font-semibold text-2xl sm:text-3xl lg:text-[32px] leading-[150%] text-black">
              Resultado de la Simplificación
            </h2>
            <div className="flex flex-col gap-2">
              <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">Texto simplificado</label>
              <textarea ref={outputTextareaRef} readOnly
                className="w-full min-h-[90px] sm:min-h-[105px] border border-[#D9D9D9] bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] leading-[140%] resize-y outline-none focus:border-[#002855] transition-colors"
                placeholder="Texto simplificado" value={simplifiedText} />
            </div>
            <div className="flex flex-wrap gap-3 justify-end">
              <button type="button" onClick={handleCopyResult} disabled={!simplifiedText}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                Copiar texto
              </button>
              <button type="button" onClick={handleExport} disabled={!simplifiedText}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                Exportar texto
              </button>
              <button type="button" onClick={handleNewSimplification}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors whitespace-nowrap">
                Nueva simplificación
              </button>
            </div>
          </section>

          {/* Anuncios — desde Supabase */}
          <section className="flex flex-col gap-4 sm:gap-5">
            <h2 className="font-lexend font-semibold text-2xl sm:text-3xl lg:text-[32px] leading-[150%] text-black">
              Anuncios
            </h2>
            {anuncios.length === 0 ? (
              <p className="font-inter text-sm text-[#666]">No hay anuncios vigentes en este momento.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {anuncios.map((ann) => (
                  <div key={ann.id} className="border-2 border-[#002855] bg-[#F5F5F5] p-4">
                    <p className="font-lexend text-[15px] leading-[150%] text-black">
                      <span className="font-bold">Título</span>
                      <span className="font-light">: {ann.title}</span>
                      <br />
                      <span className="font-bold">Contenido</span>
                      <span className="font-light">: {ann.content}</span>
                      <br />
                      <span className="font-bold">Vigencia del anuncio</span>
                      <span className="font-light">: {formatearFecha(ann.start_date)} al {formatearFecha(ann.end_date)}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
