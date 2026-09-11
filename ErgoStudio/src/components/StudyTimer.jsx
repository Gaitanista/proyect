import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Coffee, Brain, Eye, Activity } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import AssessmentModal from "./AssessmentModal";

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 660;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    o.start();
    o.stop(ctx.currentTime + 0.25);
  } catch {
    /* ignore */
  }
}

function notify(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification(title, { body, tag: "ergostudy-reminder", renotify: true });
    }
  } catch {
    /* ignore */
  }
}

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function StudyTimer({ profile, onSaveSession }) {
  const focoMin = profile?.foco_min || 25;
  const pausaMin = profile?.pausa_min || 5;

  const [phase, setPhase] = useState("idle"); // idle | focus | break
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(focoMin * 60);
  const [totalFocus, setTotalFocus] = useState(0);
  const [pausas, setPausas] = useState(0);
  const [reminder, setReminder] = useState(null);

  const [preOpen, setPreOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const preRef = useRef(null);
  const eyeTickRef = useRef(0);

  useEffect(() => {
    if (phase === "idle") setSecondsLeft(focoMin * 60);
  }, [focoMin, phase]);

  const showReminder = useCallback((data) => {
    setReminder(data);
    toast(data.title, { description: data.desc, icon: null });
    notify(data.title, data.desc);
    setTimeout(() => setReminder(null), 8000);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          if (phase === "focus") {
            setTotalFocus((t) => t + 1);
            eyeTickRef.current += 1;
            if (profile?.recordatorio_ojos && eyeTickRef.current >= 20 * 60) {
              eyeTickRef.current = 0;
              showReminder({
                title: "Descanso visual 20-20-20",
                desc: "Mira algo a 6 m de distancia durante 20 segundos.",
                icon: "eye",
              });
            }
            return prev - 1;
          }
          return prev - 1;
        }
        // reached zero
        beep();
        if (phase === "focus") {
          setPausas((p) => p + 1);
          setPhase("break");
          if (profile?.recordatorio_postura || profile?.recordatorio_movimiento) {
            showReminder({
              title: "¡Pausa activa!",
              desc: "Levántate, estira la espalda y mueve manos y piernas.",
              icon: "activity",
            });
          }
          return pausaMin * 60;
        } else {
          setPhase("focus");
          eyeTickRef.current = 0;
          showReminder({
            title: "De vuelta al foco",
            desc: "Revisa tu postura: espalda apoyada y pantalla a la altura de los ojos.",
            icon: "brain",
          });
          return focoMin * 60;
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase, focoMin, pausaMin, profile, showReminder]);

  const handleStart = () => setPreOpen(true);

  const onPreSubmit = (values) => {
    preRef.current = values;
    setPreOpen(false);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") toast.success("Notificaciones activadas para tus pausas");
      });
    }
    setPhase("focus");
    setRunning(true);
    setSecondsLeft(focoMin * 60);
    setTotalFocus(0);
    setPausas(0);
    eyeTickRef.current = 0;
    toast.success("Sesión iniciada. ¡A concentrarse!");
  };

  const handleFinish = () => {
    setRunning(false);
    setPostOpen(true);
  };

  const onPostSubmit = async (values, notas) => {
    setPostOpen(false);
    const duracion = Math.max(1, Math.round(totalFocus / 60));
    await onSaveSession({
      duracion_min: duracion,
      foco_min: focoMin,
      pausa_min: pausaMin,
      pausas_realizadas: pausas,
      pre: preRef.current,
      post: values,
      notas,
    });
    setPhase("idle");
    setSecondsLeft(focoMin * 60);
    setTotalFocus(0);
    setPausas(0);
  };

  const total = phase === "break" ? pausaMin * 60 : focoMin * 60;
  const progress = phase === "idle" ? 0 : ((total - secondsLeft) / total) * 100;
  const R = 130;
  const C = 2 * Math.PI * R;
  const isBreak = phase === "break";

  return (
    <div className="relative rounded-3xl bg-card border border-border p-6 sm:p-8 overflow-hidden" data-testid="study-timer">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Sesión de estudio</h2>
          <p className="text-sm text-muted-foreground">
            {focoMin} min de foco · {pausaMin} min de pausa
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
            phase === "idle"
              ? "bg-secondary text-muted-foreground"
              : isBreak
              ? "bg-terracotta-soft text-terracotta"
              : "bg-sage-light text-sage-dark"
          }`}
          data-testid="timer-phase-badge"
        >
          {phase === "idle" ? "En espera" : isBreak ? "Pausa" : "Concentración"}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-[300px] h-[300px] flex items-center justify-center">
          <svg className="absolute -rotate-90" width="300" height="300">
            <circle cx="150" cy="150" r={R} fill="none" stroke="hsl(var(--secondary))" strokeWidth="14" />
            <circle
              cx="150"
              cy="150"
              r={R}
              fill="none"
              stroke={isBreak ? "#C86D51" : "#3A6F54"}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C - (progress / 100) * C}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="text-center">
            <div className="font-mono text-5xl font-bold text-foreground tabular-nums" data-testid="timer-display">
              {fmt(secondsLeft)}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              {isBreak ? <Coffee className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
              {phase === "idle" ? "Listo para empezar" : isBreak ? "Tómate un respiro" : "Mantén el foco"}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {phase === "idle" ? (
            <Button
              onClick={handleStart}
              data-testid="start-session-button"
              className="bg-sage hover:bg-sage-dark text-white rounded-full px-8 h-12 pulse-ring"
            >
              <Play className="h-5 w-5 mr-2" /> Iniciar sesión
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setRunning((r) => !r)}
                data-testid="pause-resume-button"
                variant="outline"
                className="rounded-full h-12 px-6 border-border"
              >
                {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                onClick={handleFinish}
                data-testid="finish-session-button"
                className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-6 h-12"
              >
                <Square className="h-4 w-4 mr-2" /> Finalizar
              </Button>
            </>
          )}
        </div>

        {phase !== "idle" && (
          <div className="mt-6 flex gap-6 text-sm text-muted-foreground">
            <span data-testid="stat-focus-min">
              <b className="text-foreground font-mono">{Math.round(totalFocus / 60)}</b> min de foco
            </span>
            <span data-testid="stat-breaks">
              <b className="text-foreground font-mono">{pausas}</b> pausas
            </span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {reminder && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mt-6 flex items-start gap-3 rounded-2xl bg-amber/10 border border-amber/30 p-4"
            data-testid="reminder-banner"
          >
            <div className="h-8 w-8 rounded-lg bg-amber/20 flex items-center justify-center shrink-0">
              {reminder.icon === "eye" ? (
                <Eye className="h-4 w-4 text-amber" />
              ) : reminder.icon === "activity" ? (
                <Activity className="h-4 w-4 text-amber" />
              ) : (
                <Brain className="h-4 w-4 text-amber" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">{reminder.title}</p>
              <p className="text-sm text-muted-foreground">{reminder.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AssessmentModal open={preOpen} onOpenChange={setPreOpen} phase="pre" onSubmit={onPreSubmit} />
      <AssessmentModal open={postOpen} onOpenChange={setPostOpen} phase="post" onSubmit={onPostSubmit} showNotes />
    </div>
  );
}
