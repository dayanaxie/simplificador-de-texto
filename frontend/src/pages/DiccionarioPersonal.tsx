import { useState } from "react";
import { Search, Plus } from "lucide-react";

interface WordEntry {
  id: number;
  original: string;
  version: string;
}

const initialWords: WordEntry[] = [
  { id: 1, original: "Automóvil", version: "Carro" },
  { id: 2, original: "email", version: "correo" },
  { id: 3, original: "teléfono", version: "celular" },
  { id: 4, original: "adquirir", version: "comprar" },
];

export default function Index() {
  const [words, setWords] = useState<WordEntry[]>(initialWords);
  const [originalInput, setOriginalInput] = useState("");
  const [versionInput, setVersionInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editOriginal, setEditOriginal] = useState("");
  const [editVersion, setEditVersion] = useState("");

  const handleAdd = () => {
    if (!originalInput.trim() || !versionInput.trim()) return;
    const newEntry: WordEntry = {
      id: Date.now(),
      original: originalInput.trim(),
      version: versionInput.trim(),
    };
    setWords((prev) => [...prev, newEntry]);
    setOriginalInput("");
    setVersionInput("");
  };

  const handleDelete = (id: number) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  const handleStartEdit = (entry: WordEntry) => {
    setEditingId(entry.id);
    setEditOriginal(entry.original);
    setEditVersion(entry.version);
  };

  const handleSaveEdit = () => {
    if (!editOriginal.trim() || !editVersion.trim()) return;
    setWords((prev) =>
      prev.map((w) =>
        w.id === editingId
          ? { ...w, original: editOriginal.trim(), version: editVersion.trim() }
          : w
      )
    );
    setEditingId(null);
    setEditOriginal("");
    setEditVersion("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditOriginal("");
    setEditVersion("");
  };

  const filteredWords = words.filter(
    (w) =>
      w.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.version.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">

      {/* Edit Modal */}
      {editingId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCancelEdit}
        >
          <div
            className="bg-white w-full max-w-[460px] mx-4 p-8 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-inter font-semibold text-xl text-black mb-6">
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

          <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6">
            {/* Palabra original */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
                Palabra original
              </label>
              <input
                type="text"
                value={originalInput}
                onChange={(e) => setOriginalInput(e.target.value)}
                placeholder="Ingrese la palabra que desea sustituir"
                className="w-full border border-[#D9D9D9] bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] placeholder:text-[#999] outline-none focus:border-[#002855] transition-colors"
              />
            </div>

            {/* Versión personalizada */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-inter font-normal text-base text-[#1E1E1E] leading-[140%]">
                Versión personalizada
              </label>
              <input
                type="text"
                value={versionInput}
                onChange={(e) => setVersionInput(e.target.value)}
                placeholder="Ingrese la versión personalizada"
                className="w-full border border-[#D9D9D9] bg-white px-4 py-3 font-inter text-base text-[#1E1E1E] placeholder:text-[#999] outline-none focus:border-[#002855] transition-colors"
              />
            </div>

            {/* Agregar button */}
            <div className="flex items-end">
              <button
                onClick={handleAdd}
                className="flex items-center justify-center gap-2 bg-[#002855] text-white font-inter font-medium text-sm px-6 h-[45px] hover:bg-[#003d80] transition-colors whitespace-nowrap"
              >
                <Plus size={16} />
                Agregar
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
                    Palabra original: {entry.original}
                    <br />
                    Versión personalizada: {entry.version}
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
