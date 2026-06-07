import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { simplifyText } from "../lib/simplifierApi";
import { supabase } from "../lib/supabaseClient";
import BotonAyuda from "../components/BotonAyuda";

type TextosTab = "guardados" | "edicion" | "historial" | "valoraciones";

const textosTabs: { id: TextosTab; label: string }[] = [
  { id: "guardados", label: "Textos guardados" },
  { id: "edicion", label: "Edición" },
  { id: "historial", label: "Historial de versiones" },
  { id: "valoraciones", label: "Valoraciones" },
];

interface TextoGuardado {
  id: number;
  user_id: number;
  simplification_id: number | null;
  title: string;
  created_at: string | null;
  category: string;
  original_text: string;
  simplified_text: string;
  simplification_updated_at: string | null;
}

const WORD_LIMIT = 500;

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return "-";

  return new Date(fecha).toLocaleDateString("es-CR", {
    timeZone: "America/Costa_Rica",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getUsuarioActual = () => {
  const usuarioGuardado = localStorage.getItem("usuario");
  return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
};

// ── Generación de id desde el código (algunas tablas no autogeneran el id) ──
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

export default function TextosGuardados() {
  const [activeTab, setActiveTab] = useState<TextosTab>("guardados");
  const [textos, setTextos] = useState<TextoGuardado[]>([]);
  const [selectedTexto, setSelectedTexto] = useState<TextoGuardado | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [textoAEliminar, setTextoAEliminar] = useState<TextoGuardado | null>(
    null
  );
  const [eliminando, setEliminando] = useState(false);

  const cargarTextos = useCallback(async () => {
    const usuario = getUsuarioActual();

    if (!usuario?.id) {
      setError("No se encontró el usuario activo.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data: savedData, error: savedError } = await supabase
        .from("saved_simplifications")
        .select("id, user_id, simplification_id, title, created_at")
        .eq("user_id", usuario.id)
        .order("created_at", { ascending: false });

      if (savedError) throw savedError;

      const savedRows = savedData ?? [];

      const simplificationIds = savedRows
        .map((item: any) => item.simplification_id)
        .filter((id: number | null) => id !== null);

      const savedIds = savedRows.map((item: any) => item.id);

      const { data: simplificationsData, error: simplificationsError } =
        simplificationIds.length > 0
          ? await supabase
              .from("simplifications")
              .select(
                "id, original_text, simplified_text, updated_at, created_at"
              )
              .in("id", simplificationIds)
          : { data: [], error: null };

      if (simplificationsError) throw simplificationsError;

      const { data: relationData, error: relationError } =
        savedIds.length > 0
          ? await supabase
              .from("simplification_categories")
              .select("saved_simplification_id, category_id")
              .in("saved_simplification_id", savedIds)
          : { data: [], error: null };

      if (relationError) throw relationError;

      const categoryIds = (relationData ?? [])
        .map((item: any) => item.category_id)
        .filter((id: number | null) => id !== null);

      const { data: categoriesData, error: categoriesError } =
        categoryIds.length > 0
          ? await supabase
              .from("categories")
              .select("id, name")
              .in("id", categoryIds)
          : { data: [], error: null };

      if (categoriesError) throw categoriesError;

      const simplificationMap = new Map<number, any>();
      (simplificationsData ?? []).forEach((item: any) => {
        simplificationMap.set(item.id, item);
      });

      const categoryMap = new Map<number, string>();
      (categoriesData ?? []).forEach((item: any) => {
        categoryMap.set(item.id, item.name);
      });

      const relationMap = new Map<number, string>();
      (relationData ?? []).forEach((item: any) => {
        const categoryName = categoryMap.get(item.category_id) ?? "Sin categoría";
        relationMap.set(item.saved_simplification_id, categoryName);
      });

      const textosConvertidos: TextoGuardado[] = savedRows.map((item: any) => {
        const simplification = item.simplification_id
          ? simplificationMap.get(item.simplification_id)
          : null;

        return {
          id: item.id,
          user_id: item.user_id,
          simplification_id: item.simplification_id,
          title: item.title ?? "Sin título",
          created_at: item.created_at,
          category: relationMap.get(item.id) ?? "Sin categoría",
          original_text: simplification?.original_text ?? "",
          simplified_text: simplification?.simplified_text ?? "",
          simplification_updated_at:
            simplification?.updated_at ?? simplification?.created_at ?? null,
        };
      });

      setTextos(textosConvertidos);

      if (selectedTexto) {
        const actualizado = textosConvertidos.find(
          (texto) => texto.id === selectedTexto.id
        );

        if (actualizado) {
          setSelectedTexto(actualizado);
        }
      }
    } catch (err) {
      console.error("Error cargando textos guardados:", err);
      setError("No se pudieron cargar los textos guardados.");
    } finally {
      setLoading(false);
    }
  }, [selectedTexto]);

  useEffect(() => {
    cargarTextos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seleccionarTexto = (texto: TextoGuardado, tab: TextosTab) => {
    setSelectedTexto(texto);
    setActiveTab(tab);
    setMensaje("");
    setError("");
  };

  // Volver al listado (desde el botón Regresar de las sub-pestañas).
  const regresar = () => {
    setSelectedTexto(null);
    setActiveTab("guardados");
    setMensaje("");
    setError("");
  };

  // Mantener sincronizados selectedTexto y la lista cuando se edita/restaura.
  const actualizarTextoLocal = (textoActualizado: TextoGuardado) => {
    setSelectedTexto(textoActualizado);
    setTextos((prev) =>
      prev.map((texto) =>
        texto.id === textoActualizado.id ? textoActualizado : texto
      )
    );
  };

  const confirmarEliminar = async () => {
    if (!textoAEliminar) return;
    const texto = textoAEliminar;

    try {
      setEliminando(true);
      setError("");
      setMensaje("");

      await supabase
        .from("simplification_categories")
        .delete()
        .eq("saved_simplification_id", texto.id);

      await supabase
        .from("ratings")
        .delete()
        .eq("saved_simplification_id", texto.id);

      await supabase
        .from("simplification_versions")
        .delete()
        .eq("saved_simplification_id", texto.id);

      const { error: deleteError } = await supabase
        .from("saved_simplifications")
        .delete()
        .eq("id", texto.id);

      if (deleteError) throw deleteError;

      setTextos((prev) => prev.filter((item) => item.id !== texto.id));

      if (selectedTexto?.id === texto.id) {
        setSelectedTexto(null);
        setActiveTab("guardados");
      }

      setTextoAEliminar(null);
      setMensaje("Texto eliminado correctamente.");
    } catch (err) {
      console.error("Error eliminando texto:", err);
      setError("No se pudo eliminar el texto guardado.");
      setTextoAEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <main className="flex-1 bg-surface min-h-screen flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-[1440px]">
        <div className="bg-white border border-card-border">
          <div
            className="flex overflow-x-auto border-b"
            style={{
              backgroundColor: "#002855",
              borderColor: "#002855",
            }}
          >
            {textosTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              // Sin texto elegido: se bloquean las sub-pestañas.
              // Con un texto elegido: se bloquea "Textos guardados" (se vuelve con Regresar).
              const isLocked = selectedTexto
                ? tab.id === "guardados"
                : tab.id !== "guardados";

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!isLocked) setActiveTab(tab.id);
                  }}
                  disabled={isLocked}
                  title={
                    isLocked
                      ? selectedTexto
                        ? "Usa el botón Regresar para volver a la lista"
                        : "Primero elige un texto con el botón Editar"
                      : undefined
                  }
                  className={`relative flex flex-col justify-end items-center px-4 h-[52px] shrink-0 ${
                    isLocked ? "opacity-40 cursor-not-allowed" : ""
                  }`}
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

          <div className="p-6 md:p-10 min-h-[400px]">
            {error && (
              <p className="mb-4 text-sm text-red-600 font-inter">{error}</p>
            )}

            {mensaje && (
              <p className="mb-4 text-sm text-green-700 font-inter">{mensaje}</p>
            )}

            {activeTab === "guardados" && (
              <TextosGuardadosTab
                textos={textos}
                loading={loading}
                onEditar={(texto) => seleccionarTexto(texto, "edicion")}
                onHistorial={(texto) => seleccionarTexto(texto, "historial")}
                onValoraciones={(texto) =>
                  seleccionarTexto(texto, "valoraciones")
                }
                onEliminar={(texto) => setTextoAEliminar(texto)}
              />
            )}

            {activeTab === "edicion" && selectedTexto && (
              <EdicionTab
                texto={selectedTexto}
                onRegresar={regresar}
                onTextoActualizado={actualizarTextoLocal}
              />
            )}

            {activeTab === "historial" && selectedTexto && (
              <HistorialTab
                texto={selectedTexto}
                onRegresar={regresar}
                onTextoActualizado={actualizarTextoLocal}
              />
            )}

            {activeTab === "valoraciones" && selectedTexto && (
              <ValoracionesTab texto={selectedTexto} onRegresar={regresar} />
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación para eliminar un texto guardado */}
      {textoAEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            if (!eliminando) setTextoAEliminar(null);
          }}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-inter font-semibold text-xl text-black mb-1">
              Eliminar texto guardado
            </h2>
            <p className="font-inter font-normal text-base text-[#1E1E1E] mb-5">
              ¿Seguro que quieres eliminar{" "}
              <span className="font-semibold">{textoAEliminar.title}</span>? Se
              borrarán también sus versiones y valoraciones. Esta acción no se
              puede deshacer.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setTextoAEliminar(null)}
                disabled={eliminando}
                className="px-6 py-2 font-inter font-normal text-sm text-[#1E1E1E] border border-[#D9D9D9] bg-white hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="px-6 py-2 font-inter font-medium text-sm text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Pantalla de Textos guardados (versión de la compañera): lista con categoría,
// búsqueda en vivo y botones por fila (Editar / Historial / Valoraciones /
// Eliminar). El borrado lo maneja el componente padre.
// ──────────────────────────────────────────────────────────────────────────
function TextosGuardadosTab({
  textos,
  loading,
  onEditar,
  onHistorial,
  onValoraciones,
  onEliminar,
}: {
  textos: TextoGuardado[];
  loading: boolean;
  onEditar: (texto: TextoGuardado) => void;
  onHistorial: (texto: TextoGuardado) => void;
  onValoraciones: (texto: TextoGuardado) => void;
  onEliminar: (texto: TextoGuardado) => void;
}) {
  const [busqueda, setBusqueda] = useState("");

  const textosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    if (!q) return textos;

    return textos.filter(
      (texto) =>
        texto.title.toLowerCase().includes(q) ||
        texto.category.toLowerCase().includes(q)
    );
  }, [busqueda, textos]);

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-8">
        Textos Guardados
      </h2>

      <div className="flex items-center gap-4 mb-10 max-w-[700px]">
        <div className="border border-input-border bg-white px-4 py-3 flex-1">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
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
            <th className="py-3 font-medium text-center">Historial</th>
            <th className="py-3 font-medium text-center">Valoraciones</th>
            <th className="py-3 font-medium text-center">Eliminar</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-[#666]">
                Cargando textos guardados...
              </td>
            </tr>
          ) : textosFiltrados.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-[#666]">
                No hay textos guardados.
              </td>
            </tr>
          ) : (
            textosFiltrados.map((texto) => (
              <tr key={texto.id} className="border-b border-gray-300">
                <td className="py-3">{texto.title}</td>
                <td className="py-3">{texto.category}</td>
                <td className="py-3">{formatearFecha(texto.created_at)}</td>

                <td className="py-3 text-center">
                  <button
                    onClick={() => onEditar(texto)}
                    className="text-xl text-black"
                    title="Editar"
                  >
                    ✎
                  </button>
                </td>

                <td className="py-3 text-center">
                  <button
                    onClick={() => onHistorial(texto)}
                    className="text-sm text-[#002855] underline"
                    title="Historial"
                  >
                    Ver
                  </button>
                </td>

                <td className="py-3 text-center">
                  <button
                    onClick={() => onValoraciones(texto)}
                    className="text-sm text-[#002855] underline"
                    title="Valoraciones"
                  >
                    Ver
                  </button>
                </td>

                <td className="py-3 text-center">
                  <button
                    onClick={() => onEliminar(texto)}
                    className="text-xl text-black"
                    title="Eliminar"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <BotonAyuda modulo="Textos guardados" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Pestañas del usuario: Edición, Historial y Valoraciones.
// ──────────────────────────────────────────────────────────────────────────

function EdicionTab({
  texto,
  onRegresar,
  onTextoActualizado,
}: {
  texto: TextoGuardado;
  onRegresar: () => void;
  onTextoActualizado: (texto: TextoGuardado) => void;
}) {
  const [originalText, setOriginalText] = useState(texto.original_text);
  const [simplifiedText, setSimplifiedText] = useState(texto.simplified_text);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [mostrarModalGuardar, setMostrarModalGuardar] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [hoverEstrellas, setHoverEstrellas] = useState(0);
  const [errorGuardar, setErrorGuardar] = useState("");

  const originalRef = useRef<HTMLTextAreaElement | null>(null);
  const wordCount = countWords(originalText);
  const isOverLimit = wordCount > WORD_LIMIT;

  const handlePegar = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    originalRef.current?.focus();
    try {
      if (!navigator.clipboard?.readText) {
        setErrorMsg(
          "Tu navegador no permite pegar con botón. Haz clic en el cuadro y usa Ctrl + V."
        );
        return;
      }
      const t = await navigator.clipboard.readText();
      if (!t.trim()) {
        setErrorMsg("El portapapeles está vacío.");
        return;
      }
      setOriginalText(t);
    } catch {
      setErrorMsg(
        "El navegador bloqueó el botón Pegar. Haz clic en el cuadro y usa Ctrl + V."
      );
    }
  };

  const handleSimplificar = async () => {
    if (!originalText.trim() || isOverLimit || isSimplifying) return;
    try {
      setIsSimplifying(true);
      setErrorMsg("");
      setSuccessMsg("");
      const result = await simplifyText(originalText.trim());
      setSimplifiedText(result.simplifiedText);
    } catch (e: any) {
      console.error("Error simplificando:", e);
      setErrorMsg(
        e?.message ??
          "No se pudo simplificar. Revisa que Ollama y el servidor estén encendidos."
      );
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleExportar = () => {
    if (!simplifiedText) return;
    const blob = new Blob([simplifiedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "texto-simplificado.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const abrirModalGuardar = () => {
    if (!simplifiedText.trim()) {
      setErrorMsg("No hay texto simplificado para guardar.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setEstrellas(0);
    setHoverEstrellas(0);
    setErrorGuardar("");
    setMostrarModalGuardar(true);
  };

  const cancelarGuardar = () => {
    setMostrarModalGuardar(false);
    setEstrellas(0);
    setHoverEstrellas(0);
    setErrorGuardar("");
  };

  const confirmarGuardar = async () => {
    const usuario = getUsuarioActual();
    if (!usuario?.id) {
      setErrorGuardar("No se pudo identificar al usuario. Inicia sesión de nuevo.");
      return;
    }
    try {
      setIsSaving(true);
      setErrorGuardar("");
      const ahora = new Date().toISOString();

      // Actualizar el original + el simplificado en simplifications (si está enlazado).
      if (texto.simplification_id != null) {
        const { error: eSimp } = await supabase
          .from("simplifications")
          .update({
            original_text: originalText,
            simplified_text: simplifiedText,
            updated_at: ahora,
          })
          .eq("id", texto.simplification_id);
        if (eSimp) throw eSimp;
      }

      // Nueva versión (snapshot del texto simplificado).
      await insertarFila("simplification_versions", {
        saved_simplification_id: texto.id,
        content: simplifiedText,
        created_at: ahora,
      });

      // Nueva valoración con las estrellas elegidas.
      await insertarFila("ratings", {
        saved_simplification_id: texto.id,
        user_id: usuario.id,
        score: estrellas,
        created_at: ahora,
      });

      setMostrarModalGuardar(false);
      setEstrellas(0);
      setHoverEstrellas(0);
      setSuccessMsg(
        "Se guardó una nueva versión y su valoración. Míralas en Historial y Valoraciones."
      );
      setErrorMsg("");

      onTextoActualizado({
        ...texto,
        original_text: originalText,
        simplified_text: simplifiedText,
        simplification_updated_at: ahora,
      });
    } catch (e: any) {
      console.error("Error guardando versión:", e);
      setErrorGuardar(e?.message ?? "No se pudo guardar la nueva versión.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-2">
        Texto: {texto.title}
      </h2>

      <h3 className="font-lexend font-semibold text-xl md:text-2xl leading-[150%] text-black mb-2">
        Simplificador de Texto
      </h3>
      <p className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%] mb-2">
        Ingrese un texto menor a {WORD_LIMIT} palabras
      </p>
      <div className="border border-input-border bg-white px-4 py-3 mb-2">
        <textarea
          ref={originalRef}
          value={originalText}
          onChange={(e) => {
            setOriginalText(e.target.value);
            setErrorMsg("");
            setSuccessMsg("");
          }}
          placeholder="Pega o escribe aquí el texto que quieres simplificar"
          className="w-full h-24 font-inter font-normal text-base text-[#1E1E1E] leading-[140%] outline-none resize-none bg-transparent"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <span
          className={`font-lexend text-[13px] ${
            isOverLimit ? "text-red-600" : "text-black"
          }`}
        >
          {wordCount}/{WORD_LIMIT} palabras
        </span>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handlePegar}
            className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded disabled:opacity-50"
            style={{ backgroundColor: "hsl(var(--navy))" }}
          >
            Pegar
          </button>
          <button
            type="button"
            onClick={handleSimplificar}
            disabled={!originalText.trim() || isOverLimit || isSimplifying}
            className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "hsl(var(--navy))" }}
          >
            {isSimplifying ? "Simplificando..." : "Simplificar"}
          </button>
        </div>
      </div>
      {isOverLimit && (
        <p className="text-sm text-red-600 font-inter mb-4">
          El texto supera el límite permitido de {WORD_LIMIT} palabras.
        </p>
      )}

      <h3 className="font-lexend font-semibold text-xl md:text-2xl leading-[150%] text-black mb-2 mt-6">
        Resultado de la Simplificación
      </h3>
      <p className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%] mb-2">
        Texto simplificado
      </p>
      <div className="border border-input-border bg-white px-4 py-3 mb-2">
        <textarea
          value={simplifiedText}
          onChange={(e) => setSimplifiedText(e.target.value)}
          placeholder="Aquí aparece el texto simplificado. Puedes editarlo."
          className="w-full h-24 font-inter font-normal text-base text-[#1E1E1E] leading-[140%] outline-none resize-none bg-transparent"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onRegresar}
          className="text-white font-inter font-medium text-base px-6 h-10 flex items-center justify-center transition-colors rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Regresar
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportar}
            disabled={!simplifiedText.trim()}
            className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "hsl(var(--navy))" }}
          >
            Exportar texto
          </button>
          <button
            type="button"
            onClick={abrirModalGuardar}
            disabled={!simplifiedText.trim()}
            className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "hsl(var(--navy))" }}
          >
            Guardar simplificación
          </button>
        </div>
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600 font-inter mt-3 text-right">
          {errorMsg}
        </p>
      )}
      {successMsg && (
        <p className="text-sm text-green-600 font-inter mt-3 text-right">
          {successMsg}
        </p>
      )}

      {/* Modal de valoración al guardar */}
      {mostrarModalGuardar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={cancelarGuardar}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-inter font-semibold text-xl text-black mb-1">
              Guardar simplificación
            </h2>
            <p className="font-inter font-normal text-sm text-[#666] mb-5">
              Valora esta versión del texto.
            </p>

            <label className="font-inter font-normal text-base text-[#1E1E1E] block mb-2">
              Valoración
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEstrellas(n)}
                  onMouseEnter={() => setHoverEstrellas(n)}
                  onMouseLeave={() => setHoverEstrellas(0)}
                  aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                  className="text-3xl leading-none transition-colors focus:outline-none"
                  style={{
                    color:
                      n <= (hoverEstrellas || estrellas) ? "#f5b301" : "#cbd5e1",
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            {errorGuardar && (
              <p className="font-inter text-sm text-red-600 mt-3">
                {errorGuardar}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={cancelarGuardar}
                disabled={isSaving}
                className="px-6 py-2 font-inter font-normal text-sm text-[#1E1E1E] border border-[#D9D9D9] bg-white hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarGuardar}
                disabled={isSaving || estrellas < 1}
                className="px-6 py-2 font-inter font-medium text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
                style={{ backgroundColor: "hsl(var(--navy))" }}
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <BotonAyuda modulo="Textos Guardados" />
    </div>
  );
}

function HistorialTab({
  texto,
  onRegresar,
  onTextoActualizado,
}: {
  texto: TextoGuardado;
  onRegresar: () => void;
  onTextoActualizado: (texto: TextoGuardado) => void;
}) {
  type Version = {
    id: number;
    numero: number;
    creacion: string | null;
    content: string;
  };

  const [versiones, setVersiones] = useState<Version[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [versionAVer, setVersionAVer] = useState<Version | null>(null);
  const [accion, setAccion] = useState<{
    tipo: "restaurar" | "eliminar";
    version: Version;
  } | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase
        .from("simplification_versions")
        .select("id, content, created_at")
        .eq("saved_simplification_id", texto.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const filas: Version[] = (data ?? []).map((v: any, i: number) => ({
        id: v.id,
        numero: i + 1,
        creacion: v.created_at,
        content: v.content ?? "",
      }));

      // Respaldo: si todavía no hay versiones guardadas, mostrar el texto
      // simplificado original como "Versión 1" (id = -1: no es una fila real).
      if (filas.length === 0 && (texto.simplified_text ?? "").trim() !== "") {
        filas.push({
          id: -1,
          numero: 1,
          creacion: texto.created_at,
          content: texto.simplified_text,
        });
      }

      setVersiones(filas);
    } catch (e: any) {
      console.error("Error cargando historial:", e);
      setErrorMsg(e?.message ?? "No se pudo cargar el historial.");
    } finally {
      setCargando(false);
    }
  }, [texto.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const confirmarAccion = async () => {
    if (!accion) return;
    const { tipo, version } = accion;
    try {
      setProcesando(true);
      setErrorAccion("");

      if (tipo === "eliminar") {
        const { error } = await supabase
          .from("simplification_versions")
          .delete()
          .eq("id", version.id);
        if (error) throw error;
      } else {
        // Restaurar: crear una NUEVA versión con el contenido de la elegida.
        const ahora = new Date().toISOString();
        await insertarFila("simplification_versions", {
          saved_simplification_id: texto.id,
          content: version.content,
          created_at: ahora,
        });
        if (texto.simplification_id != null) {
          await supabase
            .from("simplifications")
            .update({ simplified_text: version.content, updated_at: ahora })
            .eq("id", texto.simplification_id);
        }
        onTextoActualizado({
          ...texto,
          simplified_text: version.content,
          simplification_updated_at: ahora,
        });
      }

      setAccion(null);
      await cargar();
    } catch (e: any) {
      console.error("Error en acción de historial:", e);
      setErrorAccion(e?.message ?? "No se pudo completar la acción.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-12">
        Texto: {texto.title}
      </h2>

      {cargando ? (
        <p className="font-inter text-base text-[#666]">Cargando historial...</p>
      ) : errorMsg ? (
        <p className="font-inter text-base text-red-600">{errorMsg}</p>
      ) : versiones.length === 0 ? (
        <p className="font-inter text-base text-[#666]">
          Este texto todavía no tiene versiones.
        </p>
      ) : (
        <table className="w-full text-left border-collapse font-inter text-base text-[#1E1E1E]">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-3 font-medium">Versión #</th>
              <th className="py-3 font-medium">Fecha Creación</th>
              <th className="py-3 font-medium">Fecha última edición</th>
              <th className="py-3 font-medium text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {versiones.map((item) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="py-3">Versión {item.numero}</td>
                <td className="py-3">{formatearFecha(item.creacion)}</td>
                <td className="py-3">—</td>
                <td className="py-3">
                  <div className="flex gap-4 justify-center">
                    <button
                      type="button"
                      onClick={() => setVersionAVer(item)}
                      className="text-xl text-black hover:text-[#002855] transition-colors"
                      title="Ver"
                    >
                      👁
                    </button>
                    {item.id !== -1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setErrorAccion("");
                            setAccion({ tipo: "restaurar", version: item });
                          }}
                          className="text-xl text-black hover:text-[#002855] transition-colors"
                          title="Restaurar"
                        >
                          🔄
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setErrorAccion("");
                            setAccion({ tipo: "eliminar", version: item });
                          }}
                          className="text-xl text-black hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={onRegresar}
          className="text-white font-inter font-medium text-base px-6 h-10 flex items-center justify-center transition-colors rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Regresar
        </button>
      </div>

      {/* Modal Ver (consultar el contenido de la versión) */}
      {versionAVer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setVersionAVer(null)}
        >
          <div
            className="bg-white w-full max-w-[560px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-inter font-semibold text-xl text-black mb-1">
              Versión {versionAVer.numero}
            </h2>
            <p className="font-inter font-normal text-sm text-[#666] mb-4">
              Creada el {formatearFecha(versionAVer.creacion)}
            </p>
            <div className="border border-input-border bg-[#F5F5F5] p-4 max-h-[320px] overflow-y-auto">
              <p className="font-inter text-base text-[#1E1E1E] leading-[140%] whitespace-pre-wrap">
                {versionAVer.content || "(sin contenido)"}
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setVersionAVer(null)}
                className="px-6 py-2 font-inter font-medium text-sm text-white transition-colors rounded"
                style={{ backgroundColor: "hsl(var(--navy))" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar restaurar / eliminar */}
      {accion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            if (!procesando) setAccion(null);
          }}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-inter font-semibold text-xl text-black mb-1">
              {accion.tipo === "restaurar"
                ? "Restaurar versión"
                : "Eliminar versión"}
            </h2>
            <p className="font-inter font-normal text-base text-[#1E1E1E] mb-5">
              {accion.tipo === "restaurar"
                ? `Se creará una versión nueva con el contenido de la Versión ${accion.version.numero}. El historial actual no se borra.`
                : `¿Seguro que quieres eliminar la Versión ${accion.version.numero}? Esta acción no se puede deshacer.`}
            </p>

            {errorAccion && (
              <p className="font-inter text-sm text-red-600 mb-3">{errorAccion}</p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setAccion(null)}
                disabled={procesando}
                className="px-6 py-2 font-inter font-normal text-sm text-[#1E1E1E] border border-[#D9D9D9] bg-white hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAccion}
                disabled={procesando}
                className={`px-6 py-2 font-inter font-medium text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded ${
                  accion.tipo === "eliminar" ? "bg-red-600 hover:bg-red-700" : ""
                }`}
                style={
                  accion.tipo === "restaurar"
                    ? { backgroundColor: "hsl(var(--navy))" }
                    : undefined
                }
              >
                {procesando
                  ? "Procesando..."
                  : accion.tipo === "restaurar"
                  ? "Restaurar"
                  : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <BotonAyuda modulo="Textos guardados" />
    </div>
  );
}

function ValoracionesTab({
  texto,
  onRegresar,
}: {
  texto: TextoGuardado;
  onRegresar: () => void;
}) {
  const [valoraciones, setValoraciones] = useState<
    { id: number; numero: number; fecha: string | null; score: number }[]
  >([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase
        .from("ratings")
        .select("id, score, created_at")
        .eq("saved_simplification_id", texto.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const filas = (data ?? []).map((r: any, i: number) => ({
        id: r.id,
        numero: i + 1,
        fecha: r.created_at,
        score: Number(r.score) || 0,
      }));
      setValoraciones(filas);
    } catch (e: any) {
      console.error("Error cargando valoraciones:", e);
      setErrorMsg(e?.message ?? "No se pudieron cargar las valoraciones.");
    } finally {
      setCargando(false);
    }
  }, [texto.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const estrellas = (score: number) => {
    const n = Math.max(0, Math.min(5, score));
    return "★".repeat(n) + "☆".repeat(5 - n);
  };

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-12">
        Texto: {texto.title}
      </h2>

      {cargando ? (
        <p className="font-inter text-base text-[#666]">Cargando valoraciones...</p>
      ) : errorMsg ? (
        <p className="font-inter text-base text-red-600">{errorMsg}</p>
      ) : valoraciones.length === 0 ? (
        <p className="font-inter text-base text-[#666]">
          Este texto todavía no tiene valoraciones.
        </p>
      ) : (
        <table className="w-full text-left border-collapse font-inter text-base text-[#1E1E1E]">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-3 font-medium">Título</th>
              <th className="py-3 font-medium">Fecha</th>
              <th className="py-3 font-medium text-center">Valoración</th>
            </tr>
          </thead>

          <tbody>
            {valoraciones.map((item) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="py-3">Versión {item.numero}</td>
                <td className="py-3">{formatearFecha(item.fecha)}</td>
                <td className="py-3 text-center tracking-[2px]">
                  {estrellas(item.score)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={onRegresar}
          className="text-white font-inter font-medium text-base px-6 h-10 flex items-center justify-center transition-colors rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Regresar
        </button>
      </div>
      <BotonAyuda modulo="Textos guardados" />
    </div>
  );
}