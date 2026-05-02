interface PlaceholderProps {
  title: string;
}

export default function Placeholder({ title }: PlaceholderProps) {
  return (
    <div className="min-h-[calc(100vh-90px)] bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="font-lexend font-semibold text-2xl text-[#002855] mb-4">
          {title}
        </h2>
        <p className="font-inter text-base text-[#1E1E1E]/60">
          Esta página está en construcción. Continúa editando para agregar el
          contenido de esta sección.
        </p>
      </div>
    </div>
  );
}
