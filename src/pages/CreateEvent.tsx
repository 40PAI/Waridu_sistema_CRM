import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CreateEventPage = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Criar Novo Evento</CardTitle>
        <CardDescription>
          Preencha os detalhes abaixo para registrar um novo evento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input id="clientName" placeholder="Ex: Empresa Acme" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Pessoa de Contato</Label>
              <Input id="contactPerson" placeholder="Ex: João da Silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefone de Contato</Label>
              <Input id="contactPhone" type="tel" placeholder="(11) 99999-9999" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="eventType">Tipo de Evento</Label>
              <Select>
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporativo">Corporativo</SelectItem>
                  <SelectItem value="casamento">Casamento</SelectItem>
                  <SelectItem value="show">Show/Concerto</SelectItem>
                  <SelectItem value="conferencia">Conferência</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="eventName">Nome do Evento</Label>
            <Input id="eventName" placeholder="Ex: Conferência Anual de Tecnologia" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Data do Evento</Label>
              <Input id="eventDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora de Início</Label>
              <Input id="startTime" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora de Fim</Label>
              <Input id="endTime" type="time" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventLocation">Local do Evento</Label>
            <Input id="eventLocation" placeholder="Ex: Centro de Convenções Morumbi" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipamentos Necessários</Label>
              <Textarea id="equipment" placeholder="Liste os equipamentos de som, luz, vídeo, etc." rows={5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crew">Equipe Necessária</Label>
              <Textarea id="crew" placeholder="Ex: 1 Técnico de Som, 1 Técnico de Luz, 1 VJ" rows={5} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações Adicionais</Label>
            <Textarea id="observations" placeholder="Qualquer detalhe importante, como horários de montagem, restrições do local, etc." />
          </div>

          <Button className="w-full" size="lg">Criar Evento</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateEventPage;