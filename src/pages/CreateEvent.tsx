import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const CreateEventPage = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Criar Novo Evento</CardTitle>
        <CardDescription>
          Preencha os detalhes abaixo para registrar um novo evento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div>
            <Label htmlFor="eventName">Nome do Evento</Label>
            <Input id="eventName" placeholder="Ex: Conferência Anual" />
          </div>
          <div>
            <Label htmlFor="eventDate">Data do Evento</Label>
            <Input id="eventDate" type="date" />
          </div>
          <div>
            <Label htmlFor="eventLocation">Local do Evento</Label>
            <Input id="eventLocation" placeholder="Ex: Centro de Convenções" />
          </div>
          <div>
            <Label htmlFor="eventDescription">Descrição</Label>
            <Textarea id="eventDescription" placeholder="Descreva o evento..." />
          </div>
          <Button className="w-full">Criar Evento</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateEventPage;