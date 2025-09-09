import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const InviteMember = () => {
  return (
    <div className="flex justify-center items-center flex-1">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Convidar Novo Membro</CardTitle>
          <CardDescription>
            Digite o e-mail e selecione a função para enviar um convite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="nome@exemplo.com" type="email" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="role">Função</Label>
                <Select>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="member">Membro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full mt-6">Enviar Convite</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteMember;