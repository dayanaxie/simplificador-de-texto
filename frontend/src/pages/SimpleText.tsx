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

interface Categoria {
  id: number;
  name: string;
}

interface WordEntry {
  id: number;
  user_id: number;
  word: string;
  preferred_replacement: string;
  keep_original: boolean;
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

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState("");

  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [lastSimplificationId, setLastSimplificationId] = useState<
    number | null
  >(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const inputTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const wordCount = countWords(inputText);
  const isOverLimit = wordCount > WORD_LIMIT;

  useEffect(() => {
    const cargarAnuncios = async () => {
      const hoy = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .lte("start_date", hoy)
        .gte("end_date", hoy)
        .order("start_date", { ascending: false });

      if (!error) {
        setAnuncios(data ?? []);
      }
    };

    const cargarCategorias = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (!error) {
        setCategorias(data ?? []);
      }
    };

    cargarAnuncios();
    cargarCategorias();
  }, []);

  const getPersonalDictionary = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from("personal_dictionary")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching personal dictionary:", error);
      return [];
    }
  };

  const applyPersonalDictionary = (text: string, dictionary: WordEntry[]): string => {
    if (!text || !dictionary || dictionary.length === 0) return text;

    let resultText = text;
    
    // Ordenar el diccionario de palabras más largas a más cortas para evitar reemplazos parciales
    const sortedDictionary = [...dictionary].sort((a, b) => b.word.length - a.word.length);
    
    for (const entry of sortedDictionary) {
      // Si keep_original es true, no reemplazar
      if (entry.keep_original) continue;
      
      const regex = new RegExp(`\\b${escapeRegex(entry.word)}\\b`, 'gi');
      resultText = resultText.replace(regex, entry.preferred_replacement);
    }
    
    return resultText;
  };

  // Función auxiliar para escapar caracteres especiales en regex
  const escapeRegex = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

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
      setLastSimplificationId(null);

      const result = await simplifyText(inputText.trim());
      let finalSimplifiedText = result.simplifiedText;


      setSimplifiedText(result.simplifiedText);

      const usuarioGuardado = localStorage.getItem("usuario");
      const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

      if (usuario?.id) {
        // Obtener el diccionario personal del usuario
        const personalDict = await getPersonalDictionary(usuario.id);
        
        // Aplicar las sustituciones del diccionario personal
        if (personalDict.length > 0) {
          finalSimplifiedText = applyPersonalDictionary(finalSimplifiedText, personalDict);
          console.log(`Aplicadas ${personalDict.length} reglas del diccionario personal`);
        }
        setSimplifiedText(finalSimplifiedText);

        const { data, error } = await supabase
          .from("simplifications")
          .insert([
            {
              user_id: usuario.id,
              original_text: result.originalText,
              simplified_text: finalSimplifiedText,
              status: "completed",
            },
          ])
          .select("id")
          .single();

        if (error) {
          console.error("Error guardando simplificación para métricas:", error);
        } else {
          setLastSimplificationId(data.id);
        }
      }

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

  const handleOpenSaveModal = useCallback(() => {
    if (!simplifiedText.trim()) return;

    setErrorMessage("");
    setSuccessMessage("");
    setSaveError("");
    setSaveTitle("");
    setSelectedCategoryId("");
    setNewCategoryName("");
    setIsSaveModalOpen(true);
  }, [simplifiedText]);

  const handleCancelSave = useCallback(() => {
    setIsSaveModalOpen(false);
    setSaveTitle("");
    setSelectedCategoryId("");
    setNewCategoryName("");
    setSaveError("");
  }, []);

  const handleSaveSimplification = useCallback(async () => {
    if (!simplifiedText.trim()) {
      setSaveError("Primero debe generar una simplificación.");
      return;
    }

    if (!saveTitle.trim()) {
      setSaveError("Debe ingresar un título.");
      return;
    }

    if (!selectedCategoryId) {
      setSaveError("Debe seleccionar una categoría.");
      return;
    }

    if (selectedCategoryId === "new" && !newCategoryName.trim()) {
      setSaveError("Debe escribir el nombre de la nueva categoría.");
      return;
    }

    const usuarioGuardado = localStorage.getItem("usuario");
    const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

    if (!usuario?.id) {
      setSaveError("No se encontró el usuario activo.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");
      setErrorMessage("");
      setSuccessMessage("");

      let simplificationId = lastSimplificationId;

      if (!simplificationId) {
        const { data: simplificationData, error: simplificationError } =
          await supabase
            .from("simplifications")
            .insert([
              {
                user_id: usuario.id,
                original_text: inputText,
                simplified_text: simplifiedText,
                status: "completed",
              },
            ])
            .select("id")
            .single();

        if (simplificationError) {
          throw simplificationError;
        }

        simplificationId = simplificationData.id;
        setLastSimplificationId(simplificationId);
      }

      const { data: savedData, error: savedError } = await supabase
        .from("saved_simplifications")
        .insert([
          {
            user_id: usuario.id,
            simplification_id: simplificationId,
            title: saveTitle.trim(),
          },
        ])
        .select("id")
        .single();

      if (savedError) {
        throw savedError;
      }

      let categoryId: number;

      if (selectedCategoryId === "new") {
        const nombreCategoria = newCategoryName.trim();

        const { data: existingCategories, error: searchError } = await supabase
          .from("categories")
          .select("id")
          .eq("name", nombreCategoria)
          .limit(1);

        if (searchError) {
          throw searchError;
        }

        if (existingCategories && existingCategories.length > 0) {
          categoryId = existingCategories[0].id;
        } else {
          const { data: newCategory, error: categoryError } = await supabase
            .from("categories")
            .insert([
              {
                name: nombreCategoria,
              },
            ])
            .select("id, name")
            .single();

          if (categoryError) {
            throw categoryError;
          }

          categoryId = newCategory.id;

          setCategorias((prev) =>
            [...prev, newCategory].sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          );
        }
      } else {
        categoryId = Number(selectedCategoryId);
      }

      const { error: relationError } = await supabase
        .from("simplification_categories")
        .insert([
          {
            saved_simplification_id: savedData.id,
            category_id: categoryId,
          },
        ]);

      if (relationError) {
        throw relationError;
      }

      setIsSaveModalOpen(false);
      setSaveTitle("");
      setSelectedCategoryId("");
      setNewCategoryName("");
      setSaveError("");
      setSuccessMessage("Simplificación guardada correctamente.");
    } catch (error) {
      console.error("Error guardando simplificación:", error);
      setSaveError("No se pudo guardar la simplificación.");
    } finally {
      setIsSaving(false);
    }
  }, [
    simplifiedText,
    saveTitle,
    selectedCategoryId,
    newCategoryName,
    lastSimplificationId,
    inputText,
  ]);

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

    setLastSimplificationId(null);
    setIsSaveModalOpen(false);
    setSaveTitle("");
    setSelectedCategoryId("");
    setNewCategoryName("");
    setSaveError("");
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

          {/* Resultado */}
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
                onClick={handleOpenSaveModal}
                disabled={!simplifiedText}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Guardar simplificación
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

          {/* Anuncios */}
          <section className="flex flex-col gap-4 sm:gap-5">
            <h2 className="font-lexend font-semibold text-2xl sm:text-3xl lg:text-[32px] leading-[150%] text-black">
              Anuncios
            </h2>

            {anuncios.length === 0 ? (
              <p className="font-inter text-sm text-[#666]">
                No hay anuncios vigentes en este momento.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {anuncios.map((ann) => (
                  <div
                    key={ann.id}
                    className="border-2 border-[#002855] bg-[#F5F5F5] p-4"
                  >
                    <p className="font-lexend text-[15px] leading-[150%] text-black">
                      <span className="font-bold">Título</span>
                      <span className="font-light">: {ann.title}</span>
                      <br />
                      <span className="font-bold">Contenido</span>
                      <span className="font-light">: {ann.content}</span>
                      <br />
                      <span className="font-bold">
                        Vigencia del anuncio
                      </span>
                      <span className="font-light">
                        : {formatearFecha(ann.start_date)} al{" "}
                        {formatearFecha(ann.end_date)}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Modal de guardar simplificación */}
      {isSaveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCancelSave}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-inter font-semibold text-xl text-black mb-5">
              Guardar simplificación
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-normal text-base text-[#1E1E1E]">
                  Título
                </label>

                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => {
                    setSaveTitle(e.target.value);
                    setSaveError("");
                  }}
                  placeholder="Ejemplo: Texto de finanzas"
                  className="w-full border border-[#D9D9D9] rounded px-4 py-3 font-inter text-base text-[#1E1E1E] outline-none focus:border-[#002855] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-normal text-base text-[#1E1E1E]">
                  Categoría
                </label>

                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setSaveError("");
                  }}
                  className="w-full border border-[#D9D9D9] rounded px-4 py-3 font-inter text-base text-[#1E1E1E] bg-white outline-none focus:border-[#002855] transition-colors"
                >
                  <option value="">Seleccione una categoría</option>

                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.name}
                    </option>
                  ))}

                  <option value="new">+ Nueva categoría</option>
                </select>
              </div>

              {selectedCategoryId === "new" && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-normal text-base text-[#1E1E1E]">
                    Nueva categoría
                  </label>

                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      setSaveError("");
                    }}
                    placeholder="Ejemplo: Educación, Finanzas, Salud"
                    className="w-full border border-[#D9D9D9] rounded px-4 py-3 font-inter text-base text-[#1E1E1E] outline-none focus:border-[#002855] transition-colors"
                  />
                </div>
              )}

              {saveError && (
                <p className="text-sm text-red-600 font-inter">{saveError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleCancelSave}
                className="px-6 py-2 font-inter font-normal text-sm text-[#1E1E1E] border border-[#D9D9D9] bg-white hover:bg-[#F5F5F5] transition-colors rounded"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveSimplification}
                disabled={
                  isSaving ||
                  !saveTitle.trim() ||
                  !selectedCategoryId ||
                  (selectedCategoryId === "new" && !newCategoryName.trim())
                }
                className="px-6 py-2 font-inter font-medium text-sm text-white bg-[#002855] hover:bg-[#003d80] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reporte */}
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