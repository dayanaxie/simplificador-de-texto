import { useCallback, useEffect, useMemo, useState } from "react";
import { simplifyText } from "../lib/simplifierApi";
import { supabase } from "../lib/supabaseClient";

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

interface VersionTexto {
  id: number;
  saved_simplification_id: number;
  content: string;
  created_at: string | null;
}

interface Valoracion {
  id: number;
  saved_simplification_id: number;
  user_id: number | null;
  score: number;
  comment: string | null;
  created_at: string | null;
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

export default function TextosGuardados() {
  const [activeTab, setActiveTab] = useState<TextosTab>("guardados");
  const [textos, setTextos] = useState<TextoGuardado[]>([]);
  const [selectedTexto, setSelectedTexto] = useState<TextoGuardado | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

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
  }, []);

  const seleccionarTexto = (texto: TextoGuardado, tab: TextosTab) => {
    setSelectedTexto(texto);
    setActiveTab(tab);
    setMensaje("");
    setError("");
  };

  const eliminarTexto = async (texto: TextoGuardado) => {
    const confirmar = window.confirm(
      "¿Deseás eliminar el texto guardado: " + texto.title + "?"
    );

    if (!confirmar) return;

    try {
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

      setMensaje("Texto eliminado correctamente.");
    } catch (err) {
      console.error("Error eliminando texto:", err);
      setError("No se pudo eliminar el texto guardado.");
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

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id !== "guardados" && !selectedTexto) {
                      setError(
                        "Primero seleccioná un texto guardado desde la lista."
                      );
                      return;
                    }

                    setActiveTab(tab.id);
                  }}
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

          <div className="p-6 md:p-10 min-h-[400px]">
            {error && (
              <p className="mb-4 text-sm text-red-600 font-inter">{error}</p>
            )}

            {mensaje && (
              <p className="mb-4 text-sm text-green-700 font-inter">
                {mensaje}
              </p>
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
                onEliminar={eliminarTexto}
              />
            )}

            {activeTab === "edicion" && selectedTexto && (
              <EdicionTab
                texto={selectedTexto}
                onTextoActualizado={(textoActualizado) => {
                  setSelectedTexto(textoActualizado);
                  setTextos((prev) =>
                    prev.map((texto) =>
                      texto.id === textoActualizado.id
                        ? textoActualizado
                        : texto
                    )
                  );
                  setMensaje("Texto actualizado correctamente.");
                }}
              />
            )}

            {activeTab === "historial" && selectedTexto && (
              <HistorialTab texto={selectedTexto} />
            )}

            {activeTab === "valoraciones" && selectedTexto && (
              <ValoracionesTab texto={selectedTexto} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

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
    </div>
  );
}

function EdicionTab({
  texto,
  onTextoActualizado,
}: {
  texto: TextoGuardado;
  onTextoActualizado: (texto: TextoGuardado) => void;
}) {
  const [originalText, setOriginalText] = useState(texto.original_text);
  const [simplifiedText, setSimplifiedText] = useState(texto.simplified_text);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const wordCount = countWords(originalText);
  const isOverLimit = wordCount > WORD_LIMIT;

  useEffect(() => {
    setOriginalText(texto.original_text);
    setSimplifiedText(texto.simplified_text);
    setMensaje("");
    setError("");
  }, [texto]);

  const handlePaste = async () => {
    try {
      const contenido = await navigator.clipboard.readText();
      setOriginalText(contenido);
    } catch {
      setError("No se pudo leer el portapapeles. Usa Ctrl + V.");
    }
  };

  const handleSimplificar = async () => {
    if (!originalText.trim() || isOverLimit || isSimplifying) return;

    try {
      setIsSimplifying(true);
      setMensaje("");
      setError("");

      const result = await simplifyText(originalText.trim());
      setSimplifiedText(result.simplifiedText);
      setMensaje("Texto simplificado correctamente.");
    } catch (err) {
      console.error("Error simplificando texto guardado:", err);
      setError("No se pudo simplificar el texto.");
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleGuardar = async () => {
    if (!texto.simplification_id) {
      setError("Este texto no tiene una simplificación asociada.");
      return;
    }

    if (!simplifiedText.trim()) {
      setError("No hay texto simplificado para guardar.");
      return;
    }

    try {
      setSaving(true);
      setMensaje("");
      setError("");

      const { error: updateError } = await supabase
        .from("simplifications")
        .update({
          original_text: originalText,
          simplified_text: simplifiedText,
          status: "completed",
        })
        .eq("id", texto.simplification_id);

      if (updateError) throw updateError;

      const { error: versionError } = await supabase
        .from("simplification_versions")
        .insert([
          {
            saved_simplification_id: texto.id,
            content: simplifiedText,
          },
        ]);

      if (versionError) throw versionError;

      const actualizado: TextoGuardado = {
        ...texto,
        original_text: originalText,
        simplified_text: simplifiedText,
        simplification_updated_at: new Date().toISOString(),
      };

      onTextoActualizado(actualizado);
      setMensaje("Cambios guardados y nueva versión creada.");
    } catch (err) {
      console.error("Error guardando edición:", err);
      setError("No se pudo guardar la edición.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!simplifiedText) return;

    const blob = new Blob([simplifiedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${texto.title}.txt`;
    a.click();

    URL.revokeObjectURL(url);
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
          className="w-full h-24 font-inter font-normal text-base text-[#1E1E1E] leading-[140%] outline-none resize-none bg-transparent"
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
        />
      </div>

      <p
        className={`font-inter text-sm mb-4 ${
          isOverLimit ? "text-red-600" : "text-black"
        }`}
      >
        {wordCount}/{WORD_LIMIT} palabras
      </p>

      <div className="flex justify-end gap-2 mb-8">
        <button
          onClick={handlePaste}
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Pegar
        </button>

        <button
          onClick={handleSimplificar}
          disabled={!originalText.trim() || isOverLimit || isSimplifying}
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded disabled:opacity-50"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          {isSimplifying ? "Simplificando..." : "Simplificar"}
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
          value={simplifiedText}
          onChange={(e) => setSimplifiedText(e.target.value)}
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {mensaje && <p className="mb-4 text-sm text-green-700">{mensaje}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleExport}
          disabled={!simplifiedText}
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded disabled:opacity-50"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Exportar texto
        </button>

        <button
          onClick={handleGuardar}
          disabled={saving || !simplifiedText}
          className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded disabled:opacity-50"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          {saving ? "Guardando..." : "Guardar simplificación"}
        </button>
      </div>
    </div>
  );
}

function HistorialTab({ texto }: { texto: TextoGuardado }) {
  const [versiones, setVersiones] = useState<VersionTexto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarVersiones = async () => {
      try {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
          .from("simplification_versions")
          .select("id, saved_simplification_id, content, created_at")
          .eq("saved_simplification_id", texto.id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        setVersiones(data ?? []);
      } catch (err) {
        console.error("Error cargando versiones:", err);
        setError("No se pudo cargar el historial de versiones.");
      } finally {
        setLoading(false);
      }
    };

    cargarVersiones();
  }, [texto.id]);

  const filas =
    versiones.length > 0
      ? versiones.map((version, index) => ({
          version: "Versión " + (index + 1),
          creacion: version.created_at,
          ultimaEdicion: version.created_at,
        }))
      : [
          {
            version: "Versión actual",
            creacion: texto.created_at,
            ultimaEdicion: texto.simplification_updated_at,
          },
        ];

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-12">
        Texto: {texto.title}
      </h2>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <table className="w-full text-left border-collapse font-inter text-base text-[#1E1E1E]">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-3 font-medium">Versión #</th>
            <th className="py-3 font-medium">Fecha creación</th>
            <th className="py-3 font-medium">Fecha última edición</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={3} className="py-8 text-center text-[#666]">
                Cargando historial...
              </td>
            </tr>
          ) : (
            filas.map((item, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="py-3">{item.version}</td>
                <td className="py-3">{formatearFecha(item.creacion)}</td>
                <td className="py-3">{formatearFecha(item.ultimaEdicion)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ValoracionesTab({ texto }: { texto: TextoGuardado }) {
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargarValoraciones = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("ratings")
        .select("id, saved_simplification_id, user_id, score, comment, created_at")
        .eq("saved_simplification_id", texto.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setValoraciones(data ?? []);
    } catch (err) {
      console.error("Error cargando valoraciones:", err);
      setError("No se pudieron cargar las valoraciones.");
    } finally {
      setLoading(false);
    }
  }, [texto.id]);

  useEffect(() => {
    cargarValoraciones();
  }, [cargarValoraciones]);

  const estrellas = (cantidad: number) => {
    const llenas = "★".repeat(Math.max(0, Math.min(5, cantidad)));
    const vacias = "☆".repeat(5 - Math.max(0, Math.min(5, cantidad)));
    return llenas + vacias;
  };

  const guardarValoracion = async () => {
    const usuario = getUsuarioActual();

    if (!usuario?.id) {
      setError("No se encontró el usuario activo.");
      return;
    }

    try {
      setSaving(true);
      setMensaje("");
      setError("");

      const { error } = await supabase.from("ratings").insert([
        {
          saved_simplification_id: texto.id,
          user_id: usuario.id,
          score,
          comment: comment.trim() || null,
        },
      ]);

      if (error) throw error;

      setComment("");
      setScore(5);
      setMensaje("Valoración guardada correctamente.");
      await cargarValoraciones();
    } catch (err) {
      console.error("Error guardando valoración:", err);
      setError("No se pudo guardar la valoración.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-8">
        Texto: {texto.title}
      </h2>

      <div className="border border-gray-300 p-4 mb-8">
        <h3 className="font-lexend font-semibold text-xl mb-4">
          Agregar valoración
        </h3>

        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div>
            <label className="block mb-1 font-inter">Puntuación</label>
            <select
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="border border-gray-300 px-3 py-2"
            >
              <option value={5}>5 estrellas</option>
              <option value={4}>4 estrellas</option>
              <option value={3}>3 estrellas</option>
              <option value={2}>2 estrellas</option>
              <option value={1}>1 estrella</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block mb-1 font-inter">Comentario</label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentario opcional"
              className="w-full border border-gray-300 px-3 py-2"
            />
          </div>

          <button
            onClick={guardarValoracion}
            disabled={saving}
            className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded disabled:opacity-50"
            style={{ backgroundColor: "hsl(var(--navy))" }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>

        {mensaje && <p className="mt-3 text-sm text-green-700">{mensaje}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <table className="w-full text-left border-collapse font-inter text-base text-[#1E1E1E]">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-3 font-medium">Título</th>
            <th className="py-3 font-medium">Fecha</th>
            <th className="py-3 font-medium text-center">Valoración</th>
            <th className="py-3 font-medium">Comentario</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-[#666]">
                Cargando valoraciones...
              </td>
            </tr>
          ) : valoraciones.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-[#666]">
                Este texto aún no tiene valoraciones.
              </td>
            </tr>
          ) : (
            valoraciones.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="py-3">Valoración {index + 1}</td>
                <td className="py-3">{formatearFecha(item.created_at)}</td>
                <td className="py-3 text-center tracking-[2px]">
                  {estrellas(item.score)}
                </td>
                <td className="py-3">{item.comment || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}