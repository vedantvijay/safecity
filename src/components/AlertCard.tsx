import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/api/community';

interface AlertCardProps {
  alert: Alert;
  index: number;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, index }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'medium':
        return 'bg-yellow-500 text-black hover:bg-yellow-600';
      case 'low':
        return 'bg-green-500 text-white hover:bg-green-600';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 bg-muted/50 rounded-xl border border-border hover:bg-muted/70 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-foreground flex items-center space-x-2">
          <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
          <span>{alert.title}</span>
        </h3>
        <Badge className={`${getSeverityColor(alert.severity)} text-xs font-medium`}>
          {alert.severity.toUpperCase()}
        </Badge>
      </div>
      
      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
        <div className="flex items-center space-x-1">
          <MapPin className="h-4 w-4" />
          <span>{alert.location}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>{alert.timeAgo}</span>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground leading-relaxed">
        {alert.description}
      </p>
      
      {alert.severity === 'high' && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">High Priority Alert</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AlertCard;
