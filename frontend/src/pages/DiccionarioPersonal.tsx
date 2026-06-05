import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface WordEntry {
  id: number;
  user_id: number;
  word: string;
  preferred_replacement: string;
  keep_original: boolean;
}

export default function DiccionarioPersonal() {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [originalInput, setOriginalInput] = useState("");
  const [versionInput, setVersionInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editOriginal, setEditOriginal] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [addingWord, setAddingWord] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get current user and fetch words
  useEffect(() => {
    const getUserAndFetchWords = async () => {
      try {
        // Obtener la sesión actual
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Obtener el id de la tabla users usando el email
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("email", session.user.email)
            .single();

          if (userError || !userData) {
            console.error("Error getting user data:", userError);
            setError("Error al obtener datos del usuario");
            setLoading(false);
            return;
          }

          setUserId(userData.id);
          await fetchWords(userData.id);
        } else {
          setError("No hay sesión activa. Por favor inicia sesión.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error getting user:", error);
        setError("Error al obtener la sesión");
        setLoading(false);
      }
    };

    getUserAndFetchWords();

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("email", session.user.email)
          .single();

        if (userData) {
          setUserId(userData.id);
          await fetchWords(userData.id);
        }
      } else {
        setUserId(null);
        setWords([]);
      }
    });

    // Limpiar la suscripción al desmontar
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchWords = async (uid: number) => {
    try {
      const { data, error } = await supabase
        .from("personal_dictionary")
        .select("*")
        .eq("user_id", uid);

      if (error) throw error;
      setWords(data || []);
    } catch (error) {
      console.error("Error fetching words:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setError(null);
    setSuccess(null);

    if (!originalInput.trim()) {
      setError("Por favor ingrese la palabra original");
      return;
    }
    if (!versionInput.trim()) {
      setError("Por favor ingrese la versión personalizada");
      return;
    }
    if (!userId) {
      setError("Usuario no identificado");
      return;
    }

    setAddingWord(true);
    // Comparar si la palabra original es igual a la versión personalizada
    const isKeepOriginal = originalInput.trim().toLowerCase() === versionInput.trim().toLowerCase();
    try {
      const { data, error: insertError } = await supabase
        .from("personal_dictionary")
        .insert([
          {
            user_id: userId,
            word: originalInput.trim(),
            preferred_replacement: versionInput.trim(),
            keep_original: isKeepOriginal,
          },
        ])
        .select();

      if (insertError) {
        console.error("Insert error:", insertError);
        setError(insertError.message || "Error al agregar la palabra");
        return;
      }

      if (data && data.length > 0) {
        setWords((prev) => [data[0], ...prev]);
        setOriginalInput("");
        setVersionInput("");
        setSuccess(`Palabra "${data[0].word}" agregada correctamente`);
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Error inesperado al agregar la palabra");
    } finally {
      setAddingWord(false);
    }
  };

  const handleDelete = async (id: number) => {
    const word = words.find((w) => w.id === id)?.word;
    try {
      const { error } = await supabase
        .from("personal_dictionary")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setWords((prev) => prev.filter((w) => w.id !== id));
      setSuccess(`Palabra "${word}" eliminada correctamente`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (error) {
      console.error("Error deleting word:", error);
      setError("Error al eliminar la palabra");
    }
  };

  const handleStartEdit = (entry: WordEntry) => {
    setEditingId(entry.id);
    setEditOriginal(entry.word);
    setEditVersion(entry.preferred_replacement);
  };

  const handleSaveEdit = async () => {
    if (!editOriginal.trim() || !editVersion.trim() || editingId === null) return;

    try {
      const isKeepOriginal = editOriginal.trim().toLowerCase() === editVersion.trim().toLowerCase();
      const { error } = await supabase
        .from("personal_dictionary")
        .update({
          word: editOriginal.trim(),
          preferred_replacement: editVersion.trim(),
          keep_original: isKeepOriginal,
        })
        .eq("id", editingId);

      if (error) throw error;
      setWords((prev) =>
        prev.map((w) =>
          w.id === editingId
            ? {
                ...w,
                word: editOriginal.trim(),
                preferred_replacement: editVersion.trim(),
                keep_original: isKeepOriginal,
              }
            : w
        )
      );
      setSuccess(`Palabra "${editOriginal.trim()}" actualizada correctamente`);
      setTimeout(() => setSuccess(null), 4000);
      setEditingId(null);
      setEditOriginal("");
      setEditVersion("");
    } catch (error) {
      console.error("Error updating word:", error);
      setError("Error al actualizar la palabra");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditOriginal("");
    setEditVersion("");
  };

  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.preferred_replacement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <p className="font-inter text-base text-[#1E1E1E]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Accessible notifications for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {error && `Error: ${error}`}
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {success && `Éxito: ${success}`}
      </div>

      {/* Edit Modal */}
      {editingId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCancelEdit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-8 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-modal-title" className="font-inter font-semibold text-xl text-black mb-6">
              Edite la palabra guardada
            </h2>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-normal text-base text-[#1E1E1E]">
                  Palabra original
                </label>
                <input
                  type="text"
                  value={editOriginal}
                  onChange={(e) => setEditOriginal(e.target.value)}
                  className="w-full border border-[#D9D9D9] rounded px-4 py-3 font-inter text-base text-[#1E1E1E] outline-none focus:border-[#002855] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-normal text-base text-[#1E1E1E]">
                  Versión personalizada
                </label>
                <input
                  type="text"
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  className="w-full border border-[#D9D9D9] rounded px-4 py-3 font-inter text-base text-[#1E1E1E] outline-none focus:border-[#002855] transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={handleCancelEdit}
                className="px-6 py-2 font-inter font-normal text-sm text-[#1E1E1E] border border-[#D9D9D9] bg-white hover:bg-[#F5F5F5] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 font-inter font-medium text-sm text-white bg-[#002855] hover:bg-[#003d80] transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 px-4 md:px-8 lg:px-12 py-8">
        <div className="bg-white border border-[#E0E0E0] rounded-sm w-full max-w-[1319px] mx-auto px-4 md:px-8 lg:px-[65px] py-8 md:py-12">
          {/* Page Title */}
          <h1 className="font-lexend font-semibold text-2xl md:text-3xl lg:text-[32px] text-black leading-[150%] mb-3">
            Diccionario Personal
          </h1>

          {/* Description */}
          <p className="font-lexend font-light text-sm md:text-[15px] text-black leading-[150%] mb-8 md:mb-10 max-w-[1222px]">
            El diccionario personal permite definir cómo tratar palabras
            específicas durante la simplificación: conservarlas sin cambios o
            asignar una versión personalizada.{" "}
            <br className="hidden md:block" />
            Las sustituciones se aplican tal cual se ingresan. Se recomienda
            usar sustantivos o términos que no cambien de forma.
          </p>

          {/* Add Word Section */}
          <h2 className="font-lexend font-semibold text-2xl md:text-[32px] text-black leading-[150%] mb-4 md:mb-6">
            Agregar Palabra
          </h2>

          {error && (
            <div
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
              role="alert"
            >
              {success}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6">
            {/* Palabra original */}
            <div className="flex flex-col gap-2 flex-1">
              <label htmlFor="original-input" className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
                Palabra original
              </label>
              <input
                id="original-input"
                type="text"
                value={originalInput}
                onChange={(e) => setOriginalInput(e.target.value)}
                placeholder="Ingrese la palabra que desea sustituir"
                className="w-full border border-[#D9D9D9] bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] placeholder:text-[#999] outline-none focus:border-[#002855] transition-colors"
                disabled={addingWord}
                aria-describedby="original-help"
              />
            </div>

            {/* Versión personalizada */}
            <div className="flex flex-col gap-2 flex-1">
              <label htmlFor="version-input" className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
                Versión personalizada
              </label>
              <input
                id="version-input"
                type="text"
                value={versionInput}
                onChange={(e) => setVersionInput(e.target.value)}
                placeholder="Ingrese la versión personalizada"
                className="w-full border border-[#D9D9D9] bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] placeholder:text-[#999] outline-none focus:border-[#002855] transition-colors"
                disabled={addingWord}
                aria-describedby="version-help"
              />
            </div>

            {/* Agregar button */}
            <div className="flex items-end">
              <button
                onClick={handleAdd}
                disabled={addingWord}
                className="flex items-center justify-center gap-2 bg-[#002855] text-white font-inter font-medium text-sm px-6 h-[45px] hover:bg-[#003d80] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={addingWord}
              >
                <Plus size={16} aria-hidden="true" />
                {addingWord ? "Agregando..." : "Agregar"}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#E0E0E0] my-8" />

          {/* Saved Words Section */}
          <h2 className="font-lexend font-semibold text-2xl md:text-[32px] text-black leading-[150%] mb-4 md:mb-6">
            Lista de Palabras Guardadas
          </h2>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="flex-1 bg-[#F5F5F5] flex items-center px-5 h-[60px] max-w-[720px]">
              <Search size={18} className="text-[#49454F] mr-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Inserte la palabra que desea buscar en su diccionario personal"
                className="flex-1 bg-transparent font-roboto text-base text-[#49454F] placeholder:text-[#49454F] outline-none"
              />
            </div>
            <button className="flex items-center justify-center bg-[#002855] text-white font-inter font-medium text-sm px-6 h-[60px] sm:h-[60px] hover:bg-[#003d80] transition-colors">
              Buscar
            </button>
          </div>

          {/* Word cards grid */}
          {filteredWords.length === 0 ? (
            <p className="font-lexend font-light text-[15px] text-[#666] text-center py-12">
              No se encontraron palabras guardadas.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWords.map((entry) => (
                <div
                  key={entry.id}
                  className="border-2 border-[#002855] bg-[#F5F5F5] p-4 flex flex-col justify-between min-h-[109px]"
                >
                  <p className="font-lexend font-light text-[15px] text-black leading-[150%] mb-3">
                    Palabra original: {entry.word}
                    <br />
                    Versión personalizada: {entry.preferred_replacement}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(entry)}
                      className="flex items-center justify-center gap-1.5 bg-[#002855] text-[#F5F5F5] font-inter font-medium text-sm h-[33px] px-4 flex-1 hover:bg-[#003d80] transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="flex items-center justify-center gap-1.5 bg-[#002855] text-[#F5F5F5] font-inter font-medium text-sm h-[33px] px-4 flex-1 hover:bg-[#8B0000] transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
