import * as React from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // added AlertDialogTrigger
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";

interface MultiSelectServicesProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelectServices: React.FC<MultiSelectServicesProps> = ({ selected, onChange, placeholder = "Selecione serviços..." }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const { services, createService } = useServices();
  const { user } = useAuth();
  const canCreateServices = user?.profile?.role ? hasActionPermission(user.profile.role, "services:create") : false;

  const filteredServices = React.useMemo(() => {
    if (!search) return services;
    return services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [services, search]);

  const handleSelect = (serviceId: string) => {
    const newSelected = selected.includes(serviceId)
      ? selected.filter(id => id !== serviceId)
      : [...selected, serviceId];
    onChange(newSelected);
  };

  const handleCreate = async (name: string) => {
    if (!canCreateServices) {
      showError("Você não tem permissão para criar serviços.");
      return;
    }
    if (!name.trim()) return;
    try {
      await createService({ name: name.trim() });
      setOpen(false);
      setSearch("");
    } catch (err: any) {
      showError(err.message || "Erro ao criar serviço");
    }
  };

  const handleRemoveFromClient = (serviceId: string) => {
    onChange(selected.filter(id => id !== serviceId));
    showSuccess("Serviço removido dos interesses do cliente.");
  };

  return (
    <div className="space-y-2">
      <Label>Serviços de Interesse</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-[300px] justify-between">
            {selected.length > 0
              ? `${selected.length} serviço(s) selecionado(s)`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput
              placeholder="Buscar serviço..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {canCreateServices ? (
                  <div className="flex items-center justify-between p-2">
                    <span>Nenhum serviço encontrado.</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreate(search)}
                    >
                      Criar "{search}"
                    </Button>
                  </div>
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum serviço encontrado. Contate o admin para adicionar.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredServices.map((service) => (
                  <CommandItem
                    key={service.id}
                    value={service.id}
                    onSelect={() => handleSelect(service.id)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selected.includes(service.id)
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    {service.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Lista de selecionados com opção de remover do cliente */}
      {selected.length > 0 && (
        <div className="space-y-1 mt-2">
          {selected.map((serviceId) => {
            const service = services.find(s => s.id === serviceId);
            return (
              <div key={serviceId} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">{service?.name || serviceId}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Serviço do Cliente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso remove o serviço apenas dos interesses deste cliente. O serviço permanece disponível globalmente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemoveFromClient(serviceId)}>
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};