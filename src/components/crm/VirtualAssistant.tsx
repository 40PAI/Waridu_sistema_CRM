"use client";

import * as React from "react";
import { useOpenAI } from "@/hooks/useOpenAI";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Project {
  id: number;
  name: string;
  notes?: string;
}

interface FollowUpSuggestion {
  projectId: number;
  suggestions: string[];
}

interface VirtualAssistantProps {
  stagnantProjects: Project[];
}

const VirtualAssistant = ({ stagnantProjects }: VirtualAssistantProps) => {
  const { loading, error, generateFollowUpSuggestions } = useOpenAI();
  const [suggestions, setSuggestions] = React.useState<FollowUpSuggestion[]>([]);

  const handleGenerate = async () => {
    const result = await generateFollowUpSuggestions(stagnantProjects);
    setSuggestions(result);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assistente Virtual</CardTitle>
        <CardDescription>
          Sugestões automáticas de follow-ups para projetos estagnados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stagnantProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum projeto estagnado no momento.</p>
        ) : (
          <>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "Gerando sugestões..." : "Gerar Sugestões"}
            </Button>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="mt-4 space-y-4 max-h-64 overflow-y-auto">
                {suggestions.map(s => {
                  const project = stagnantProjects.find(p => p.id === s.projectId);
                  if (!project) return null;
                  return (
                    <div key={s.projectId} className="border rounded p-3">
                      <h4 className="font-semibold">{project.name}</h4>
                      <ul className="list-disc list-inside text-sm">
                        {s.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VirtualAssistant;