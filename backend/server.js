import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3001;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3";

const buildSimplifyPrompt = (text) => {
  return `
/no_think

Eres un sistema especializado en simplificación léxica en español.

Tu tarea es simplificar el segmento discursivo recibido aplicando únicamente el criterio: Frecuencia léxica.

Atributo:
Frecuencia léxica.

Uso del atributo en textos complejos:
En los textos complejos se emplean palabras de uso poco frecuente, arcaicas o propias de una variedad particular del español.

Pauta para simplificación:
Sustituir las palabras usadas con baja frecuencia, arcaicas o dialectales por palabras utilizadas comúnmente en el español estándar.

Ejemplo:
Segmento original:
La muestra fue sometida a un análisis pormenorizado en el laboratorio de petrología.

Segmento simplificado:
La muestra fue sometida a un análisis detallado en el laboratorio de petrología.

REGLAS:
- Mantén el mismo significado del texto original.
- Cambia únicamente palabras difíciles, poco frecuentes, arcaicas o dialectales.
- Usa palabras comunes del español estándar.
- No cambies la estructura del texto si no es necesario.
- No dividas oraciones largas.
- No agregues información nueva.
- No elimines información importante.
- Conserva nombres propios, fechas, números y términos técnicos necesarios.
- No expliques el cambio.
- No respondas con listas.
- Responde únicamente con el segmento simplificado.

IMPORTANTE:
El texto entre las etiquetas <texto_original> y </texto_original> es solo el texto que debes simplificar.

<texto_original>
${text}
</texto_original>

Segmento simplificado:
`.trim();
};

const cleanModelResponse = (text) => {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .replace(/^[-•\s]*Segmento simplificado:\s*/i, "")
    .replace(/^["“”]+|["“”]+$/g, "")
    .trim();
};

app.get("/", (req, res) => {
  res.send("Backend del simplificador funcionando correctamente.");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    model: OLLAMA_MODEL,
    criterion: "Frecuencia léxica",
  });
});

app.post("/api/simplify", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Debe enviar un texto para simplificar.",
      });
    }

    const prompt = buildSimplifyPrompt(text.trim());

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        think: false,
        stream: false,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        options: {
          temperature: 0.2,
          top_p: 0.9,
          repeat_penalty: 1.1,
          num_predict: 200,
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

    console.log("Respuesta completa de Ollama:", JSON.stringify(data, null, 2));

    const rawResponse =
      data?.message?.content ||
      data?.response ||
      "";

    const simplifiedText = cleanModelResponse(rawResponse);

    console.log("Respuesta cruda:", rawResponse);
    console.log("Respuesta limpia:", simplifiedText);

    if (!simplifiedText) {
      return res.status(500).json({
        error:
          "El modelo no devolvió una simplificación. Intente de nuevo o use un modelo sin modo pensamiento.",
      });
    }

    return res.json({
      originalText: text,
      simplifiedText,
      criterion: "Frecuencia léxica",
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
  console.log(`Modelo Ollama: ${OLLAMA_MODEL}`);
  console.log("Criterio activo: Frecuencia léxica");
});