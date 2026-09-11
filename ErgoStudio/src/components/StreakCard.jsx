import { motion } from "framer-motion";
import { Flame, Target, CalendarCheck } from "lucide-react";
import { Progress } from "./ui/progress";

export default function StreakCard({ racha }) {
  if (!racha) return null;
  const pct = Math.min(100, Math.round((racha.minutos_hoy / Math.max(1, racha.meta_diaria_min)) * 100));

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 text-white bg-gradient-to-br from-amber-500 via-orange-600 to-red-700"
      data-testid="streak-card"
    >
      {/* embers floating up */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {[
          { l: "18%", d: "0s", s: 6 },
          { l: "30%", d: "0.8s", s: 4 },
          { l: "24%", d: "1.5s", s: 5 },
          { l: "38%", d: "0.4s", s: 3 },
        ].map((e, i) => (
          <span
            key={i}
            className="ember absolute bottom-16 rounded-full bg-amber-200"
            style={{ left: e.l, animationDelay: e.d, width: e.s, height: e.s }}
          />
        ))}
      </div>

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-white/85 text-sm font-medium">Racha de estudio</p>
          <div className="flex items-end gap-2 mt-1">
            <motion.span
              key={racha.dias}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-6xl font-extrabold tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
              data-testid="streak-days"
            >
              {racha.dias}
            </motion.span>
            <span className="text-white/85 mb-2">{racha.dias === 1 ? "día" : "días"} en llamas</span>
          </div>
        </div>

        {/* layered flames */}
        <div className="relative h-20 w-20 flex items-end justify-center">
          <span className="absolute inset-0 rounded-full bg-amber-300/30 blur-xl" />
          <Flame className="flame-flicker-2 absolute h-16 w-16 text-amber-300/70" fill="currentColor" strokeWidth={0} style={{ bottom: 2 }} />
          <Flame className="flame-flicker absolute h-14 w-14 text-orange-400" fill="currentColor" strokeWidth={0} style={{ bottom: 4 }} />
          <Flame className="flame-flicker-3 absolute h-9 w-9 text-yellow-200" fill="currentColor" strokeWidth={0} style={{ bottom: 6 }} />
        </div>
      </div>

      <div className="relative mt-5">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="flex items-center gap-1.5 text-white/90">
            <Target className="h-4 w-4" /> Meta de hoy
          </span>
          <span className="font-mono" data-testid="streak-today">
            {racha.minutos_hoy}/{racha.meta_diaria_min} min
          </span>
        </div>
        <Progress value={pct} className="h-2.5 bg-black/20" />
        {racha.meta_cumplida ? (
          <p className="mt-2 text-sm text-white/95 flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4" /> ¡Meta diaria cumplida! Mantén el fuego.
          </p>
        ) : (
          <p className="mt-2 text-sm text-white/85">
            Te faltan {Math.max(0, racha.meta_diaria_min - racha.minutos_hoy)} min para avivar tu racha de hoy.
          </p>
        )}
      </div>

      <div className="relative mt-4 pt-4 border-t border-white/25 flex items-center justify-between text-sm">
        <span className="text-white/85">Sesiones esta semana</span>
        <span className="font-mono font-semibold" data-testid="streak-week">{racha.sesiones_semana}</span>
      </div>
    </div>
  );
}
