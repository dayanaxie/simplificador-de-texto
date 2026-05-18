import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:5173"],
  })
);

app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3001;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3";

const buildSimplifyPrompt = (text) => {
  return `
Simplifica el siguiente segmento discursivo dado los siguientes ejemplos.

Instrucciones:
- Mantén el mismo significado del texto original.
- Usa lenguaje más claro y directo.
- No agregues información nueva.
- No elimines ideas importantes.
- Conserva nombres propios, fechas, datos y conceptos relevantes.
- Responde únicamente con el segmento simplificado.
- No expliques lo que hiciste.

Por ejemplo:

- Segmento original: Por ejemplo, considere una panadería que reemplace sus cajeros por ánforas; el pan se coloca en las perchas y se invita a los clientes a tomar el que quieran y comerlo.
- Segmento simplificado: Por ejemplo, una panadería reemplaza sus cajeros por vasijas. Pone el pan en las perchas e invita a los clientes a comer el pan que quieran.

- Segmento original: En cambio, los comerciantes (quienes venden, sean personas o empresas) emiten o reciben facturas por sus ventas y sus compras, donde separan el valor de la mercancía del valor del impuesto y ello determina, cada mes, un saldo a favor del fisco (débito mayor que crédito) o del comerciante (débito menor que crédito).
- Segmento simplificado: En cambio, los comerciantes dan o reciben facturas por sus ventas y compras. Donde separan el precio del producto del impuesto. Esto determina mensualmente un saldo a favor del fisco o del comerciante.

- Segmento original: Pero, inclusive, siendo una persona mayor, Paul Getty trabajó arduamente, aún después de haber hecho su fortuna.
- Segmento simplificado: Todavía siendo una persona mayor, Paul Getty trabajó mucho, incluso después de haber hecho su fortuna.

- Segmento original: Por otro lado, la hierba mala generalmente no tiene uso práctico y no se clasifica como un bien económico.
- Segmento simplificado: Por otro lado, la hierba mala no tiene uso práctico y no se clasifica como un bien económico.

- Segmento original: Se selecciona la celda de entrada y se acepta el cálculo.
- Segmento simplificado: Seleccionamos la celda de entrada y aceptamos el cálculo.

Simplifica el siguiente segmento:

- Segmento original: ${text}
- Segmento simplificado:
`.trim();
};

const cleanModelResponse = (text) => {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^[-•\s]*Segmento simplificado:\s*/i, "")
    .trim();
};

app.post("/api/simplify", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Debe enviar un texto para simplificar.",
      });
    }

    const prompt = buildSimplifyPrompt(text.trim());

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return res.status(500).json({
        error: "Error al comunicarse con Ollama.",
        details: errorText,
      });
    }

    const data = await response.json();

    const simplifiedText = cleanModelResponse(data.response || "");

    return res.json({
      originalText: text,
      simplifiedText,
    });
  } catch (error) {
    console.error("Error en /api/simplify:", error);

    return res.status(500).json({
      error: "Error interno del servidor.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});