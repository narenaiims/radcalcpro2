import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calculator, BookOpen, Search } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/eqd2', label: 'Calc', icon: Calculator },
    { path: '/oar-limits', label: 'Ref', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#05080F]/80 backdrop-blur-2xl border-t border-white/5 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full transition-all ${
                isActive ? 'text-teal' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
