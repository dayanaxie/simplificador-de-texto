// Componente reutilizable de diálogo de confirmación
// WCAG 2.2: role="dialog", aria-modal, focus trap, Escape para cerrar

import { useEffect, useRef } from "react";

interface Props {
  titulo: string;
  mensaje: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

const btnAzul =
  "inline-flex items-center justify-center min-h-[44px] px-6 " +
  "bg-[hsl(var(--navy))] text-[hsl(var(--navy-foreground))] " +
  "text-sm font-medium rounded-md hover:opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 " +
  "transition-opacity duration-150";

const DialogoConfirmar = ({ titulo, mensaje, onConfirmar, onCancelar }: Props) => {
  const btnCancelarRef  = useRef<HTMLButtonElement>(null);
  const btnConfirmarRef = useRef<HTMLButtonElement>(null);

  // Foco al botón cancelar al abrir — acción segura por defecto (WCAG 2.4.3)
  useEffect(() => {
    btnCancelarRef.current?.focus();
  }, []);

  // Cerrar con Escape (WCAG 2.1.2)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancelar]);

  // Focus trap entre los dos botones (WCAG 2.1.1)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const elementos = [btnCancelarRef.current, btnConfirmarRef.current].filter(Boolean) as HTMLButtonElement[];
    const primero = elementos[0];
    const ultimo  = elementos[elementos.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    } else {
      if (document.activeElement === ultimo)  { e.preventDefault(); primero.focus(); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden="false">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancelar} aria-hidden="true" />

      {/* Diálogo */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-mensaje"
        onKeyDown={handleKeyDown}
        className="relative z-10 bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6"
      >
        <h2 id="dialogo-titulo" className="text-lg font-bold text-foreground mb-2">
          {titulo}
        </h2>
        <p id="dialogo-mensaje" className="text-sm text-muted-foreground mb-6">
          {mensaje}
        </p>

        <div className="flex gap-3 justify-end">
          <button ref={btnCancelarRef} onClick={onCancelar} className={btnAzul}>
            Cancelar
          </button>
          <button ref={btnConfirmarRef} onClick={onConfirmar} className={btnAzul}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogoConfirmar;
