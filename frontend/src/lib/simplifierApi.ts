const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

console.log("API_URL usada:", API_URL);

export async function simplifyText(text: string) {
  const response = await fetch(`${API_URL}/api/simplify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error al simplificar el texto.");
  }

  return data as {
    originalText: string;
    simplifiedText: string;
    criterion?: string;
  };
}