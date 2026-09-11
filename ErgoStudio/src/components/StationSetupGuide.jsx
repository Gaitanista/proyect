import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Hand, Footprints, Lightbulb, Cable, ChevronRight } from "lucide-react";

const STEPS = [
  {
    icon: Monitor,
    title: "Altura de la pantalla",
    detail:
      "Eleva la laptop o el monitor con la base ajustable hasta que el borde superior quede a la altura de tus ojos. Sitúala a un brazo de distancia (50–70 cm).",
  },
  {
    icon: Hand,
    title: "Teclado, mouse y muñecas",
    detail:
      "Usa el soporte independiente para que los codos formen ~90° y las muñecas queden rectas. Si eres zurdo, coloca el mouse a la izquierda con el soporte intercambiable.",
  },
  {
    icon: Footprints,
    title: "Apoyo de pies y espalda",
    detail:
      "Despliega el apoyapiés si tu silla es alta y mantén los pies planos. Apoya la zona lumbar en el respaldo; usa un cojín si hace falta.",
  },
  {
    icon: Lightbulb,
    title: "Iluminación sin reflejos",
    detail:
      "Coloca la luz de lado, nunca frente ni detrás de la pantalla, para reducir reflejos y fatiga visual.",
  },
  {
    icon: Cable,
    title: "Organiza los cables",
    detail:
      "Pasa los cables por el canal organizador para evitar tropiezos y mantener el espacio despejado y lavable.",
  },
];

export default function StationSetupGuide() {
  const [active, setActive] = useState(0);
  const Step = STEPS[active];
  return (
    <div className="rounded-3xl bg-card border border-border p-6 h-full" data-testid="station-guide">
      <h2 className="font-display text-xl font-bold text-foreground mb-1">Guía de la estación</h2>
      <p className="text-sm text-muted-foreground mb-5">Ajusta tu puesto paso a paso.</p>

      <div className="space-y-2">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            onClick={() => setActive(i)}
            data-testid={`guide-step-${i}`}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
              active === i ? "bg-sage-light" : "hover:bg-secondary"
            }`}
          >
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                active === i ? "bg-sage text-white" : "bg-secondary text-muted-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
            </div>
            <span
              className={`text-sm font-medium flex-1 ${
                active === i ? "text-sage-dark" : "text-foreground"
              }`}
            >
              {s.title}
            </span>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                active === i ? "rotate-90 text-sage" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-4 rounded-xl bg-secondary/60 p-4"
          data-testid="guide-detail"
        >
          <div className="flex items-center gap-2 mb-2">
            <Step.icon className="h-4 w-4 text-terracotta" />
            <span className="font-display font-semibold text-sm">{Step.title}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{Step.detail}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
