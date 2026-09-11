import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";

const ZONES = [
  { key: "cuello", label: "Cuello" },
  { key: "espalda", label: "Espalda" },
  { key: "munecas", label: "Muñecas" },
  { key: "ojos", label: "Ojos" },
  { key: "fatiga", label: "Fatiga general" },
];

function levelColor(v) {
  if (v <= 3) return "text-emerald-600";
  if (v <= 6) return "text-amber-500";
  return "text-destructive";
}

export default function AssessmentModal({ open, onOpenChange, phase, onSubmit, showNotes }) {
  const [values, setValues] = useState({ cuello: 0, espalda: 0, munecas: 0, ojos: 0, fatiga: 0 });
  const [notas, setNotas] = useState("");

  const title = phase === "pre" ? "Evaluación inicial" : "¿Cómo te sientes ahora?";
  const desc =
    phase === "pre"
      ? "Antes de empezar, indica tu nivel de molestia (0 = ninguna, 10 = mucha)."
      : "Al terminar, vuelve a evaluar tus molestias para comparar el antes y el después.";

  const submit = () => {
    onSubmit(values, showNotes ? notas : "");
    setValues({ cuello: 0, espalda: 0, munecas: 0, ojos: 0, fatiga: 0 });
    setNotas("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="assessment-modal">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {ZONES.map((z) => (
            <div key={z.key} data-testid={`assessment-${z.key}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{z.label}</span>
                <span className={`text-sm font-mono font-semibold ${levelColor(values[z.key])}`}>
                  {values[z.key]}/10
                </span>
              </div>
              <Slider
                value={[values[z.key]]}
                onValueChange={(v) => setValues({ ...values, [z.key]: v[0] })}
                max={10}
                step={1}
                data-testid={`slider-${z.key}`}
              />
            </div>
          ))}

          {showNotes && (
            <Textarea
              placeholder="Notas opcionales (ej. distracciones, comodidad de la estación)…"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              data-testid="assessment-notes"
              className="resize-none"
            />
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={submit}
            data-testid="assessment-submit"
            className="w-full bg-sage hover:bg-sage-dark text-white rounded-full"
          >
            {phase === "pre" ? "Comenzar sesión" : "Guardar sesión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
