export const ZONA_HORARIA_CR = "America/Costa_Rica";

export const formatearFechaHoraCR = (fecha?: string | null) => {
  if (!fecha) return "-";

  return new Intl.DateTimeFormat("es-CR", {
    timeZone: ZONA_HORARIA_CR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
};

export const formatearFechaCR = (fecha?: string | null) => {
  if (!fecha) return "-";

  return new Intl.DateTimeFormat("es-CR", {
    timeZone: ZONA_HORARIA_CR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(fecha));
};

export const formatearHoraCR = (fecha?: string | null) => {
  if (!fecha) return "-";

  return new Intl.DateTimeFormat("es-CR", {
    timeZone: ZONA_HORARIA_CR,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
};