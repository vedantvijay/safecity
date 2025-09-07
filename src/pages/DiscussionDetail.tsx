import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, User, Clock, Send, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi, DiscussionDetail, Reply as ReplyType } from '@/api/community';
import { toast } from 'sonner';

const DiscussionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const discussionId = parseInt(id || '0');

  // Fetch discussion detail
  const { data: discussion, isLoading, error } = useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: () => communityApi.getDiscussionDetail(discussionId),
    enabled: !!discussionId,
  });

  // Add reply mutation
  const addReplyMutation = useMutation({
    mutationFn: ({ content, author }: { content: string; author: string }) =>
      communityApi.addReply(discussionId, content, author),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      setReplyContent('');
      setReplyAuthor('');
      toast.success('Reply added successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to add reply. Please try again.');
      console.error('Add reply error:', error);
    },
  });

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyAuthor.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmittingReply(true);
    try {
      await addReplyMutation.mutateAsync({
        content: replyContent,
        author: replyAuthor,
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Discussion Not Found</h2>
          <p className="text-muted-foreground mb-6">The discussion you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/community')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/community')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{discussion.title}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>by {discussion.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{discussion.timeAgo}</span>
                </div>
                <Badge className={`${getCategoryColor(discussion.category)} text-xs`}>
                  <span className="mr-1">{getCategoryIcon(discussion.category)}</span>
                  {discussion.category}
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Discussion */}
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {discussion.content}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Replies Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Replies ({discussion.replies.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {discussion.replies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No replies yet. Be the first to respond!</p>
                </div>
              ) : (
                discussion.replies.map((reply, index) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-muted/50 rounded-xl border border-border"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{reply.author}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{reply.timeAgo}</span>
                      </div>
                    </div>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Add Reply Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Reply className="h-5 w-5" />
                <span>Add a Reply</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={replyAuthor}
                      onChange={(e) => setReplyAuthor(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Reply Content
                    </label>
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={3}
                      className="w-full"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmittingReply || !replyContent.trim() || !replyAuthor.trim()}
                    className="flex items-center space-x-2"
                  >
                    {isSubmittingReply ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Post Reply</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DiscussionDetailPage;
