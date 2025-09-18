import * as React from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";

interface MultiSelectServicesProps {
  selected: string[]; // array of service ids
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelectServices: React.FC<MultiSelectServicesProps> = ({ selected, onChange, placeholder = "Selecione serviços..." }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const { services, activeServices, createService } = useServices();
  const { user } = useAuth();
  const canCreateServices = user?.profile?.role ? hasActionPermission(user.profile.role, "services:create") : false;

  // use only active services for selection options
  const options = React.useMemo(() => {
    if (!search) return activeServices;
    return activeServices.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [activeServices, search]);

  // helper to lookup name by id (include inactive so historical labels still resolve)
  const serviceNameById = React.useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [services]);

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
      const created = await createService({ name: name.trim() });
      // automatically select the created service
      onChange([...selected, created.id]);
      setOpen(false);
      setSearch("");
    } catch (err: any) {
      showError(err.message || "Erro ao criar serviço");
    }
  };

  const handleRemoveFromClient = (serviceId: string) => {
    onChange(selected.filter(id => id !== serviceId));
    showSuccess("Serviço removido.");
  };

  return (
    <div className="space-y-2">
      <Label>Serviços</Label>
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
                    Nenhum serviço encontrado.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {options.map((service) => (
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

      {/* Selected chips with ability to remove */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((serviceId) => (
            <div key={serviceId} className="inline-flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-sm">
              <span>{serviceNameById[serviceId] || serviceId}</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-destructive p-0" aria-label="Remover serviço">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover Serviço?</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleRemoveFromClient(serviceId)}>Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};