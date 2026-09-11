import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { useAuth } from "../context/useAuth";
import { formatApiErrorDetail } from "../lib/api";

export default function ProfileModal({ open, onOpenChange }) {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState(user?.profile || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(user?.profile || {});
  }, [open, user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({
        estatura: form.estatura ? Number(form.estatura) : null,
        tipo_escritorio: form.tipo_escritorio || null,
        lateralidad: form.lateralidad || "diestro",
        foco_min: Number(form.foco_min) || 25,
        pausa_min: Number(form.pausa_min) || 5,
        meta_diaria_min: Number(form.meta_diaria_min) || 60,
        recordatorio_ojos: form.recordatorio_ojos ?? true,
        recordatorio_postura: form.recordatorio_postura ?? true,
        recordatorio_movimiento: form.recordatorio_movimiento ?? true,
      });
      toast.success("Perfil actualizado");
      onOpenChange(false);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="profile-modal">
        <DialogHeader>
          <DialogTitle className="font-display">Mi perfil</DialogTitle>
          <DialogDescription>Personaliza la estación y tus recordatorios.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <Label>Estatura aproximada (cm)</Label>
            <Input
              type="number"
              value={form.estatura || ""}
              onChange={(e) => set("estatura", e.target.value)}
              placeholder="Ej. 170"
              data-testid="profile-height"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Tipo de escritorio</Label>
            <Select value={form.tipo_escritorio || ""} onValueChange={(v) => set("tipo_escritorio", v)}>
              <SelectTrigger className="mt-1.5" data-testid="profile-desk">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fijo">Escritorio fijo</SelectItem>
                <SelectItem value="elevable">Elevable / de pie</SelectItem>
                <SelectItem value="pequeno">Espacio pequeño</SelectItem>
                <SelectItem value="cama_sofa">Cama / sofá</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Lateralidad</Label>
            <Select value={form.lateralidad || "diestro"} onValueChange={(v) => set("lateralidad", v)}>
              <SelectTrigger className="mt-1.5" data-testid="profile-hand">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diestro">Diestro</SelectItem>
                <SelectItem value="zurdo">Zurdo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label>Minutos de foco</Label>
              <span className="text-sm font-mono text-sage">{form.foco_min || 25} min</span>
            </div>
            <Slider
              value={[form.foco_min || 25]}
              onValueChange={(v) => set("foco_min", v[0])}
              min={10}
              max={90}
              step={5}
              data-testid="profile-focus-slider"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label>Minutos de pausa</Label>
              <span className="text-sm font-mono text-terracotta">{form.pausa_min || 5} min</span>
            </div>
            <Slider
              value={[form.pausa_min || 5]}
              onValueChange={(v) => set("pausa_min", v[0])}
              min={3}
              max={20}
              step={1}
              data-testid="profile-break-slider"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label>Meta diaria de estudio</Label>
              <span className="text-sm font-mono text-sage">{form.meta_diaria_min || 60} min</span>
            </div>
            <Slider
              value={[form.meta_diaria_min || 60]}
              onValueChange={(v) => set("meta_diaria_min", v[0])}
              min={15}
              max={240}
              step={15}
              data-testid="profile-goal-slider"
            />
          </div>

          <div className="space-y-3 pt-2">
            {[
              ["recordatorio_ojos", "Descanso visual (20-20-20)"],
              ["recordatorio_postura", "Recordar postura"],
              ["recordatorio_movimiento", "Mover manos y piernas"],
            ].map(([k, label]) => (
              <div key={k} className="flex items-center justify-between">
                <Label className="cursor-pointer">{label}</Label>
                <Switch
                  checked={form[k] ?? true}
                  onCheckedChange={(v) => set(k, v)}
                  data-testid={`switch-${k}`}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={save}
            disabled={saving}
            data-testid="profile-save-button"
            className="w-full bg-sage hover:bg-sage-dark text-white rounded-full"
          >
            {saving ? "Guardando…" : "Guardar perfil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
