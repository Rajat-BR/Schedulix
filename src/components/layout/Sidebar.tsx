import { NavLink } from 'react-router-dom';
import {
  Cpu,
  BarChart3,
  BookOpen,
  FlaskConical,
  Home,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: Home, exact: true },
  { to: '/simulator', label: 'Simulator', icon: Cpu },
  { to: '/comparison', label: 'Comparison', icon: BarChart3 },
  { to: '/lab', label: 'Algorithm Lab', icon: FlaskConical },
  { to: '/docs', label: 'Documentation', icon: BookOpen },
];

export default function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-border bg-surface h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-text-primary tracking-tight">Schedulix</div>
            <div className="text-[10px] text-text-muted font-mono">CPU Scheduler</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        <div className="section-label px-3 mb-2">Navigation</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              isActive ? 'nav-item-active' : 'nav-item-inactive'
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={15} className={isActive ? 'text-cyan-400' : ''} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={12} className="text-text-muted" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-[10px] text-text-muted font-mono leading-relaxed">
          <div>v1.0.0</div>
          <div className="text-cyan-500/60">All algorithms verified</div>
        </div>
      </div>
    </aside>
  );
}
