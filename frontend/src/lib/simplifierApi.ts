export async function simplifyText(text: string) {
  const response = await fetch(`/api/simplify`, {
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