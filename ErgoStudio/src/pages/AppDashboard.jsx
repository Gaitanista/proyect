import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Lightbulb, ShieldCheck, Trash2, History } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuth } from "../context/useAuth";
import Header from "../components/Header";
import StudyTimer from "../components/StudyTimer";
import StationSetupGuide from "../components/StationSetupGuide";
import ProfileModal from "../components/ProfileModal";
import TrendsPanel from "../components/TrendsPanel";
import StreakCard from "../components/StreakCard";
import ComparisonPanel from "../components/ComparisonPanel";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../components/ui/alert-dialog";

const ZONE_COLORS = {
  cuello: "bg-rose-100 text-rose-600",
  espalda: "bg-orange-100 text-orange-600",
  munecas: "bg-amber-100 text-amber-600",
  ojos: "bg-sky-100 text-sky-600",
  fatiga: "bg-violet-100 text-violet-600",
};

export default function AppDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, sess] = await Promise.all([api.get("/stats"), api.get("/sessions")]);
      setStats(s.data);
      setSessions(sess.data);
    } catch {
      toast.error("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (payload) => {
    try {
      await api.post("/sessions", payload);
      toast.success("Sesión guardada");
      await load();
    } catch {
      toast.error("No se pudo guardar la sesión");
    }
  };

  const clearHistory = async () => {
    try {
      await api.delete("/sessions");
      toast.success("Historial eliminado");
      await load();
    } catch {
      toast.error("No se pudo eliminar el historial");
    }
  };

  const firstName = user?.name?.split(" ")[0] || "estudiante";

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenProfile={() => setProfileOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Hola, {firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Configura tu estación, inicia una sesión y cuida tu postura mientras estudias.
          </p>
        </motion.div>

        {/* Top: timer + guide */}
        <div className="grid lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-7">
            <StudyTimer profile={user?.profile} onSaveSession={handleSave} />
          </div>
          <div className="lg:col-span-5 space-y-6">
            {!loading && stats && <StreakCard racha={stats.racha} />}
            <StationSetupGuide />
          </div>
        </div>

        {/* Trends */}
        {!loading && stats && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-foreground">Tu progreso</h2>
            </div>
            <TrendsPanel stats={stats} />

            <div className="mt-6">
              <ComparisonPanel comparativa={stats.comparativa} />
            </div>

            {/* Recommendations */}
            <div className="mt-8 rounded-3xl bg-sage-dark p-6 sm:p-8" data-testid="recommendations-panel">
              <div className="flex items-center gap-2 mb-5">
                <Lightbulb className="h-5 w-5 text-amber" />
                <h3 className="font-display text-xl font-bold text-white">Recomendaciones para ti</h3>
              </div>
              {stats.recomendaciones?.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.recomendaciones.map((r) => (
                    <div
                      key={r.zona}
                      className="rounded-2xl bg-white/5 border border-white/10 p-5"
                      data-testid={`rec-${r.zona}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display font-semibold text-white">{r.titulo}</span>
                        <span className="text-xs font-mono text-amber">{r.promedio}/10</span>
                      </div>
                      <ul className="space-y-1.5">
                        {r.consejos.map((c, i) => (
                          <li key={i} className="text-sm text-sage-light/80 flex gap-2">
                            <span className="text-terracotta">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sage-light/80 text-sm">
                  ¡Buen trabajo! No detectamos molestias frecuentes altas. Sigue con tus pausas y buena postura.
                </p>
              )}
              <div className="mt-6 flex items-start gap-2 text-xs text-sage-light/60">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{stats.aviso}</p>
              </div>
            </div>

            {/* History + privacy */}
            <div className="mt-8 rounded-3xl bg-card border border-border p-6" data-testid="history-panel">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-sage" />
                  <h3 className="font-display text-lg font-bold text-foreground">Historial de sesiones</h3>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid="clear-history-button"
                      className="text-destructive hover:bg-destructive/10 rounded-full gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Borrar historial
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-testid="clear-history-dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Borrar todo el historial?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminarán todas tus sesiones y evaluaciones de forma permanente. Guardamos solo los
                        datos necesarios y tú controlas tu privacidad.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="clear-cancel">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={clearHistory}
                        data-testid="clear-confirm"
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Sí, borrar todo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {sessions.length ? (
                <div className="divide-y divide-border">
                  {sessions.slice(0, 8).map((s) => {
                    const worst = Object.entries(s.post || {}).sort((a, b) => b[1] - a[1])[0];
                    return (
                      <div key={s.id} className="flex items-center justify-between py-3" data-testid="history-row">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(s.fecha).toLocaleDateString("es-ES", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.duracion_min} min · {s.pausas_realizadas} pausas
                          </p>
                        </div>
                        {worst && worst[1] > 0 && (
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              ZONE_COLORS[worst[0]] || "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {worst[0]} {worst[1]}/10
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  Aún no hay sesiones. Inicia una desde el temporizador de arriba.
                </p>
              )}
            </div>
          </>
        )}
      </main>

      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
