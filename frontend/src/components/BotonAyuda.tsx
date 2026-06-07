import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Guia {
  id: number;
  title: string;
  content: string;
  module: string;
  is_active: boolean;
}

interface Props {
  /** Debe coincidir exactamente con el campo 'module' en help_guides */
  modulo: string;
}

// ── Componente ────────────────────────────────────────────────────────────────
const BotonAyuda = ({ modulo }: Props) => {
  const [guia, setGuia]         = useState<Guia | null>(null);
  const [abierto, setAbierto]   = useState(false);
  const [cargando, setCargando] = useState(true);
  const btnRef = useRef<HTMLButtonElement>(null);
  const cerrarBtnRef = useRef<HTMLButtonElement>(null);

  // Carga la guía activa para este módulo
  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from("help_guides")
        .select("id, title, content, module, is_active")
        .eq("module", modulo)
        .eq("is_active", true)
        .limit(1)
        .single();
      setGuia(data ?? null);
      setCargando(false);
    };
    cargar();
  }, [modulo]);

  // Mover foco al cerrar (WCAG 2.4.3)
  useEffect(() => {
    if (abierto) {
      setTimeout(() => cerrarBtnRef.current?.focus(), 50);
    } else {
      btnRef.current?.focus();
    }
  }, [abierto]);

  // Cerrar con Escape (WCAG 2.1.2)
  useEffect(() => {
    if (!abierto) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [abierto]);

  // Si está cargando o no hay guía activa, no renderiza nada
  if (cargando || !guia) return null;

  return (
    <>
      {/* Botón flotante ? */}
      <button
        ref={btnRef}
        onClick={() => setAbierto(true)}
        aria-label={`Abrir guía de ayuda: ${guia.title}`}
        aria-haspopup="dialog"
        className={
          "fixed bottom-6 right-6 z-40 " +
          "w-12 h-12 rounded-full shadow-lg " +
          "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
          "flex items-center justify-center text-xl font-bold " +
          "hover:opacity-90 transition-opacity " +
          "focus-visible:outline-none focus-visible:ring-2 " +
          "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2"
        }
      >
        ?
        <span className="sr-only">Ayuda — {guia.title}</span>
      </button>

      {/* Modal de ayuda */}
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setAbierto(false)}
            aria-hidden="true"
          />

          {/* Diálogo */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ayuda-titulo"
            className="relative z-10 bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
          >
            {/* Encabezado */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[hsl(var(--navy))] text-lg font-bold">?</span>
                  <h2 id="ayuda-titulo" className="text-base font-bold text-foreground">
                    {guia.title}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">Guía de ayuda — {guia.module}</p>
              </div>
              <button
                ref={cerrarBtnRef}
                onClick={() => setAbierto(false)}
                aria-label="Cerrar guía de ayuda"
                className={
                  "p-2 min-h-[44px] min-w-[44px] flex items-center justify-center " +
                  "rounded text-muted-foreground hover:text-foreground hover:bg-muted " +
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] " +
                  "transition-colors"
                }
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Contenido — scrollable */}
            <div className="overflow-y-auto p-6 flex-1">
              <div aria-label="Contenido de la guía de ayuda">
                {guia.content.split("\n").map((linea, i) => {
                  if (!linea.trim()) return <br key={i} />;

                  // Detectar listas numeradas (1. texto)
                  const esNumerado = /^\d+\.\s/.test(linea);
                  // Detectar listas con viñeta (- texto o • texto)
                  const esViñeta = /^[-•]\s/.test(linea);

                  if (esNumerado || esViñeta) {
                    return (
                      <div key={i} className="flex gap-2 mb-2">
                        <span className="text-[hsl(var(--navy))] font-semibold text-sm shrink-0 mt-0.5">
                          {esNumerado ? linea.match(/^\d+\./)?.[0] : "•"}
                        </span>
                        <p className="text-sm text-foreground leading-relaxed">
                          {esNumerado ? linea.replace(/^\d+\.\s/, "") : linea.replace(/^[-•]\s/, "")}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <p key={i} className="text-sm text-foreground leading-relaxed mb-3">
                      {linea}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 pt-0 border-t border-border flex justify-end">
              <button
                onClick={() => setAbierto(false)}
                className={
                  "inline-flex items-center justify-center min-h-[44px] px-6 " +
                  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
                  "text-sm font-medium rounded-md hover:opacity-90 " +
                  "focus-visible:outline-none focus-visible:ring-2 " +
                  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
                  "transition-opacity duration-150"
                }
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BotonAyuda;
