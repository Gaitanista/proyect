import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Armchair,
  Timer,
  LineChart,
  ShieldCheck,
  Eye,
  MoveHorizontal,
  ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import heroImg from "@/assets/hero.png";

const features = [
  { icon: Timer, title: "Temporizador con pausas", desc: "Sesiones de foco con recordatorios de descanso configurables (25/5, 50/10)." },
  { icon: Eye, title: "Descanso visual 20-20-20", desc: "Avisos para relajar la vista y evitar la fatiga ocular." },
  { icon: MoveHorizontal, title: "Cambios de postura", desc: "Alertas para mover manos, piernas y corregir la espalda." },
  { icon: LineChart, title: "Panel de tendencias", desc: "Molestias frecuentes y horas de estudio en gráficos semanales." },
  { icon: Armchair, title: "Guía de la estación", desc: "Ajusta pantalla, muñecas y apoyo de pies paso a paso." },
  { icon: ShieldCheck, title: "Preventivo, no médico", desc: "Recomendaciones educativas. Tú controlas y borras tus datos." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background grain-overlay relative overflow-hidden">
      {/* Nav */}
      <header className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2" data-testid="brand-logo">
          <div className="h-9 w-9 rounded-xl bg-sage flex items-center justify-center">
            <Armchair className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-sage-dark">
            ErgoStudy
          </span>
        </div>
        <Link to="/auth" data-testid="nav-login-link">
          <Button variant="ghost" className="text-sage-dark hover:bg-sage-light rounded-full">
            Entrar
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-terracotta-soft text-terracotta text-sm font-medium px-4 py-1.5 mb-6">
            <ShieldCheck className="h-4 w-4" /> Herramienta preventiva para estudiantes
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-sage-dark leading-[1.05]">
            Estudia horas
            <br />
            <span className="text-terracotta">sin acabar adolorido</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
            ErgoStudy combina una estación de estudio ergonómica modular con una app que
            registra tus sesiones, te recuerda las pausas y evalúa tus molestias para
            cuidar tu postura, muñecas y vista.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" data-testid="hero-cta-start">
              <Button
                size="lg"
                className="bg-sage hover:bg-sage-dark text-white rounded-full px-8 h-12 text-base group"
              >
                Empezar gratis
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="#features" data-testid="hero-cta-learn">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base border-sage-border text-sage-dark hover:bg-sage-light"
              >
                Cómo funciona
              </Button>
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-sage/10 rounded-[2rem] blur-2xl" />
          <img
            src={heroImg}
            alt="Escritorio de estudio ergonómico"
            className="relative rounded-[2rem] shadow-2xl w-full object-cover aspect-[4/3]"
            data-testid="hero-image"
          />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 bg-sage-dark py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white max-w-xl">
            Todo lo que necesitas para estudiar mejor
          </h2>
          <p className="mt-3 text-sage-light/80 max-w-lg">
            Una app ligera y responsive que puedes usar desde el móvil, sin instalar nada.
          </p>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors"
                data-testid={`feature-card-${i}`}
              >
                <div className="h-11 w-11 rounded-xl bg-terracotta/90 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display font-semibold text-lg text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-sage-light/70 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-20 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-sage-dark">
          Cuida tu cuerpo mientras aprendes
        </h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Regístrate y prueba una sesión completa con datos de demostración ya cargados.
        </p>
        <Link to="/auth" data-testid="footer-cta">
          <Button
            size="lg"
            className="mt-8 bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-10 h-12"
          >
            Crear mi cuenta
          </Button>
        </Link>
        <p className="mt-16 text-xs text-muted-foreground max-w-lg mx-auto">
          ErgoStudy es una herramienta preventiva y educativa. No diagnostica ni sustituye
          la valoración de un profesional de la salud.
        </p>
      </section>
    </div>
  );
}
