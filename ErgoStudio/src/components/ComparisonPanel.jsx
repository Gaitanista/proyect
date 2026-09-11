import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function ComparisonPanel({ comparativa }) {
  if (!comparativa || !comparativa.length) return null;

  const mejoraTotal = comparativa.reduce((acc, c) => acc + c.delta, 0);
  const mejoraProm = Math.round((mejoraTotal / comparativa.length) * 10) / 10;
  const mejoro = mejoraProm > 0;

  return (
    <div className="rounded-3xl bg-card border border-border p-6" data-testid="comparison-panel">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Comparativa antes / después</h3>
          <p className="text-sm text-muted-foreground">
            Molestia media al terminar: tus primeras sesiones vs. las más recientes (0–10, menos es mejor).
          </p>
        </div>
        <div
          className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
            mejoro ? "bg-emerald-100 text-emerald-700" : mejoraProm < 0 ? "bg-rose-100 text-rose-600" : "bg-secondary text-muted-foreground"
          }`}
          data-testid="comparison-badge"
        >
          {mejoro ? <TrendingDown className="h-4 w-4" /> : mejoraProm < 0 ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
          {mejoro ? `−${mejoraProm} de media` : mejoraProm < 0 ? `+${Math.abs(mejoraProm)} de media` : "Sin cambios"}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260} className="mt-4">
        <BarChart data={comparativa} barGap={6}>
          <XAxis dataKey="zona" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
          <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[0, 10]} stroke="hsl(var(--muted-foreground))" width={28} />
          <Tooltip
            cursor={{ fill: "hsl(var(--secondary))" }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar name="Primeras sesiones" dataKey="antes" fill="#D6A241" radius={[6, 6, 0, 0]} />
          <Bar name="Recientes" dataKey="recientes" fill="#3A6F54" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {comparativa.map((c) => (
          <div key={c.zona} className="rounded-xl bg-secondary/60 px-3 py-2" data-testid={`comparison-zone-${c.zona}`}>
            <p className="text-xs text-muted-foreground">{c.zona}</p>
            <p className={`text-sm font-mono font-semibold ${c.delta > 0 ? "text-emerald-600" : c.delta < 0 ? "text-rose-500" : "text-muted-foreground"}`}>
              {c.delta > 0 ? `−${c.delta}` : c.delta < 0 ? `+${Math.abs(c.delta)}` : "0"}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Un valor en verde indica menos molestia que al principio, señal de que tus ajustes ergonómicos están ayudando.
      </p>
    </div>
  );
}
