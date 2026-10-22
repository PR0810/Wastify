import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
};

export function StatCard({ icon: Icon, label, value, color = 'emerald' }: StatCardProps) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    teal: 'bg-teal-50 text-teal-600',
    purple: 'bg-purple-50 text-purple-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  gray: 'bg-slate-100 text-slate-600',
  rose: 'bg-rose-50 text-rose-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  lime: 'bg-lime-50 text-lime-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  pink: 'bg-pink-50 text-pink-600',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-600',
  sky: 'bg-sky-50 text-sky-600',
  slate: 'bg-slate-100 text-slate-600',
    violet: 'bg-violet-50 text-violet-600',
    lightblue: 'bg-sky-50 text-sky-600',
    lightgreen: 'bg-lime-50 text-lime-600',
    darkgreen: 'bg-emerald-50 text-emerald-600',
    darkblue: 'bg-blue-50 text-blue-600',
    darkred: 'bg-red-50 text-red-600',
    darkamber: 'bg-amber-50 text-amber-600',
    darkteal: 'bg-teal-50 text-teal-600',
    darkgray: 'bg-slate-100 text-slate-600',
    darkpurple: 'bg-purple-50 text-purple-600',
    darkorange: 'bg-orange-50 text-orange-600',
    darkpink: 'bg-pink-50 text-pink-600',
    darkcyan: 'bg-cyan-50 text-cyan-600',
    darkindigo: 'bg-indigo-50 text-indigo-600',
    darklime: 'bg-lime-50 text-lime-600',
    darkyellow: 'bg-yellow-50 text-yellow-600',
    darkfuchsia: 'bg-fuchsia-50 text-fuchsia-600',
    darksky: 'bg-sky-50 text-sky-600',
    darkslate: 'bg-slate-100 text-slate-600',
    darkviolet: 'bg-violet-50 text-violet-600',
    darkrose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorMap[color] ?? colorMap.emerald}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
