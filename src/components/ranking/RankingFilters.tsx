import { cn } from "@/lib/utils";
import { RankingPeriod, RankingScope, RankingMetric } from "@/hooks/useRanking";
import { Globe, Users, MapPin, Trophy, Flame, Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RankingFiltersProps {
  period: RankingPeriod;
  setPeriod: (period: RankingPeriod) => void;
  scope: RankingScope;
  setScope: (scope: RankingScope) => void;
  metric: RankingMetric;
  setMetric: (metric: RankingMetric) => void;
  levelFilter: string;
  setLevelFilter: (level: string) => void;
}

const PERIODS: { value: RankingPeriod; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "historical", label: "Histórico" },
];

const SCOPES: { value: RankingScope; label: string; icon: typeof Globe }[] = [
  { value: "global", label: "Global", icon: Globe },
  { value: "circle", label: "Mi círculo", icon: Users },
  { value: "country", label: "Mi país", icon: MapPin },
];

const METRICS: { value: RankingMetric; label: string; icon: typeof Trophy }[] = [
  { value: "xp", label: "XP", icon: Star },
  { value: "streak", label: "Constancia", icon: Flame },
  { value: "victories", label: "Victorias", icon: Trophy },
];

const LEVELS = [
  { value: "all", label: "Todos los niveles" },
  { value: "explorer", label: "Explorador/a" },
  { value: "observer", label: "Observador/a" },
  { value: "regulator", label: "Regulador/a" },
  { value: "guardian", label: "Guardián/a de Límites" },
  { value: "strategist", label: "Estratega" },
  { value: "mentor", label: "Mentor/a" },
];

export function RankingFilters({
  period,
  setPeriod,
  scope,
  setScope,
  metric,
  setMetric,
  levelFilter,
  setLevelFilter,
}: RankingFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Period chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              period === p.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Scope and Metric row */}
      <div className="flex gap-2">
        {/* Scope selector */}
        <div className="flex bg-muted rounded-xl p-1 flex-1">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              onClick={() => setScope(s.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all",
                scope === s.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Metric tabs */}
      <div className="flex bg-muted rounded-xl p-1">
        {METRICS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMetric(m.value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              metric === m.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Level filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Liga:</span>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="flex-1 h-9">
            <SelectValue placeholder="Todos los niveles" />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
