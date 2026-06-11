import { useState, useEffect, useCallback } from "react";
import BotonAyuda from "../components/BotonAyuda";
import { supabase } from "../lib/supabaseClient";

const BarChartSharpIcon = () => (
  <svg
    width="68"
    height="108"
    viewBox="0 0 68 108"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-12 h-16 sm:w-16 sm:h-24"
  >
    <path
      d="M65.875 104.625H2.125V3.375H6.375V97.875H65.875V104.625Z"
      fill="black"
    />
    <path
      d="M25.5 91.125H10.625V43.875H25.5V91.125ZM44.625 91.125H29.75V33.75H44.625V91.125ZM63.7022 91.125H48.8272V20.25H63.7022V91.125Z"
      fill="black"
    />
  </svg>
);

const BarChartIcon = () => (
  <svg
    width="65"
    height="81"
    viewBox="0 0 65 81"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-10 h-14 sm:w-14 sm:h-20"
  >
    <path
      d="M60.9375 78.4688H6.09375C5.01631 78.4688 3.983 77.9354 3.22113 76.986C2.45926 76.0366 2.03125 74.7489 2.03125 73.4062V5.0625C2.03125 4.39117 2.24526 3.74734 2.62619 3.27264C3.00712 2.79793 3.52378 2.53125 4.0625 2.53125C4.60122 2.53125 5.11788 2.79793 5.49881 3.27264C5.87974 3.74734 6.09375 4.39117 6.09375 5.0625V73.4062H60.9375C61.4762 73.4062 61.9929 73.6729 62.3738 74.1476C62.7547 74.6223 62.9688 75.2662 62.9688 75.9375C62.9688 76.6088 62.7547 77.2527 62.3738 77.7274C61.9929 78.2021 61.4762 78.4688 60.9375 78.4688Z"
      fill="black"
    />
    <path
      d="M19.8047 68.3438H14.7266C13.5144 68.3438 12.352 67.7437 11.4949 66.6756C10.6378 65.6076 10.1563 64.1589 10.1562 62.6484V38.6016C10.1563 37.0911 10.6378 35.6424 11.4949 34.5744C12.352 33.5063 13.5144 32.9062 14.7266 32.9062H19.8047C21.0168 32.9062 22.1793 33.5063 23.0364 34.5744C23.8935 35.6424 24.375 37.0911 24.375 38.6016V62.6484C24.375 64.1589 23.8935 65.6076 23.0364 66.6756C22.1793 67.7437 21.0168 68.3438 19.8047 68.3438ZM38.0859 68.3438H33.0078C31.7957 68.3438 30.6332 67.7437 29.7761 66.6756C28.919 65.6076 28.4375 64.1589 28.4375 62.6484V31.0078C28.4375 29.4973 28.919 28.0487 29.7761 26.9806C30.6332 25.9125 31.7957 25.3125 33.0078 25.3125H38.0859C39.2981 25.3125 40.4605 25.9125 41.3176 26.9806C42.1747 28.0487 42.6562 29.4973 42.6562 31.0078V62.6484C42.6562 64.1589 42.1747 65.6076 41.3176 66.6756C40.4605 67.7437 39.2981 68.3438 38.0859 68.3438ZM56.3215 68.3438H51.2434C50.0312 68.3438 48.8688 67.7437 48.0117 66.6756C47.1546 65.6076 46.673 64.1589 46.673 62.6484V20.8828C46.673 19.3723 47.1546 17.9237 48.0117 16.8556C48.8688 15.7875 50.0312 15.1875 51.2434 15.1875H56.3215C57.5336 15.1875 58.6961 15.7875 59.5532 16.8556C60.4103 17.9237 60.8918 19.3723 60.8918 20.8828V62.6484C60.8918 64.1589 60.4103 65.6076 59.5532 66.6756C58.6961 67.7437 57.5336 68.3438 56.3215 68.3438Z"
      fill="black"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 27 26"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0 opacity-50"
  >
    <path
      d="M26.3413 23.3369L20.277 17.4562C21.737 15.5715 22.5252 13.2773 22.5225 10.92C22.5225 4.89875 17.4707 0 11.2613 0C5.05184 0 0 4.89875 0 10.92C0 16.9412 5.05184 21.84 11.2613 21.84C13.6922 21.8426 16.0581 21.0783 18.0018 19.6625L24.0662 25.5431C24.3731 25.8092 24.7735 25.9513 25.1851 25.9401C25.5967 25.9289 25.9883 25.7654 26.2794 25.4831C26.5706 25.2007 26.7392 24.821 26.7507 24.4219C26.7622 24.0228 26.6158 23.6346 26.3413 23.3369ZM3.2175 10.92C3.2175 9.37731 3.68926 7.86926 4.57312 6.58655C5.45697 5.30385 6.71324 4.3041 8.18304 3.71374C9.65284 3.12338 11.2702 2.96891 12.8305 3.26988C14.3908 3.57084 15.8241 4.31372 16.949 5.40457C18.074 6.49542 18.8401 7.88524 19.1504 9.3983C19.4608 10.9113 19.3015 12.4797 18.6927 13.9049C18.0839 15.3302 17.0529 16.5484 15.7301 17.4055C14.4073 18.2625 12.8522 18.72 11.2613 18.72C9.1287 18.7175 7.08423 17.8949 5.57629 16.4327C4.06834 14.9704 3.22006 12.9879 3.2175 10.92Z"
      fill="black"
    />
  </svg>
);

const FunnelIcon = () => (
  <svg
    width="22"
    height="20"
    viewBox="0 0 28 23"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0 opacity-55"
  >
    <path d="M0 0L10.5 13.2692V20.3462L17.5 23V13.2692L28 0H0Z" fill="black" />
  </svg>
);

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="flex-1 min-w-0 bg-[#F5F5F5] p-6 flex flex-col gap-2">
      <h3 className="font-lexend font-semibold text-base sm:text-lg leading-[150%] text-black">
        {title}
      </h3>
      <div className="flex items-end justify-between">
        <span className="font-lexend font-semibold text-5xl sm:text-7xl lg:text-[96px] leading-[150%] text-black">
          {value}
        </span>
        <div className="mb-2">{icon}</div>
      </div>
    </div>
  );
}

// Usuario logueado (localStorage "usuario"), igual que en Textos guardados.
const getUsuarioActual = () => {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const contarPalabras = (texto: string): number => {
  if (!texto) return 0;
  return texto.trim().split(/\s+/).filter(Boolean).length;
};

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// "2026-01" -> "Ene 2026"
const keyAMes = (key: string) => {
  const [y, m] = key.split("-");
  return `${MESES[parseInt(m, 10) - 1] ?? m} ${y}`;
};

// Lunes de la semana de una fecha ISO -> "YYYY-MM-DD"
const inicioSemana = (iso: string): string => {
  const soloFecha = String(iso).slice(0, 10);
  const d = new Date(`${soloFecha}T12:00:00`); // mediodía evita saltos por zona horaria
  if (isNaN(d.getTime())) return soloFecha;
  const diaLunes0 = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - diaLunes0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

// "2026-06-01" -> "01/06" (inicio de semana)
const etiquetaSemana = (key: string) => {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
};

interface PuntoEvolucion {
  label: string; // "Ene 2026" o "01/06"
  key: string; // clave para ordenar
  total: number;
}

interface Estadisticas {
  totalGeneradas: number;
  totalGuardadas: number;
  promedioPalabras: number;
  evolucionMes: PuntoEvolucion[];
  evolucionSemana: PuntoEvolucion[];
  valoraciones: { score: number; cantidad: number }[];
  categorias: { nombre: string; cantidad: number }[];
  hayDatos: boolean;
}

// ── Gráfico de barras verticales por mes (adaptado del panel de admin) ────────
const GraficoBarrasVertical = ({ datos }: { datos: PuntoEvolucion[] }) => {
  if (datos.length === 0)
    return (
      <p className="font-roboto text-sm text-[#49454F] py-4">
        Sin datos en este período.
      </p>
    );

  const max = Math.max(...datos.map((d) => d.total), 1);
  const W = 520;
  const H = 140;
  const padL = 40;
  const padB = 32;
  const padT = 20;
  const barW = Math.min(40, (W - padL - 16) / datos.length - 6);
  const gap =
    datos.length > 1
      ? (W - padL - 16 - barW * datos.length) / (datos.length - 1)
      : 0;

  const lineas = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: padT + (1 - p) * H,
    val: Math.round(p * max),
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H + padT + padB}`}
      width="100%"
      role="img"
      aria-label="Gráfico de simplificaciones por mes"
    >
      {/* Líneas guía */}
      {lineas.map(({ y, val }) => (
        <g key={val}>
          <line
            x1={padL}
            y1={y}
            x2={W}
            y2={y}
            stroke="#E5E7EB"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#9CA3AF">
            {val}
          </text>
        </g>
      ))}

      {/* Barras */}
      {datos.map((d, i) => {
        const barH = Math.max(3, (d.total / max) * H);
        const x = padL + i * (barW + gap);
        const y = padT + H - barH;
        return (
          <g key={d.key}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill="#002855"
              rx="3"
              opacity="0.9"
            >
              <title>
                {d.label}: {d.total}
              </title>
            </rect>
            <text
              x={x + barW / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize="9"
              fill="#374151"
              fontWeight="600"
            >
              {d.total}
            </text>
            <text
              x={x + barW / 2}
              y={padT + H + padB - 4}
              textAnchor="middle"
              fontSize="8"
              fill="#6B7280"
              transform={
                datos.length > 6
                  ? `rotate(-40, ${x + barW / 2}, ${padT + H + padB - 4})`
                  : undefined
              }
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Eje Y */}
      <line
        x1={padL}
        y1={padT}
        x2={padL}
        y2={padT + H}
        stroke="#D1D5DB"
        strokeWidth="1.5"
      />
    </svg>
  );
};

// ── Gráfico de barras horizontales (adaptado del panel de admin) ──────────────
const GraficoBarrasHorizontal = ({
  datos,
}: {
  datos: { label: string; valor: number }[];
}) => {
  if (datos.length === 0 || datos.every((d) => d.valor === 0))
    return (
      <p className="font-roboto text-sm text-[#49454F] py-4">
        Sin datos en este período.
      </p>
    );

  const max = Math.max(...datos.map((d) => d.valor), 1);
  const FILA = 36;
  const H = datos.length * FILA;
  const W = 360;
  const labelW = 120;
  const barArea = W - labelW - 50;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 12}`}
      width="100%"
      role="img"
      aria-label="Gráfico de barras"
    >
      {datos.map((d, i) => {
        const barW = Math.max(4, (d.valor / max) * barArea);
        const y = i * FILA + 8;
        return (
          <g key={d.label}>
            <text x={0} y={y + 17} fontSize="11" fill="#374151">
              {d.label.length > 16 ? d.label.slice(0, 15) + "…" : d.label}
            </text>
            <rect
              x={labelW}
              y={y + 4}
              width={barW}
              height={18}
              fill="#002855"
              rx="3"
              opacity="0.85"
            >
              <title>
                {d.label}: {d.valor}
              </title>
            </rect>
            <text
              x={labelW + barW + 6}
              y={y + 17}
              fontSize="11"
              fill="#374151"
              fontWeight="600"
            >
              {d.valor}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

function SeccionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0 bg-[#F5F5F5] p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-lexend font-semibold text-base sm:text-lg leading-[150%] text-black">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Index() {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [agrupacion, setAgrupacion] = useState<"mes" | "semana">("mes");

  const cargarEstadisticas = useCallback(async () => {
    const usuario = getUsuarioActual();
    if (!usuario?.id) {
      setError("No se pudo identificar al usuario. Inicia sesión de nuevo.");
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");
    setExportError("");

    try {
      const desde = fechaInicio || null;
      const hasta = fechaFin ? `${fechaFin}T23:59:59` : null;

      // 1) Simplificaciones generadas (+ promedio de palabras + evolución)
      let qSim = supabase
        .from("simplifications")
        .select("id, original_text, created_at")
        .eq("user_id", usuario.id);
      if (desde) qSim = qSim.gte("created_at", desde);
      if (hasta) qSim = qSim.lte("created_at", hasta);
      const { data: sims, error: e1 } = await qSim;
      if (e1) throw e1;

      const totalGeneradas = sims?.length ?? 0;
      const promedioPalabras = totalGeneradas
        ? Math.round(
            (sims ?? []).reduce(
              (acc: number, s: any) =>
                acc + contarPalabras(s.original_text ?? ""),
              0
            ) / totalGeneradas
          )
        : 0;

      const mapaMes = new Map<string, number>();
      const mapaSemana = new Map<string, number>();
      (sims ?? []).forEach((s: any) => {
        if (!s.created_at) return;
        const claveMes = String(s.created_at).slice(0, 7); // YYYY-MM
        mapaMes.set(claveMes, (mapaMes.get(claveMes) ?? 0) + 1);
        const claveSem = inicioSemana(s.created_at); // lunes de la semana
        if (claveSem)
          mapaSemana.set(claveSem, (mapaSemana.get(claveSem) ?? 0) + 1);
      });
      const evolucionMes: PuntoEvolucion[] = [...mapaMes.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, total]) => ({ key, label: keyAMes(key), total }));
      const evolucionSemana: PuntoEvolucion[] = [...mapaSemana.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, total]) => ({ key, label: etiquetaSemana(key), total }));

      // 2) Simplificaciones guardadas
      let qGuard = supabase
        .from("saved_simplifications")
        .select("id, created_at")
        .eq("user_id", usuario.id);
      if (desde) qGuard = qGuard.gte("created_at", desde);
      if (hasta) qGuard = qGuard.lte("created_at", hasta);
      const { data: guardados, error: e2 } = await qGuard;
      if (e2) throw e2;
      const totalGuardadas = guardados?.length ?? 0;
      const guardadosIds = (guardados ?? []).map((g: any) => g.id);

      // 3) Distribución de valoraciones del usuario
      let qRat = supabase
        .from("ratings")
        .select("score, created_at")
        .eq("user_id", usuario.id);
      if (desde) qRat = qRat.gte("created_at", desde);
      if (hasta) qRat = qRat.lte("created_at", hasta);
      const { data: rts, error: e3 } = await qRat;
      if (e3) throw e3;
      const conteoScore = new Map<number, number>();
      (rts ?? []).forEach((r: any) => {
        const sc = Number(r.score) || 0;
        if (sc >= 1 && sc <= 5) conteoScore.set(sc, (conteoScore.get(sc) ?? 0) + 1);
      });
      const valoraciones = [5, 4, 3, 2, 1].map((score) => ({
        score,
        cantidad: conteoScore.get(score) ?? 0,
      }));

      // 4) Categorías más usadas (de los textos guardados del usuario)
      let categorias: { nombre: string; cantidad: number }[] = [];
      if (guardadosIds.length > 0) {
        const { data: rels, error: e4 } = await supabase
          .from("simplification_categories")
          .select("category_id, saved_simplification_id")
          .in("saved_simplification_id", guardadosIds);
        if (e4) throw e4;

        const conteoCat = new Map<number, number>();
        (rels ?? []).forEach((r: any) => {
          conteoCat.set(r.category_id, (conteoCat.get(r.category_id) ?? 0) + 1);
        });

        const catIds = [...conteoCat.keys()];
        if (catIds.length > 0) {
          const { data: cats, error: e5 } = await supabase
            .from("categories")
            .select("id, name")
            .in("id", catIds);
          if (e5) throw e5;

          const nombrePorId = new Map<number, string>();
          (cats ?? []).forEach((c: any) => nombrePorId.set(c.id, c.name));

          categorias = [...conteoCat.entries()]
            .map(([id, cantidad]) => ({
              nombre: nombrePorId.get(id) ?? "Sin nombre",
              cantidad,
            }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 8);
        }
      }

      const hayDatos =
        totalGeneradas > 0 || totalGuardadas > 0 || (rts?.length ?? 0) > 0;

      setStats({
        totalGeneradas,
        totalGuardadas,
        promedioPalabras,
        evolucionMes,
        evolucionSemana,
        valoraciones,
        categorias,
        hayDatos,
      });
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
      setError("No se pudieron cargar las estadísticas.");
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    cargarEstadisticas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportar = () => {
    setExportError("");
    if (!stats || !stats.hayDatos) {
      setExportError(
        "No hay datos en el período seleccionado; no se genera la exportación."
      );
      return;
    }

    try {
      const periodo = `${fechaInicio || "inicio"} a ${fechaFin || "hoy"}`;
      const lineas: string[] = [];
      lineas.push("ESTADÍSTICAS PERSONALES");
      lineas.push(`Período: ${periodo}`);
      lineas.push("");
      lineas.push(`Total de simplificaciones generadas: ${stats.totalGeneradas}`);
      lineas.push(`Total de simplificaciones guardadas: ${stats.totalGuardadas}`);
      lineas.push(
        `Promedio de palabras por solicitud: ${stats.promedioPalabras}`
      );
      lineas.push("");
      const evol =
        agrupacion === "mes" ? stats.evolucionMes : stats.evolucionSemana;
      lineas.push(`Evolución (por ${agrupacion}):`);
      if (evol.length) {
        evol.forEach((e) => lineas.push(`  ${e.label}: ${e.total}`));
      } else {
        lineas.push("  Sin datos.");
      }
      lineas.push("");
      lineas.push("Distribución de valoraciones:");
      stats.valoraciones.forEach((val) =>
        lineas.push(`  ${val.score} estrellas: ${val.cantidad}`)
      );
      lineas.push("");
      lineas.push("Categorías más utilizadas:");
      if (stats.categorias.length) {
        stats.categorias.forEach((c) =>
          lineas.push(`  ${c.nombre}: ${c.cantidad}`)
        );
      } else {
        lineas.push("  Sin datos.");
      }

      const blob = new Blob([lineas.join("\n")], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "estadisticas_personales.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando:", err);
      setExportError("No se pudo generar el archivo de exportación.");
    }
  };

  const v = (n: number | undefined) => (cargando ? "…" : String(n ?? 0));

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="bg-white border border-[#E0E0E0] w-full">
          {/* Header */}
          <div className="p-8 pb-0">
            <h1 className="font-lexend font-semibold text-2xl sm:text-3xl lg:text-[32px] leading-[150%] text-black">
              Estadísticas Personales
            </h1>
          </div>

          {/* Filtros */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-[#F5F5F5] h-[60px] px-4 min-w-[200px] sm:w-[290px]">
              <SearchIcon />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                aria-label="Fecha de inicio"
                className="bg-transparent outline-none w-full font-roboto text-base text-[#49454F] leading-6 tracking-[0.5px]"
              />
            </div>

            <div className="flex items-center gap-2 bg-[#F5F5F5] h-[60px] px-4 min-w-[200px] sm:w-[290px]">
              <FunnelIcon />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                aria-label="Fecha de fin"
                className="bg-transparent outline-none w-full font-roboto text-base text-[#49454F] leading-6 tracking-[0.5px]"
              />
            </div>

            <button
              onClick={cargarEstadisticas}
              disabled={cargando}
              className="h-[33px] px-6 bg-[#002855] text-white font-inter text-sm font-medium leading-[150%] hover:bg-[#001e42] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? "Cargando..." : "Filtrar"}
            </button>
          </div>

          {/* Mensajes */}
          {error && (
            <div className="px-6 sm:px-8">
              <p className="mb-4 text-sm text-red-600 font-inter">{error}</p>
            </div>
          )}
          {!error && stats && !stats.hayDatos && (
            <div className="px-6 sm:px-8">
              <p className="mb-4 text-sm text-[#49454F] font-inter">
                No hay datos en el período seleccionado.
              </p>
            </div>
          )}

          {/* Tarjetas principales */}
          <div className="px-6 sm:px-8 pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <StatCard
                title="Total de Simplificaciones"
                value={v(stats?.totalGeneradas)}
                icon={<BarChartIcon />}
              />
              <StatCard
                title="Simplificaciones guardadas"
                value={v(stats?.totalGuardadas)}
                icon={<BarChartIcon />}
              />
              <StatCard
                title="Promedio de palabras"
                value={v(stats?.promedioPalabras)}
                icon={<BarChartSharpIcon />}
              />
            </div>
          </div>

          {/* Evolución temporal */}
          <div className="px-6 sm:px-8 pb-4">
            <SeccionCard
              title="Evolución de simplificaciones"
              action={
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setAgrupacion("mes")}
                    className={`px-3 py-1 font-inter text-sm transition-colors ${
                      agrupacion === "mes"
                        ? "bg-[#002855] text-white"
                        : "bg-white text-[#002855] border border-[#002855] hover:bg-[#EEF1F5]"
                    }`}
                  >
                    Por mes
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgrupacion("semana")}
                    className={`px-3 py-1 font-inter text-sm transition-colors ${
                      agrupacion === "semana"
                        ? "bg-[#002855] text-white"
                        : "bg-white text-[#002855] border border-[#002855] hover:bg-[#EEF1F5]"
                    }`}
                  >
                    Por semana
                  </button>
                </div>
              }
            >
              <GraficoBarrasVertical
                datos={
                  (agrupacion === "mes"
                    ? stats?.evolucionMes
                    : stats?.evolucionSemana) ?? []
                }
              />
            </SeccionCard>
          </div>

          {/* Valoraciones + Categorías */}
          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <SeccionCard title="Distribución de valoraciones">
                <GraficoBarrasHorizontal
                  datos={(stats?.valoraciones ?? []).map((val) => ({
                    label: `${val.score} estrellas`,
                    valor: val.cantidad,
                  }))}
                />
              </SeccionCard>

              <SeccionCard title="Categorías más utilizadas">
                <GraficoBarrasHorizontal
                  datos={(stats?.categorias ?? []).map((c) => ({
                    label: c.nombre,
                    valor: c.cantidad,
                  }))}
                />
              </SeccionCard>
            </div>
          </div>

          {/* Exportar */}
          <div className="px-6 sm:px-8 pb-10 flex flex-col items-center gap-2">
            {exportError && (
              <p className="text-sm text-red-600 font-inter">{exportError}</p>
            )}
            <button
              onClick={exportar}
              disabled={cargando}
              className="h-[33px] px-6 bg-[#002855] text-white font-inter text-sm font-medium leading-[150%] hover:bg-[#001e42] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Exportar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
