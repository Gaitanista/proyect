import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { Clock, CalendarDays, Coffee, TrendingDown } from "lucide-react";

const ZONE_LABELS = {
  cuello: "Cuello",
  espalda: "Espalda",
  munecas: "Muñecas",
  ojos: "Ojos",
  fatiga: "Fatiga",
};

function Metric({ icon: Icon, label, value, sub, color, testid }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5" data-testid={testid}>
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="font-display text-2xl font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function TrendsPanel({ stats }) {
  if (!stats) return null;
  const { resumen, semanal, promedios_molestias } = stats;
  const horas = (resumen.total_minutos / 60).toFixed(1);
  const radarData = Object.entries(promedios_molestias || {}).map(([k, v]) => ({
    zona: ZONE_LABELS[k] || k,
    valor: v,
  }));

  const maxMin = Math.max(...semanal.map((d) => d.minutos), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric
          icon={Clock}
          label="Tiempo total de foco"
          value={`${horas} h`}
          color="bg-sage-light text-sage-dark"
          testid="metric-total-time"
        />
        <Metric
          icon={CalendarDays}
          label="Sesiones registradas"
          value={resumen.total_sesiones}
          color="bg-terracotta-soft text-terracotta"
          testid="metric-sessions"
        />
        <Metric
          icon={Coffee}
          label="Pausas realizadas"
          value={resumen.total_pausas}
          color="bg-amber/15 text-amber"
          testid="metric-breaks"
        />
        <Metric
          icon={TrendingDown}
          label="Fatiga promedio (post)"
          value={`${resumen.fatiga_post_prom}/10`}
          sub={`Inicial: ${resumen.fatiga_pre_prom}/10`}
          color="bg-sky-100 text-sky-600"
          testid="metric-fatigue"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-3xl bg-card border border-border p-6" data-testid="weekly-chart">
          <h3 className="font-display text-lg font-bold text-foreground mb-1">Estudio esta semana</h3>
          <p className="text-sm text-muted-foreground mb-4">Minutos de foco por día</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={semanal}>
              <XAxis dataKey="dia" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" width={30} />
              <Tooltip
                cursor={{ fill: "hsl(var(--secondary))" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
                formatter={(v) => [`${v} min`, "Foco"]}
              />
              <Bar dataKey="minutos" radius={[8, 8, 0, 0]}>
                {semanal.map((d, i) => (
                  <Cell key={i} fill={d.minutos >= maxMin * 0.66 ? "#3A6F54" : "#A3C4B0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 rounded-3xl bg-card border border-border p-6" data-testid="discomfort-chart">
          <h3 className="font-display text-lg font-bold text-foreground mb-1">Molestias promedio</h3>
          <p className="text-sm text-muted-foreground mb-4">Al terminar (0–10)</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="zona" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Radar dataKey="valor" stroke="#C86D51" fill="#C86D51" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
