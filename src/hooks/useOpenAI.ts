import { useState } from "react";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const useOpenAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFollowUpSuggestions = async (stagnantProjects: { id: number; name: string; notes?: string }[]) => {
    if (!OPENAI_API_KEY) {
      setError("OpenAI API key não configurada.");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const prompt = `Você é um assistente que sugere follow-ups para projetos comerciais estagnados. Para cada projeto listado, sugira 2 ações práticas para avançar o projeto.

Projetos:
${stagnantProjects.map(p => `- ${p.name}${p.notes ? `: ${p.notes}` : ''}`).join("\n")}

Responda em formato JSON com um array de objetos contendo "projectId" e "suggestions" (array de strings).`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error?.message || "Erro na API OpenAI");
        setLoading(false);
        return [];
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        setError("Resposta vazia da OpenAI");
        setLoading(false);
        return [];
      }

      // Tenta parsear JSON da resposta
      try {
        const suggestions = JSON.parse(content);
        setLoading(false);
        return suggestions;
      } catch (parseError) {
        setError("Erro ao interpretar resposta da OpenAI");
        setLoading(false);
        return [];
      }
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
      setLoading(false);
      return [];
    }
  };

  return {
    loading,
    error,
    generateFollowUpSuggestions,
  };
};