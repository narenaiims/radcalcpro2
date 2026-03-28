import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClinicalAlert, AlertSeverity } from '../services/clinicalAlerts';

interface AlertStackProps {
  alerts: ClinicalAlert[];
}

const severityConfig: Record<AlertSeverity, { icon: any, color: string, bgColor: string, borderColor: string }> = {
  warning: {
    icon: AlertTriangle,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  caution: {
    icon: AlertCircle,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  info: {
    icon: Info,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

export const AlertStack: React.FC<AlertStackProps> = ({ alerts }) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [dontShowAgainIds, setDontShowAgainIds] = useState<Set<string>>(new Set());

  // Load "Don't show again" preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dont-show-alerts');
    if (saved) {
      try {
        setDontShowAgainIds(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Failed to parse dont-show-alerts', e);
      }
    }
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleDontShowAgain = (id: string) => {
    const newSet = new Set([...dontShowAgainIds, id]);
    setDontShowAgainIds(newSet);
    localStorage.setItem('dont-show-alerts', JSON.stringify(Array.from(newSet)));
  };

  const visibleAlerts = alerts.filter(
    alert => !dismissedIds.has(alert.id) && !dontShowAgainIds.has(alert.id)
  );

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence>
        {visibleAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex items-start p-4 rounded-lg border ${config.bgColor} ${config.borderColor} shadow-sm`}
            >
              <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
                <Icon size={20} />
              </div>
              <div className="ml-3 flex-grow">
                <p className={`text-sm font-medium ${config.color}`}>
                  {alert.message}
                </p>
                <div className="mt-2 flex items-center space-x-4">
                  <button
                    onClick={() => handleDontShowAgain(alert.id)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Don't show again
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(alert.id)}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
