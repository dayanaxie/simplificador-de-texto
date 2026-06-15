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
  category_id: number | null;
  original_text: string;
  simplified_text: string;
  simplification_updated_at: string | null;
}

const WORD_LIMIT = 500;
const ZONA_HORARIA_CR = "America/Costa_Rica";

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

const normalizarFechaSupabase = (fecha: string) => {
  const fechaLimpia = fecha.trim();

  const tieneZonaHoraria = /([zZ]|[+-]\d{2}:?\d{2})$/.test(fechaLimpia);

  if (tieneZonaHoraria) return fechaLimpia;

  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaLimpia)) return fechaLimpia;

  const fechaConFormatoISO = fechaLimpia.includes("T")
    ? fechaLimpia
    : fechaLimpia.replace(" ", "T");

  return `${fechaConFormatoISO}Z`;
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return "-";

  const fechaConvertida = new Date(normalizarFechaSupabase(fecha));

  if (Number.isNaN(fechaConvertida.getTime())) return "-";

  return new Intl.DateTimeFormat("es-CR", {
    timeZone: ZONA_HORARIA_CR,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(fechaConvertida);
};

const limpiarNombreArchivo = (nombre: string) => {
  const limpio = nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return limpio || "texto-simplificado";
};

const descargarTexto = (contenido: string, filePath: string) => {
  const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filePath;
  a.click();

  URL.revokeObjectURL(url);
};

const getUsuarioActual = () => {
  const usuarioGuardado = localStorage.getItem("usuario");
  return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
};

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
  const [exportandoId, setExportandoId] = useState<number | null>(null);

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
              .select("saved_simplification_id, category_id, user_id")
              .eq("user_id", usuario.id)
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
              .select("id, name, user_id")
              .eq("user_id", usuario.id)
              .in("id", categoryIds)
          : { data: [], error: null };

      if (categoriesError) throw categoriesError;

      const simplificationMap = new Map<number, any>();
      (simplificationsData ?? []).forEach((item: any) => {
        simplificationMap.set(item.id, item);
      });

      const categoryMap = new Map<number, { id: number; name: string }>();
      (categoriesData ?? []).forEach((item: any) => {
        categoryMap.set(item.id, {
          id: item.id,
          name: item.name,
        });
      });

      const relationMap = new Map<number, { id: number; name: string }>();
      (relationData ?? []).forEach((item: any) => {
        const categoria = categoryMap.get(item.category_id);

        if (categoria) {
          relationMap.set(item.saved_simplification_id, categoria);
        }
      });

      const textosConvertidos: TextoGuardado[] = savedRows.map((item: any) => {
        const simplification = item.simplification_id
          ? simplificationMap.get(item.simplification_id)
          : null;

        const categoria = relationMap.get(item.id);

        return {
          id: item.id,
          user_id: item.user_id,
          simplification_id: item.simplification_id,
          title: item.title ?? "Sin título",
          created_at: item.created_at,
          category: categoria?.name ?? "Sin categoría",
          category_id: categoria?.id ?? null,
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

  const regresar = () => {
    setSelectedTexto(null);
    setActiveTab("guardados");
    setMensaje("");
    setError("");
  };

  const actualizarTextoLocal = (textoActualizado: TextoGuardado) => {
    setSelectedTexto(textoActualizado);
    setTextos((prev) =>
      prev.map((texto) =>
        texto.id === textoActualizado.id ? textoActualizado : texto
      )
    );
  };

  const exportarTextoGuardado = useCallback(
    async (texto: TextoGuardado) => {
      if (!texto.simplified_text.trim()) {
        setError("Este texto no tiene contenido simplificado para exportar.");
        setMensaje("");
        throw new Error("Texto sin contenido simplificado.");
      }

      const usuario = getUsuarioActual();
      const userId = texto.user_id || usuario?.id;

      if (!userId) {
        setError("No se encontró el usuario activo.");
        setMensaje("");
        throw new Error("No se encontró el usuario activo.");
      }

      try {
        setExportandoId(texto.id);
        setError("");
        setMensaje("");

        let simplificationId = texto.simplification_id;

        if (!simplificationId) {
          const { data: simplificationData, error: simplificationError } =
            await supabase
              .from("simplifications")
              .insert([
                {
                  user_id: userId,
                  original_text: texto.original_text,
                  simplified_text: texto.simplified_text,
                  status: "completed",
                },
              ])
              .select("id")
              .single();

          if (simplificationError) throw simplificationError;

          simplificationId = simplificationData.id;

          const { error: updateSavedError } = await supabase
            .from("saved_simplifications")
            .update({
              simplification_id: simplificationId,
            })
            .eq("id", texto.id);

          if (updateSavedError) throw updateSavedError;

          const textoActualizado = {
            ...texto,
            simplification_id: simplificationId,
          };

          setTextos((prev) =>
            prev.map((item) =>
              item.id === texto.id ? textoActualizado : item
            )
          );

          if (selectedTexto?.id === texto.id) {
            setSelectedTexto(textoActualizado);
          }
        }

        const ahora = new Date().toISOString();

        const filePath = `${limpiarNombreArchivo(texto.title)}-${ahora
          .slice(0, 19)
          .replace(/[:T]/g, "-")}.txt`;

        await insertarFila("exports", {
          simplification_id: simplificationId,
          file_path: filePath,
          created_at: ahora,
        });

        descargarTexto(texto.simplified_text, filePath);

        setMensaje("Texto exportado y registrado correctamente.");
        setError("");
      } catch (err) {
        console.error("Error exportando texto guardado:", err);
        setError("No se pudo registrar la exportación del texto.");
        setMensaje("");
        throw err;
      } finally {
        setExportandoId(null);
      }
    },
    [selectedTexto]
  );

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
        .eq("saved_simplification_id", texto.id)
        .eq("user_id", texto.user_id);

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

              const isLocked = selectedTexto
                ? tab.id === "guardados"
                : tab.id !== "guardados";

              return (
                <button
                  key={tab.id}
                  type="button"
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
              <p className="mb-4 text-sm text-red-600 font-inter" role="alert">
                {error}
              </p>
            )}

            {mensaje && (
              <p className="mb-4 text-sm text-green-700 font-inter" role="status">
                {mensaje}
              </p>
            )}

            {activeTab === "guardados" && (
              <TextosGuardadosTab
                textos={textos}
                loading={loading}
                exportandoId={exportandoId}
                onEditar={(texto) => seleccionarTexto(texto, "edicion")}
                onHistorial={(texto) => seleccionarTexto(texto, "historial")}
                onValoraciones={(texto) =>
                  seleccionarTexto(texto, "valoraciones")
                }
                onExportar={exportarTextoGuardado}
                onEliminar={(texto) => setTextoAEliminar(texto)}
              />
            )}

            {activeTab === "edicion" && selectedTexto && (
              <EdicionTab
                texto={selectedTexto}
                onRegresar={regresar}
                onTextoActualizado={actualizarTextoLocal}
                onExportarTexto={exportarTextoGuardado}
                onRecargarTextos={cargarTextos}
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

      {textoAEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-eliminar-texto"
          onClick={() => {
            if (!eliminando) setTextoAEliminar(null);
          }}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="titulo-eliminar-texto"
              className="font-inter font-semibold text-xl text-black mb-1"
            >
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

function TextosGuardadosTab({
  textos,
  loading,
  exportandoId,
  onEditar,
  onHistorial,
  onValoraciones,
  onExportar,
  onEliminar,
}: {
  textos: TextoGuardado[];
  loading: boolean;
  exportandoId: number | null;
  onEditar: (texto: TextoGuardado) => void;
  onHistorial: (texto: TextoGuardado) => void;
  onValoraciones: (texto: TextoGuardado) => void;
  onExportar: (texto: TextoGuardado) => Promise<void>;
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
          <label htmlFor="buscar-texto-guardado" className="sr-only">
            Buscar texto guardado por nombre o categoría
          </label>

          <input
            id="buscar-texto-guardado"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Inserte el nombre del texto simplificado"
            className="w-full font-inter font-normal text-base text-[#1E1E1E] leading-none outline-none bg-transparent"
          />
        </div>

        <button
          type="button"
          className="text-white font-inter font-medium text-base px-8 h-12 flex items-center justify-center transition-colors rounded"
          style={{ backgroundColor: "hsl(var(--navy))" }}
        >
          Buscar
        </button>
      </div>

      <table className="w-full text-left border-collapse font-inter text-base text-[#1E1E1E]">
        <caption className="sr-only">
          Lista de textos guardados con opciones de edición, historial,
          valoraciones, exportación y eliminación.
        </caption>

        <thead>
          <tr className="border-b border-gray-300">
            <th scope="col" className="py-3 font-medium">
              Título
            </th>
            <th scope="col" className="py-3 font-medium">
              Categoría
            </th>
            <th scope="col" className="py-3 font-medium">
              Fecha
            </th>
            <th scope="col" className="py-3 font-medium text-center">
              Editar
            </th>
            <th scope="col" className="py-3 font-medium text-center">
              Historial
            </th>
            <th scope="col" className="py-3 font-medium text-center">
              Valoraciones
            </th>
            <th scope="col" className="py-3 font-medium text-center">
              Exportar
            </th>
            <th scope="col" className="py-3 font-medium text-center">
              Eliminar
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-[#666]">
                Cargando textos guardados...
              </td>
            </tr>
          ) : textosFiltrados.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-[#666]">
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
                    type="button"
                    onClick={() => onEditar(texto)}
                    className="px-3 h-9 font-inter font-medium text-sm text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002855]"
                    style={{ backgroundColor: "hsl(var(--navy))" }}
                    aria-label={`Editar el texto ${texto.title}`}
                  >
                    Editar
                  </button>
                </td>

                <td className="py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onHistorial(texto)}
                    className="px-3 h-9 font-inter font-medium text-sm text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002855]"
                    style={{ backgroundColor: "hsl(var(--navy))" }}
                    aria-label={`Ver historial del texto ${texto.title}`}
                  >
                    Historial
                  </button>
                </td>

                <td className="py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onValoraciones(texto)}
                    className="px-3 h-9 font-inter font-medium text-sm text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002855]"
                    style={{ backgroundColor: "hsl(var(--navy))" }}
                    aria-label={`Ver valoraciones del texto ${texto.title}`}
                  >
                    Valoraciones
                  </button>
                </td>

                <td className="py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onExportar(texto)}
                    disabled={
                      !texto.simplified_text.trim() || exportandoId === texto.id
                    }
                    className="px-3 h-9 font-inter font-medium text-sm text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002855] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "hsl(var(--navy))" }}
                    aria-label={`Exportar el texto ${texto.title}`}
                  >
                    {exportandoId === texto.id ? "Exportando..." : "Exportar"}
                  </button>
                </td>

                <td className="py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onEliminar(texto)}
                    className="px-3 h-9 font-inter font-medium text-sm text-white bg-red-600 hover:bg-red-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                    aria-label={`Eliminar el texto ${texto.title}`}
                  >
                    Eliminar
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

function EdicionTab({
  texto,
  onRegresar,
  onTextoActualizado,
  onExportarTexto,
  onRecargarTextos,
}: {
  texto: TextoGuardado;
  onRegresar: () => void;
  onTextoActualizado: (texto: TextoGuardado) => void;
  onExportarTexto: (texto: TextoGuardado) => Promise<void>;
  onRecargarTextos: () => Promise<void>;
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
  const [isExporting, setIsExporting] = useState(false);

  const [title, setTitle] = useState(texto.title);
  const [categorias, setCategorias] = useState<
    { id: number; name: string; user_id?: number }[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    texto.category_id ? String(texto.category_id) : ""
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingData, setIsSavingData] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [errorEliminarCategoria, setErrorEliminarCategoria] = useState("");

  const originalRef = useRef<HTMLTextAreaElement | null>(null);
  const wordCount = countWords(originalText);
  const isOverLimit = wordCount > WORD_LIMIT;

  useEffect(() => {
    setTitle(texto.title);
    setSelectedCategoryId(texto.category_id ? String(texto.category_id) : "");
    setNewCategoryName("");
    setOriginalText(texto.original_text);
    setSimplifiedText(texto.simplified_text);
  }, [texto]);

  useEffect(() => {
    const cargarCategorias = async () => {
      const usuario = getUsuarioActual();

      if (!usuario?.id) {
        setCategorias([]);
        return;
      }

      const { data, error } = await supabase
        .from("categories")
        .select("id, name, user_id")
        .eq("user_id", usuario.id)
        .order("name", { ascending: true });

      if (!error) {
        setCategorias(data ?? []);
      }
    };

    cargarCategorias();
  }, []);

  const obtenerOCrearCategoria = async (): Promise<{
    id: number | null;
    name: string;
  }> => {
    const usuario = getUsuarioActual();

    if (!usuario?.id) {
      throw new Error("No se encontró el usuario activo.");
    }

    if (!selectedCategoryId) {
      return {
        id: null,
        name: "Sin categoría",
      };
    }

    if (selectedCategoryId !== "new") {
      const categoryId = Number(selectedCategoryId);
      const categoria = categorias.find((item) => item.id === categoryId);

      return {
        id: categoryId,
        name: categoria?.name ?? "Sin categoría",
      };
    }

    const nombreCategoria = newCategoryName.trim();

    if (!nombreCategoria) {
      throw new Error("Debe escribir el nombre de la nueva categoría.");
    }

    const { data: existentes, error: searchError } = await supabase
      .from("categories")
      .select("id, name, user_id")
      .eq("user_id", usuario.id)
      .ilike("name", nombreCategoria)
      .limit(1);

    if (searchError) throw searchError;

    if (existentes && existentes.length > 0) {
      return {
        id: existentes[0].id,
        name: existentes[0].name,
      };
    }

    const ahora = new Date().toISOString();

    const { data: nuevaCategoria, error: categoryError } = await supabase
      .from("categories")
      .insert([
        {
          name: nombreCategoria,
          user_id: usuario.id,
          created_at: ahora,
        },
      ])
      .select("id, name, user_id")
      .single();

    if (categoryError) throw categoryError;

    setCategorias((prev) =>
      [...prev, nuevaCategoria].sort((a, b) => a.name.localeCompare(b.name))
    );

    return {
      id: nuevaCategoria.id,
      name: nuevaCategoria.name,
    };
  };

  const guardarDatosTexto = async () => {
    const usuario = getUsuarioActual();

    if (!usuario?.id) {
      setErrorMsg("No se encontró el usuario activo.");
      setSuccessMsg("");
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Debe escribir un título para el texto guardado.");
      setSuccessMsg("");
      return;
    }

    if (selectedCategoryId === "new" && !newCategoryName.trim()) {
      setErrorMsg("Debe escribir el nombre de la nueva categoría.");
      setSuccessMsg("");
      return;
    }

    try {
      setIsSavingData(true);
      setErrorMsg("");
      setSuccessMsg("");

      const ahora = new Date().toISOString();
      const categoria = await obtenerOCrearCategoria();

      const { error: titleError } = await supabase
        .from("saved_simplifications")
        .update({ title: title.trim() })
        .eq("id", texto.id)
        .eq("user_id", usuario.id);

      if (titleError) throw titleError;

      const { error: deleteCategoryError } = await supabase
        .from("simplification_categories")
        .delete()
        .eq("saved_simplification_id", texto.id)
        .eq("user_id", usuario.id);

      if (deleteCategoryError) throw deleteCategoryError;

      if (categoria.id !== null) {
        await insertarFila("simplification_categories", {
          saved_simplification_id: texto.id,
          category_id: categoria.id,
          user_id: usuario.id,
          created_at: ahora,
        });
      }

      onTextoActualizado({
        ...texto,
        title: title.trim(),
        category: categoria.name,
        category_id: categoria.id,
        original_text: originalText,
        simplified_text: simplifiedText,
      });

      setSelectedCategoryId(categoria.id ? String(categoria.id) : "");
      setNewCategoryName("");
      setSuccessMsg("Datos del texto actualizados correctamente.");
    } catch (e: any) {
      console.error("Error actualizando datos del texto:", e);
      setErrorMsg(e?.message ?? "No se pudieron actualizar los datos del texto.");
      setSuccessMsg("");
    } finally {
      setIsSavingData(false);
    }
  };

  const quitarCategoria = async () => {
    const usuario = getUsuarioActual();

    if (!usuario?.id) {
      setErrorMsg("No se encontró el usuario activo.");
      setSuccessMsg("");
      return;
    }

    try {
      setIsSavingData(true);
      setErrorMsg("");
      setSuccessMsg("");

      const { error } = await supabase
        .from("simplification_categories")
        .delete()
        .eq("saved_simplification_id", texto.id)
        .eq("user_id", usuario.id);

      if (error) throw error;

      onTextoActualizado({
        ...texto,
        title: title.trim() || texto.title,
        category: "Sin categoría",
        category_id: null,
        original_text: originalText,
        simplified_text: simplifiedText,
      });

      setSelectedCategoryId("");
      setNewCategoryName("");
      setSuccessMsg("Categoría quitada correctamente.");
    } catch (e: any) {
      console.error("Error quitando categoría:", e);
      setErrorMsg(e?.message ?? "No se pudo quitar la categoría.");
      setSuccessMsg("");
    } finally {
      setIsSavingData(false);
    }
  };

  const abrirModalEliminarCategoria = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setErrorEliminarCategoria("");

    if (!selectedCategoryId || selectedCategoryId === "new") {
      setErrorMsg("Debe seleccionar una categoría existente para eliminar.");
      return;
    }

    const categoryId = Number(selectedCategoryId);

    if (Number.isNaN(categoryId)) {
      setErrorMsg("La categoría seleccionada no es válida.");
      return;
    }

    const categoria = categorias.find((item) => item.id === categoryId);

    if (!categoria) {
      setErrorMsg("No se encontró la categoría seleccionada.");
      return;
    }

    setCategoriaAEliminar({
      id: categoria.id,
      name: categoria.name,
    });
  };

  const cerrarModalEliminarCategoria = () => {
    if (isDeletingCategory) return;

    setCategoriaAEliminar(null);
    setErrorEliminarCategoria("");
  };

  const confirmarEliminarCategoria = async () => {
    const usuario = getUsuarioActual();

    if (!usuario?.id) {
      setErrorEliminarCategoria("No se encontró el usuario activo.");
      return;
    }

    if (!categoriaAEliminar) return;

    try {
      setIsDeletingCategory(true);
      setIsSavingData(true);
      setErrorMsg("");
      setSuccessMsg("");
      setErrorEliminarCategoria("");

      const { error: relationError } = await supabase
        .from("simplification_categories")
        .delete()
        .eq("category_id", categoriaAEliminar.id)
        .eq("user_id", usuario.id);

      if (relationError) throw relationError;

      const { error: categoryError } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoriaAEliminar.id)
        .eq("user_id", usuario.id);

      if (categoryError) throw categoryError;

      setCategorias((prev) =>
        prev.filter((item) => item.id !== categoriaAEliminar.id)
      );

      onTextoActualizado({
        ...texto,
        title: title.trim() || texto.title,
        category: "Sin categoría",
        category_id: null,
        original_text: originalText,
        simplified_text: simplifiedText,
      });

      setSelectedCategoryId("");
      setNewCategoryName("");
      setCategoriaAEliminar(null);
      setSuccessMsg("Categoría eliminada correctamente.");

      await onRecargarTextos();
    } catch (e: any) {
      console.error("Error eliminando categoría:", e);
      setErrorEliminarCategoria(
        e?.message ?? "No se pudo eliminar la categoría."
      );
    } finally {
      setIsDeletingCategory(false);
      setIsSavingData(false);
    }
  };

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

  const handleExportar = async () => {
    if (!simplifiedText.trim() || isExporting) return;

    try {
      setIsExporting(true);
      setErrorMsg("");
      setSuccessMsg("");

      await onExportarTexto({
        ...texto,
        original_text: originalText,
        simplified_text: simplifiedText,
      });

      setSuccessMsg("Texto exportado y registrado correctamente.");
    } catch (error) {
      console.error("Error exportando desde edición:", error);
      setErrorMsg("No se pudo exportar el texto.");
    } finally {
      setIsExporting(false);
    }
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
      setErrorGuardar(
        "No se pudo identificar al usuario. Inicia sesión de nuevo."
      );
      return;
    }

    if (estrellas < 1 || estrellas > 5) {
      setErrorGuardar("Debe seleccionar una valoración entre 1 y 5 estrellas.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorGuardar("");

      const ahora = new Date().toISOString();

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

      await insertarFila("simplification_versions", {
        saved_simplification_id: texto.id,
        content: simplifiedText,
        created_at: ahora,
      });

      await insertarFila("ratings", {
        saved_simplification_id: texto.id,
        user_id: usuario.id,
        score: estrellas,
        comment: null,
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

      <section className="border border-gray-300 bg-white p-5 mb-8 rounded">
        <h3 className="font-lexend font-semibold text-xl md:text-2xl leading-[150%] text-black mb-4">
          Datos del texto guardado
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="titulo-texto-guardado"
              className="font-inter font-normal text-base text-[#1E1E1E] block mb-2"
            >
              Título
            </label>

            <input
              id="titulo-texto-guardado"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="w-full border border-input-border bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] outline-none focus:border-[#002855]"
            />
          </div>

          <div>
            <label
              htmlFor="categoria-texto-guardado"
              className="font-inter font-normal text-base text-[#1E1E1E] block mb-2"
            >
              Categoría
            </label>

            <select
              id="categoria-texto-guardado"
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="w-full border border-input-border bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] outline-none focus:border-[#002855]"
            >
              <option value="">Sin categoría</option>

              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.name}
                </option>
              ))}

              <option value="new">Crear nueva categoría</option>
            </select>
          </div>
        </div>

        {selectedCategoryId === "new" && (
          <div className="mt-4">
            <label
              htmlFor="nueva-categoria-texto-guardado"
              className="font-inter font-normal text-base text-[#1E1E1E] block mb-2"
            >
              Nueva categoría
            </label>

            <input
              id="nueva-categoria-texto-guardado"
              type="text"
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              placeholder="Ejemplo: Educación, Finanzas, Salud"
              className="w-full border border-input-border bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] outline-none focus:border-[#002855]"
            />
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={quitarCategoria}
            disabled={isSavingData || texto.category_id === null}
            className="px-5 h-10 font-inter font-medium text-sm text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Quitar categoría
          </button>

          <button
            type="button"
            onClick={abrirModalEliminarCategoria}
            disabled={
              isSavingData || !selectedCategoryId || selectedCategoryId === "new"
            }
            className="px-5 h-10 font-inter font-medium text-sm text-white bg-red-700 hover:bg-red-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Eliminar categoría
          </button>

          <button
            type="button"
            onClick={guardarDatosTexto}
            disabled={isSavingData || !title.trim()}
            className="px-5 h-10 font-inter font-medium text-sm text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "hsl(var(--navy))" }}
          >
            {isSavingData ? "Guardando..." : "Guardar datos"}
          </button>
        </div>
      </section>

      <h3 className="font-lexend font-semibold text-xl md:text-2xl leading-[150%] text-black mb-2">
        Simplificador de Texto
      </h3>

      <p className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%] mb-2">
        Ingrese un texto menor a {WORD_LIMIT} palabras
      </p>

      <div className="border border-input-border bg-white px-4 py-3 mb-2">
        <label htmlFor="texto-original-edicion" className="sr-only">
          Texto original para simplificar
        </label>

        <textarea
          id="texto-original-edicion"
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
        <p className="text-sm text-red-600 font-inter mb-4" role="alert">
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
        <label htmlFor="texto-simplificado-edicion" className="sr-only">
          Texto simplificado editable
        </label>

        <textarea
          id="texto-simplificado-edicion"
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
            disabled={!simplifiedText.trim() || isExporting}
            className="text-white font-inter font-medium text-base px-4 h-10 flex items-center justify-center transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "hsl(var(--navy))" }}
          >
            {isExporting ? "Exportando..." : "Exportar texto"}
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
        <p
          className="text-sm text-red-600 font-inter mt-3 text-right"
          role="alert"
        >
          {errorMsg}
        </p>
      )}

      {successMsg && (
        <p
          className="text-sm text-green-600 font-inter mt-3 text-right"
          role="status"
        >
          {successMsg}
        </p>
      )}

      {mostrarModalGuardar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-guardar-simplificacion"
          onClick={cancelarGuardar}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="titulo-guardar-simplificacion"
              className="font-inter font-semibold text-xl text-black mb-1"
            >
              Guardar simplificación
            </h2>

            <p className="font-inter font-normal text-sm text-[#666] mb-5">
              Valora esta versión del texto.
            </p>

            <fieldset>
              <legend className="font-inter font-normal text-base text-[#1E1E1E] block mb-2">
                Valoración
              </legend>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEstrellas(n)}
                    onMouseEnter={() => setHoverEstrellas(n)}
                    onMouseLeave={() => setHoverEstrellas(0)}
                    aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                    aria-pressed={estrellas === n}
                    className="text-3xl leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002855]"
                    style={{
                      color:
                        n <= (hoverEstrellas || estrellas)
                          ? "#f5b301"
                          : "#cbd5e1",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </fieldset>

            {errorGuardar && (
              <p className="font-inter text-sm text-red-600 mt-3" role="alert">
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

      {categoriaAEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-eliminar-categoria"
          onClick={cerrarModalEliminarCategoria}
        >
          <div
            className="bg-white w-full max-w-[500px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="titulo-eliminar-categoria"
              className="font-inter font-semibold text-xl text-black mb-2"
            >
              Eliminar categoría
            </h2>

            <p className="font-inter text-sm text-[#666] mb-4">
              ¿Seguro que quieres eliminar la categoría{" "}
              <span className="font-semibold">{categoriaAEliminar.name}</span>?
              Esta categoría se quitará de todos los textos que la usen. Esta
              acción no se puede deshacer.
            </p>

            {errorEliminarCategoria && (
              <p className="font-inter text-sm text-red-600 mb-3" role="alert">
                {errorEliminarCategoria}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={cerrarModalEliminarCategoria}
                disabled={isDeletingCategory}
                className="px-6 py-2 font-inter font-normal text-sm text-[#1E1E1E] border border-[#D9D9D9] bg-white hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarEliminarCategoria}
                disabled={isDeletingCategory}
                className="px-6 py-2 font-inter font-medium text-sm text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                {isDeletingCategory ? "Eliminando..." : "Eliminar categoría"}
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
  }, [texto.id, texto.created_at, texto.simplified_text]);

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
        <p className="font-inter text-base text-red-600" role="alert">
          {errorMsg}
        </p>
      ) : versiones.length === 0 ? (
        <p className="font-inter text-base text-[#666]">
          Este texto todavía no tiene versiones.
        </p>
      ) : (
        <table className="w-full text-left border-collapse font-inter text-base text-[#1E1E1E]">
          <caption className="sr-only">
            Historial de versiones del texto {texto.title}.
          </caption>

          <thead>
            <tr className="border-b border-gray-300">
              <th scope="col" className="py-3 font-medium">
                Versión #
              </th>
              <th scope="col" className="py-3 font-medium">
                Fecha de creación
              </th>
              <th scope="col" className="py-3 font-medium text-center">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {versiones.map((item) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="py-3">Versión {item.numero}</td>
                <td className="py-3">{formatearFecha(item.creacion)}</td>

                <td className="py-3">
                  <div
                    className="flex flex-wrap gap-2 justify-center"
                    role="group"
                    aria-label={`Acciones para la Versión ${item.numero}`}
                  >
                    <button
                      type="button"
                      onClick={() => setVersionAVer(item)}
                      className="px-3 h-9 font-inter font-medium text-sm text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002855]"
                      style={{ backgroundColor: "hsl(var(--navy))" }}
                      aria-label={`Ver contenido de la Versión ${item.numero}`}
                    >
                      Ver
                    </button>

                    {item.id !== -1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setErrorAccion("");
                            setAccion({ tipo: "restaurar", version: item });
                          }}
                          className="px-3 h-9 font-inter font-medium text-sm text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002855]"
                          style={{ backgroundColor: "hsl(var(--navy))" }}
                          aria-label={`Restaurar la Versión ${item.numero}`}
                        >
                          Restaurar
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setErrorAccion("");
                            setAccion({ tipo: "eliminar", version: item });
                          }}
                          className="px-3 h-9 font-inter font-medium text-sm text-white bg-red-600 hover:bg-red-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                          aria-label={`Eliminar la Versión ${item.numero}`}
                        >
                          Eliminar
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

      {versionAVer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-version"
          onClick={() => setVersionAVer(null)}
        >
          <div
            className="bg-white w-full max-w-[560px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="titulo-version"
              className="font-inter font-semibold text-xl text-black mb-1"
            >
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

      {accion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-accion-historial"
          onClick={() => {
            if (!procesando) setAccion(null);
          }}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="titulo-accion-historial"
              className="font-inter font-semibold text-xl text-black mb-1"
            >
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
              <p className="font-inter text-sm text-red-600 mb-3" role="alert">
                {errorAccion}
              </p>
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
  type Valoracion = {
    id: number;
    numero: number;
    fecha: string | null;
    score: number;
  };

  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [valoracionAEditar, setValoracionAEditar] =
    useState<Valoracion | null>(null);
  const [valoracionAEliminar, setValoracionAEliminar] =
    useState<Valoracion | null>(null);

  const [editScore, setEditScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const usuario = getUsuarioActual();

      let query = supabase
        .from("ratings")
        .select("id, score, created_at")
        .eq("saved_simplification_id", texto.id)
        .order("created_at", { ascending: true });

      if (usuario?.id) {
        query = query.eq("user_id", usuario.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const filas: Valoracion[] = (data ?? []).map((r: any, i: number) => ({
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

  const abrirEditar = (valoracion: Valoracion) => {
    setValoracionAEditar(valoracion);
    setEditScore(valoracion.score);
    setHoverScore(0);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const cerrarEditar = () => {
    if (procesando) return;

    setValoracionAEditar(null);
    setEditScore(0);
    setHoverScore(0);
  };

  const confirmarEditar = async () => {
    if (!valoracionAEditar) return;

    if (editScore < 1 || editScore > 5) {
      setErrorMsg("Debe seleccionar una valoración entre 1 y 5 estrellas.");
      return;
    }

    try {
      setProcesando(true);
      setErrorMsg("");
      setSuccessMsg("");

      const usuario = getUsuarioActual();

      let query = supabase
        .from("ratings")
        .update({ score: editScore })
        .eq("id", valoracionAEditar.id);

      if (usuario?.id) {
        query = query.eq("user_id", usuario.id);
      }

      const { error } = await query;

      if (error) throw error;

      setValoraciones((prev) =>
        prev.map((item) =>
          item.id === valoracionAEditar.id
            ? {
                ...item,
                score: editScore,
              }
            : item
        )
      );

      setValoracionAEditar(null);
      setEditScore(0);
      setHoverScore(0);
      setSuccessMsg("Valoración actualizada correctamente.");
    } catch (e: any) {
      console.error("Error actualizando valoración:", e);
      setErrorMsg(e?.message ?? "No se pudo actualizar la valoración.");
    } finally {
      setProcesando(false);
    }
  };

  const abrirEliminar = (valoracion: Valoracion) => {
    setValoracionAEliminar(valoracion);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const cerrarEliminar = () => {
    if (procesando) return;
    setValoracionAEliminar(null);
  };

  const confirmarEliminar = async () => {
    if (!valoracionAEliminar) return;

    try {
      setProcesando(true);
      setErrorMsg("");
      setSuccessMsg("");

      const usuario = getUsuarioActual();

      let query = supabase
        .from("ratings")
        .delete()
        .eq("id", valoracionAEliminar.id);

      if (usuario?.id) {
        query = query.eq("user_id", usuario.id);
      }

      const { error } = await query;

      if (error) throw error;

      setValoraciones((prev) =>
        prev
          .filter((item) => item.id !== valoracionAEliminar.id)
          .map((item, index) => ({
            ...item,
            numero: index + 1,
          }))
      );

      setValoracionAEliminar(null);
      setSuccessMsg("Valoración eliminada correctamente.");
    } catch (e: any) {
      console.error("Error eliminando valoración:", e);
      setErrorMsg(e?.message ?? "No se pudo eliminar la valoración.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div>
      <h2 className="font-lexend font-semibold text-2xl md:text-[32px] leading-[150%] text-black mb-12">
        Texto: {texto.title}
      </h2>

      {errorMsg && (
        <p className="font-inter text-base text-red-600 mb-4" role="alert">
          {errorMsg}
        </p>
      )}

      {successMsg && (
        <p className="font-inter text-base text-green-600 mb-4" role="status">
          {successMsg}
        </p>
      )}

      {cargando ? (
        <p className="font-inter text-base text-[#666]">
          Cargando valoraciones...
        </p>
      ) : valoraciones.length === 0 ? (
        <p className="font-inter text-base text-[#666]">
          Este texto todavía no tiene valoraciones.
        </p>
      ) : (
        <table className="w-full text-left border-collapse font-inter text-base text-[#1E1E1E]">
          <caption className="sr-only">
            Valoraciones registradas para el texto {texto.title}.
          </caption>

          <thead>
            <tr className="border-b border-gray-300">
              <th scope="col" className="py-3 font-medium">
                Título
              </th>

              <th scope="col" className="py-3 font-medium">
                Fecha
              </th>

              <th scope="col" className="py-3 font-medium text-center">
                Valoración
              </th>

              <th scope="col" className="py-3 font-medium text-center">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {valoraciones.map((item) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="py-3">Valoración {item.numero}</td>

                <td className="py-3">{formatearFecha(item.fecha)}</td>

                <td
                  className="py-3 text-center tracking-[2px]"
                  aria-label={`${item.score} de 5 estrellas`}
                >
                  {estrellas(item.score)}
                </td>

                <td className="py-3">
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEditar(item)}
                      className="text-white font-inter font-medium text-sm px-4 h-9 rounded transition-colors"
                      style={{ backgroundColor: "hsl(var(--navy))" }}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirEliminar(item)}
                      className="text-white font-inter font-medium text-sm px-4 h-9 rounded bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
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

      {valoracionAEditar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-editar-valoracion"
          onClick={cerrarEditar}
        >
          <div
            className="bg-white w-full max-w-[500px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="titulo-editar-valoracion"
              className="font-inter font-semibold text-xl text-black mb-2"
            >
              Editar valoración
            </h2>

            <p className="font-inter text-sm text-[#666] mb-5">
              Modifica la puntuación de esta valoración.
            </p>

            <fieldset>
              <legend className="font-inter text-base text-[#1E1E1E] mb-2">
                Valoración
              </legend>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEditScore(n)}
                    onMouseEnter={() => setHoverScore(n)}
                    onMouseLeave={() => setHoverScore(0)}
                    aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                    aria-pressed={editScore === n}
                    className="text-3xl leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002855]"
                    style={{
                      color:
                        n <= (hoverScore || editScore) ? "#f5b301" : "#cbd5e1",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={cerrarEditar}
                disabled={procesando}
                className="px-6 py-2 font-inter font-normal text-sm text-[#1E1E1E] border border-[#D9D9D9] bg-white hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarEditar}
                disabled={procesando || editScore < 1}
                className="px-6 py-2 font-inter font-medium text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
                style={{ backgroundColor: "hsl(var(--navy))" }}
              >
                {procesando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {valoracionAEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-eliminar-valoracion"
          onClick={cerrarEliminar}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-6 shadow-lg rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="titulo-eliminar-valoracion"
              className="font-inter font-semibold text-xl text-black mb-2"
            >
              Eliminar valoración
            </h2>

            <p className="font-inter text-sm text-[#666]">
              ¿Seguro que deseas eliminar esta valoración? Esta acción no se
              puede deshacer.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={cerrarEliminar}
                disabled={procesando}
                className="px-6 py-2 font-inter font-normal text-sm text-[#1E1E1E] border border-[#D9D9D9] bg-white hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarEliminar}
                disabled={procesando}
                className="px-6 py-2 font-inter font-medium text-sm text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                {procesando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BotonAyuda modulo="Textos guardados" />
    </div>
  );
}
