import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, User, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Discussion } from '@/api/community';

interface DiscussionCardProps {
  discussion: Discussion;
  index: number;
  onClick: (id: number) => void;
}

const DiscussionCard: React.FC<DiscussionCardProps> = ({ discussion, index, onClick }) => {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'safety':
        return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300';
      case 'community':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300';
      case 'information':
        return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300';
      case 'general':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300';
      default:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'safety':
        return '🛡️';
      case 'community':
        return '👥';
      case 'information':
        return 'ℹ️';
      case 'general':
        return '💬';
      default:
        return '📝';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 bg-muted/50 rounded-xl border border-border hover:bg-muted/70 transition-colors cursor-pointer group"
      onClick={() => onClick(discussion.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-foreground hover:text-primary transition-colors flex items-center space-x-2">
          <span className="text-lg">{getCategoryIcon(discussion.category)}</span>
          <span className="flex-1">{discussion.title}</span>
        </h3>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
        <div className="flex items-center space-x-1">
          <User className="h-4 w-4" />
          <span>by {discussion.author}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>{discussion.timeAgo}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <Badge 
          variant="outline" 
          className={`${getCategoryColor(discussion.category)} text-xs font-medium`}
        >
          {discussion.category}
        </Badge>
        
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>{discussion.replies} {discussion.replies === 1 ? 'reply' : 'replies'}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DiscussionCard;
