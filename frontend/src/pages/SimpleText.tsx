import { useState, useCallback, useRef, useEffect } from "react";
import { simplifyText } from "../lib/simplifierApi";
import { supabase } from "../lib/supabaseClient";
import BotonAyuda from "../components/BotonAyuda";

const WORD_LIMIT_DEFAULT = 500;
const REPORT_TABLE = "reports";
const GLOSSARY_TABLE = "glossary";

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
  user_id?: number;
}

interface WordEntry {
  id?: number;
  user_id?: number;
  word: string | null;
  preferred_replacement: string | null;
  keep_original: boolean | null;
}

const formatearFecha = (iso: string) => {
  if (!iso) return "";

  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const limpiarPalabraSeleccionada = (texto: string) => {
  return texto.trim().replace(/[.,;:!?¿¡()"']/g, "");
};

const escapeRegex = (texto: string): string => {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

async function obtenerDiccionarioPersonal(userId: number): Promise<WordEntry[]> {
  try {
    const { data, error } = await supabase
      .from("personal_dictionary")
      .select("id, user_id, word, preferred_replacement, keep_original")
      .eq("user_id", userId);

    if (error) throw error;

    return data ?? [];
  } catch (error) {
    console.error("Error consultando el diccionario personal:", error);
    return [];
  }
}

function aplicarDiccionarioPersonal(
  texto: string,
  diccionario: WordEntry[]
): string {
  if (!texto.trim() || diccionario.length === 0) return texto;

  let textoFinal = texto;

  const diccionarioOrdenado = [...diccionario].sort(
    (a, b) => (b.word ?? "").length - (a.word ?? "").length
  );

  for (const entrada of diccionarioOrdenado) {
    const palabra = entrada.word?.trim();
    const reemplazo = entrada.preferred_replacement?.trim();

    if (!palabra || !reemplazo || entrada.keep_original) continue;

    const regex = new RegExp(
      `(^|[^\\p{L}\\p{N}_])(${escapeRegex(palabra)})(?=$|[^\\p{L}\\p{N}_])`,
      "giu"
    );

    textoFinal = textoFinal.replace(regex, `$1${reemplazo}`);
  }

  return textoFinal;
}

async function siguienteId(tabla: string): Promise<number> {
  const { data, error } = await supabase
    .from(tabla)
    .select("id")
    .order("id", { ascending: false })
    .limit(1);

  if (error) throw error;

  const maxId = data && data.length > 0 ? Number(data[0].id) : 0;
  return maxId + 1;
}

async function insertarFila(
  tabla: string,
  fila: Record<string, unknown>,
  intentos = 5
): Promise<void> {
  const primer = await supabase.from(tabla).insert(fila);

  if (!primer.error) return;

  if (primer.error.code !== "23502") throw primer.error;

  for (let i = 0; i < intentos; i++) {
    const id = await siguienteId(tabla);
    const { error } = await supabase.from(tabla).insert({ ...fila, id });

    if (!error) return;

    if (error.code !== "23505") throw error;
  }

  throw new Error(`No se pudo generar un id único para ${tabla}.`);
}

async function insertarFilaConRetorno<T = any>(
  tabla: string,
  fila: Record<string, unknown>,
  intentos = 5
): Promise<T> {
  const primer = await supabase.from(tabla).insert(fila).select("*").single();

  if (!primer.error && primer.data) {
    return primer.data as T;
  }

  if (primer.error?.code !== "23502") {
    throw primer.error;
  }

  for (let i = 0; i < intentos; i++) {
    const id = await siguienteId(tabla);

    const { data, error } = await supabase
      .from(tabla)
      .insert({ ...fila, id })
      .select("*")
      .single();

    if (!error && data) {
      return data as T;
    }

    if (error?.code !== "23505") {
      throw error;
    }
  }

  throw new Error(`No se pudo generar un id único para ${tabla}.`);
}

export default function SimpleText() {
  const [inputText, setInputText] = useState("");
  const [simplifiedText, setSimplifiedText] = useState("");
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [wordLimit, setWordLimit] = useState(WORD_LIMIT_DEFAULT);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState("");
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [isConfirmReportModalOpen, setIsConfirmReportModalOpen] =
    useState(false);

  const [selectedWord, setSelectedWord] = useState("");
  const [glossaryDefinition, setGlossaryDefinition] = useState("");
  const [isGlossaryModalOpen, setIsGlossaryModalOpen] = useState(false);
  const [isSearchingWord, setIsSearchingWord] = useState(false);

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
  const [rating, setRating] = useState(0);

  const inputTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const wordCount = countWords(inputText);
  const isOverLimit = wordCount > wordLimit;

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
      const usuarioGuardado = localStorage.getItem("usuario");
      const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

      if (!usuario?.id) {
        setCategorias([]);
        return;
      }

      const userId = Number(usuario.id);

      if (Number.isNaN(userId)) {
        setCategorias([]);
        return;
      }

      const { data, error } = await supabase
        .from("categories")
        .select("id, name, user_id")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error cargando categorías:", error);
        setCategorias([]);
        return;
      }

      setCategorias(data ?? []);
    };

    const cargarLimite = async () => {
      const { data } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "limite_palabras")
        .single();

      if (data?.value) setWordLimit(Number(data.value));
    };

    cargarAnuncios();
    cargarCategorias();
    cargarLimite();
  }, []);

  const obtenerOCrearSimplificationId = useCallback(
    async (userId: number): Promise<number> => {
      if (lastSimplificationId) return lastSimplificationId;

      const ahora = new Date().toISOString();

      const { data, error } = await supabase
        .from("simplifications")
        .insert([
          {
            user_id: userId,
            original_text: inputText,
            simplified_text: simplifiedText,
            status: "completed",
            created_at: ahora,
            updated_at: ahora,
          },
        ])
        .select("id")
        .single();

      if (error) throw error;

      setLastSimplificationId(data.id);
      return data.id;
    },
    [lastSimplificationId, inputText, simplifiedText]
  );

  const consultarPalabraGlosario = useCallback(async (palabra: string) => {
    const palabraLimpia = limpiarPalabraSeleccionada(palabra);

    if (!palabraLimpia) return;

    try {
      setIsSearchingWord(true);
      setSelectedWord(palabraLimpia);
      setGlossaryDefinition("");

      const { data, error } = await supabase
        .from(GLOSSARY_TABLE)
        .select("word, definition")
        .ilike("word", palabraLimpia)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setGlossaryDefinition("Palabra no encontrada en el glosario.");
      } else {
        setSelectedWord(data[0].word);
        setGlossaryDefinition(data[0].definition);
      }

      setIsGlossaryModalOpen(true);
    } catch {
      setSelectedWord(palabraLimpia);
      setGlossaryDefinition("No se pudo consultar el glosario.");
      setIsGlossaryModalOpen(true);
    } finally {
      setIsSearchingWord(false);
    }
  }, []);

  const handleSeleccionTextoSimplificado = useCallback(() => {
    const textarea = outputTextareaRef.current;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) return;

    const seleccion = simplifiedText.slice(start, end).trim();

    if (!seleccion) return;

    const palabras = seleccion.split(/\s+/);

    if (palabras.length > 1) {
      setSelectedWord("");
      setGlossaryDefinition(
        "Selecciona solo una palabra para consultar el glosario."
      );
      setIsGlossaryModalOpen(true);
      return;
    }

    consultarPalabraGlosario(seleccion);
  }, [simplifiedText, consultarPalabraGlosario]);

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
    } catch {
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

      const usuarioGuardado = localStorage.getItem("usuario");
      const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

      if (usuario?.id) {
        const diccionarioPersonal = await obtenerDiccionarioPersonal(
          Number(usuario.id)
        );

        finalSimplifiedText = aplicarDiccionarioPersonal(
          finalSimplifiedText,
          diccionarioPersonal
        );
      }

      setSimplifiedText(finalSimplifiedText);

      if (usuario?.id) {
        const userId = Number(usuario.id);
        const ahora = new Date().toISOString();

        const { data, error } = await supabase
          .from("simplifications")
          .insert([
            {
              user_id: userId,
              original_text: result.originalText,
              simplified_text: finalSimplifiedText,
              status: "completed",
              created_at: ahora,
              updated_at: ahora,
            },
          ])
          .select("id")
          .single();

        if (!error) {
          setLastSimplificationId(data.id);
        }
      }

      setSuccessMessage("Texto simplificado correctamente.");
    } catch (error) {
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
    } catch {
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
    setRating(0);
    setIsSaveModalOpen(true);
  }, [simplifiedText]);

  const handleCancelSave = useCallback(() => {
    setIsSaveModalOpen(false);
    setSaveTitle("");
    setSelectedCategoryId("");
    setNewCategoryName("");
    setRating(0);
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

    if (rating < 1 || rating > 5) {
      setSaveError("Debe seleccionar una valoración.");
      return;
    }

    const usuarioGuardado = localStorage.getItem("usuario");
    const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

    if (!usuario?.id) {
      setSaveError("No se encontró el usuario activo.");
      return;
    }

    const userId = Number(usuario.id);

    if (Number.isNaN(userId)) {
      setSaveError("El ID del usuario no es válido.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");
      setErrorMessage("");
      setSuccessMessage("");

      const ahora = new Date().toISOString();
      const simplificationId = await obtenerOCrearSimplificationId(userId);

      const savedData = await insertarFilaConRetorno<{
        id: number;
        user_id: number;
        simplification_id: number;
        title: string;
        created_at: string;
      }>("saved_simplifications", {
        user_id: userId,
        simplification_id: simplificationId,
        title: saveTitle.trim(),
        created_at: ahora,
      });

      let categoryId: number;

      if (selectedCategoryId === "new") {
        const nombreCategoria = newCategoryName.trim();

        const { data: existingCategories, error: searchError } = await supabase
          .from("categories")
          .select("id, name, user_id")
          .eq("user_id", userId)
          .ilike("name", nombreCategoria)
          .limit(1);

        if (searchError) throw searchError;

        if (existingCategories && existingCategories.length > 0) {
          categoryId = existingCategories[0].id;
        } else {
          const newCategory = await insertarFilaConRetorno<{
            id: number;
            name: string;
            user_id: number;
            created_at: string;
          }>("categories", {
            name: nombreCategoria,
            user_id: userId,
            created_at: ahora,
          });

          categoryId = newCategory.id;

          setCategorias((prev) =>
            [...prev, newCategory].sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          );
        }
      } else {
        categoryId = Number(selectedCategoryId);

        if (Number.isNaN(categoryId)) {
          setSaveError("La categoría seleccionada no es válida.");
          return;
        }
      }

      await insertarFila("simplification_categories", {
        saved_simplification_id: savedData.id,
        category_id: categoryId,
        user_id: userId,
        created_at: ahora,
      });

      await insertarFila("ratings", {
        saved_simplification_id: savedData.id,
        user_id: userId,
        score: rating,
        comment: null,
        created_at: ahora,
      });

      setIsSaveModalOpen(false);
      setSaveTitle("");
      setSelectedCategoryId("");
      setNewCategoryName("");
      setRating(0);
      setSaveError("");
      setSuccessMessage("Simplificación guardada correctamente.");
    } catch (error: any) {
      console.error("Error guardando simplificación:", error);

      setSaveError(
        error?.message ||
          error?.details ||
          error?.hint ||
          "No se pudo guardar la simplificación."
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    simplifiedText,
    saveTitle,
    selectedCategoryId,
    newCategoryName,
    rating,
    obtenerOCrearSimplificationId,
  ]);

  const handleOpenReportModal = useCallback(() => {
    if (!simplifiedText.trim()) return;

    setErrorMessage("");
    setSuccessMessage("");
    setIsReportModalOpen(true);
  }, [simplifiedText]);

  const handleCancelReport = useCallback(() => {
    if (isSendingReport) return;

    setIsReportModalOpen(false);
    setIsConfirmReportModalOpen(false);
    setReportDescription("");
  }, [isSendingReport]);

  const handleSendReport = useCallback(() => {
    if (!reportDescription.trim() || isSendingReport) return;

    setIsConfirmReportModalOpen(true);
  }, [reportDescription, isSendingReport]);

  const confirmarEnvioReporte = useCallback(async () => {
    if (!reportDescription.trim() || isSendingReport) return;

    const usuarioGuardado = localStorage.getItem("usuario");
    const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

    if (!usuario?.id) {
      setIsConfirmReportModalOpen(false);
      setErrorMessage("No se encontró el usuario activo.");
      setSuccessMessage("");
      return;
    }

    try {
      setIsSendingReport(true);
      setErrorMessage("");
      setSuccessMessage("");

      const userId = Number(usuario.id);
      const simplificationId = await obtenerOCrearSimplificationId(userId);

      await insertarFila(REPORT_TABLE, {
        user_id: userId,
        simplification_id: simplificationId,
        description: reportDescription.trim(),
        status: "pending",
        created_at: new Date().toISOString(),
      });

      setIsConfirmReportModalOpen(false);
      setIsReportModalOpen(false);
      setReportDescription("");

      setSuccessMessage("Reporte enviado correctamente.");
      setErrorMessage("");
    } catch {
      setIsConfirmReportModalOpen(false);
      setErrorMessage("No se pudo enviar el reporte.");
      setSuccessMessage("");
    } finally {
      setIsSendingReport(false);
    }
  }, [reportDescription, isSendingReport, obtenerOCrearSimplificationId]);

  const handleExport = useCallback(async () => {
    if (!simplifiedText.trim() || isExporting) return;

    const usuarioGuardado = localStorage.getItem("usuario");
    const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

    if (!usuario?.id) {
      setErrorMessage("No se encontró el usuario activo.");
      setSuccessMessage("");
      return;
    }

    try {
      setIsExporting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const userId = Number(usuario.id);
      const simplificationId = await obtenerOCrearSimplificationId(userId);

      const ahora = new Date().toISOString();

      const filePath = `texto-simplificado-${ahora
        .slice(0, 19)
        .replace(/[:T]/g, "-")}.txt`;

      await insertarFila("exports", {
        simplification_id: simplificationId,
        file_path: filePath,
        created_at: ahora,
      });

      const blob = new Blob([simplifiedText], {
        type: "text/plain;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = filePath;
      a.click();

      URL.revokeObjectURL(url);

      setSuccessMessage("Texto exportado y registrado correctamente.");
    } catch {
      setErrorMessage("No se pudo registrar la exportación del texto.");
      setSuccessMessage("");
    } finally {
      setIsExporting(false);
    }
  }, [simplifiedText, isExporting, obtenerOCrearSimplificationId]);

  const handleNewSimplification = useCallback(() => {
    setInputText("");
    setSimplifiedText("");
    setErrorMessage("");
    setSuccessMessage("");
    setReportDescription("");
    setIsReportModalOpen(false);
    setIsConfirmReportModalOpen(false);
    setIsSendingReport(false);
    setIsExporting(false);
    setIsGlossaryModalOpen(false);
    setSelectedWord("");
    setGlossaryDefinition("");

    setLastSimplificationId(null);
    setIsSaveModalOpen(false);
    setSaveTitle("");
    setSelectedCategoryId("");
    setNewCategoryName("");
    setRating(0);
    setSaveError("");
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
              <label
                htmlFor="texto-original"
                className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
              >
                Ingrese un texto menor a {wordLimit} palabras
              </label>

              <textarea
                id="texto-original"
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
                  {wordCount}/{wordLimit} palabras
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
                <p className="text-sm text-red-600 font-inter" role="alert">
                  El texto supera el límite permitido de {wordLimit} palabras.
                </p>
              )}

              {errorMessage && (
                <p className="text-sm text-red-600 font-inter" role="alert">
                  {errorMessage}
                </p>
              )}

              {successMessage && (
                <p className="text-sm text-green-600 font-inter" role="status">
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
              <label
                htmlFor="texto-simplificado"
                className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]"
              >
                Texto simplificado
              </label>

              <textarea
                id="texto-simplificado"
                ref={outputTextareaRef}
                readOnly
                onMouseUp={handleSeleccionTextoSimplificado}
                onKeyUp={handleSeleccionTextoSimplificado}
                className="w-full min-h-[90px] sm:min-h-[105px] border border-[#D9D9D9] bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] leading-[140%] resize-y outline-none focus:border-[#002855] transition-colors"
                placeholder="Texto simplificado"
                value={simplifiedText}
              />

              <p className="font-inter text-sm text-[#666]">
                Selecciona una palabra del texto simplificado para consultar su
                significado en el glosario.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={handleOpenReportModal}
                disabled={!simplifiedText.trim()}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Reportar resultado
              </button>

              <button
                type="button"
                onClick={handleCopyResult}
                disabled={!simplifiedText.trim()}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Copiar texto
              </button>

              <button
                type="button"
                onClick={handleOpenSaveModal}
                disabled={!simplifiedText.trim()}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Guardar simplificación
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={!simplifiedText.trim() || isExporting}
                className="bg-[#002855] text-white font-inter font-medium text-sm leading-[150%] px-4 h-[38px] flex items-center justify-center hover:bg-[#003d80] active:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isExporting ? "Exportando..." : "Exportar texto"}
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
                      <span className="font-bold">Vigencia del anuncio</span>
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

      {isSaveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-guardar"
          onClick={handleCancelSave}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="titulo-guardar"
              className="font-inter font-semibold text-xl text-black mb-5"
            >
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

              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-normal text-base text-[#1E1E1E]">
                  Valoración
                </label>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        setSaveError("");
                      }}
                      className="text-3xl leading-none transition-colors focus:outline-none"
                      aria-label={`Seleccionar ${star} estrella${
                        star > 1 ? "s" : ""
                      }`}
                      style={{ color: star <= rating ? "#f5b301" : "#cbd5e1" }}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {rating > 0 && (
                  <span className="text-sm text-gray-600 font-inter">
                    {rating} de 5 estrellas
                  </span>
                )}
              </div>

              {saveError && (
                <p className="text-sm text-red-600 font-inter" role="alert">
                  {saveError}
                </p>
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
                  rating === 0 ||
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

      {isReportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-reporte"
          onClick={handleCancelReport}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="titulo-reporte"
              className="font-inter font-semibold text-xl text-black mb-5"
            >
              Ingrese el motivo del reporte
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="font-inter font-normal text-base text-[#1E1E1E]">
                Descripción
              </label>

              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                disabled={isSendingReport}
                placeholder="Escriba su descripción aquí..."
                className="w-full min-h-[95px] border border-[#D9D9D9] rounded px-4 py-3 font-inter text-base text-[#1E1E1E] resize-none outline-none focus:border-[#002855] transition-colors disabled:opacity-50"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleCancelReport}
                disabled={isSendingReport}
                className="px-6 py-2 font-inter font-normal text-sm text-[#1E1E1E] border border-[#D9D9D9] bg-white hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSendReport}
                disabled={!reportDescription.trim() || isSendingReport}
                className="px-6 py-2 font-inter font-medium text-sm text-white bg-[#002855] hover:bg-[#003d80] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmReportModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-confirmar-reporte"
          onClick={() => {
            if (!isSendingReport) setIsConfirmReportModalOpen(false);
          }}
        >
          <div
            className="bg-white w-full max-w-[440px] p-6 shadow-xl rounded-lg border border-[#E0E0E0]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-[#EAF1F8] flex items-center justify-center shrink-0">
                <span className="text-[#002855] text-2xl" aria-hidden="true">
                  !
                </span>
              </div>

              <div className="flex-1">
                <h2
                  id="titulo-confirmar-reporte"
                  className="font-inter font-semibold text-xl text-black mb-2"
                >
                  Confirmar reporte
                </h2>

                <p className="font-inter text-base text-[#1E1E1E] leading-[140%]">
                  ¿Estás segura de que deseas enviar este reporte? Una vez
                  enviado, quedará registrado para revisión.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsConfirmReportModalOpen(false)}
                disabled={isSendingReport}
                className="px-6 py-2 font-inter font-normal text-sm text-[#1E1E1E] border border-[#D9D9D9] bg-white hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarEnvioReporte}
                disabled={isSendingReport}
                className="px-6 py-2 font-inter font-medium text-sm text-white bg-[#002855] hover:bg-[#003d80] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                {isSendingReport ? "Enviando..." : "Sí, enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isGlossaryModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-glosario"
          onClick={() => setIsGlossaryModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-[480px] p-6 shadow-xl rounded-lg border border-[#E0E0E0]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-[#EAF1F8] flex items-center justify-center shrink-0">
                <span className="text-[#002855] text-xl" aria-hidden="true">
                  📖
                </span>
              </div>

              <div className="flex-1">
                <h2
                  id="titulo-glosario"
                  className="font-inter font-semibold text-xl text-black mb-2"
                >
                  Glosario de palabras
                </h2>

                {selectedWord && (
                  <p className="font-inter text-sm text-[#666] mb-3">
                    Palabra consultada:{" "}
                    <span className="font-semibold text-[#1E1E1E]">
                      {selectedWord}
                    </span>
                  </p>
                )}

                <p className="font-inter text-base text-[#1E1E1E] leading-[140%] whitespace-pre-wrap">
                  {isSearchingWord
                    ? "Buscando significado..."
                    : glossaryDefinition}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setIsGlossaryModalOpen(false)}
                className="px-6 py-2 font-inter font-medium text-sm text-white bg-[#002855] hover:bg-[#003d80] transition-colors rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <BotonAyuda modulo="Simplificación" />
    </div>
  );
}