import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { showError, showSuccess } from "@/utils/toast";

interface Location {
  id: string;
  name: string;
}

interface TransferDialogProps {
  materialName: string;
  materialId: string;
  locations: Location[];
  distribution: Record<string, number>;
  onTransfer: (materialId: string, fromLocationId: string, toLocationId: string, quantity: number) => void;
}

export const TransferDialog = ({ materialName, materialId, locations, distribution, onTransfer }: TransferDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const [fromLoc, setFromLoc] = React.useState<string>("");
  const [toLoc, setToLoc] = React.useState<string>("");
  const [qty, setQty] = React.useState<number>(0);

  const fromOptions = locations.filter(l => (distribution[l.id] || 0) > 0);
  const toOptions = locations;

  const handleSubmit = () => {
    if (!fromLoc || !toLoc || !qty) {
      showError("Selecione as localizações e a quantidade.");
      return;
    }
    if (fromLoc === toLoc) {
      showError("As localizações de origem e destino devem ser diferentes.");
      return;
    }
    const available = distribution[fromLoc] || 0;
    if (qty <= 0 || qty > available) {
      showError(`Quantidade inválida. Disponível em origem: ${available}.`);
      return;
    }
    onTransfer(materialId, fromLoc, toLoc, qty);
    showSuccess("Transferência registrada!");
    setOpen(false);
    setFromLoc("");
    setToLoc("");
    setQty(0);
  };

  React.useEffect(() => {
    if (open) {
      const firstFrom = fromOptions[0]?.id || "";
      setFromLoc(firstFrom);
      const firstTo = toOptions.find(l => l.id !== firstFrom)?.id || "";
      setToLoc(firstTo);
      setQty(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Transferir</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir Material</DialogTitle>
          <DialogDescription>Movimentar "{materialName}" entre localizações.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">De</Label>
            <Select value={fromLoc} onValueChange={setFromLoc}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                {fromOptions.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} ({distribution[loc.id] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Para</Label>
            <Select value={toLoc} onValueChange={setToLoc}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent>
                {toOptions.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="qty" className="text-right">Quantidade</Label>
            <Input
              id="qty"
              type="number"
              className="col-span-3"
              value={qty || ""}
              min={1}
              onChange={(e) => setQty(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};