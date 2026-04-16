import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MessageCircle, RefreshCw, Calendar, User } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Comment {
  page: string;
  comment: string;
  timestamp: string;
  stepId: number | null;
  userAccessCode?: string;
}

export function OnboardingCommentsView() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7771b72b/comments`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }

      setComments(data.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-pink-500" />
            Onboarding Comments & Feedback
          </h1>
          <p className="text-gray-600 mt-1">
            View all user feedback submitted through the onboarding overlay
          </p>
        </div>
        <Button
          onClick={fetchComments}
          variant="outline"
          className="gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">Error: {error}</p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-pink-500 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No comments yet
          </h3>
          <p className="text-gray-600">
            User feedback will appear here when submitted through the onboarding overlay
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Total comments: <span className="font-semibold">{comments.length}</span>
          </div>
          
          {comments.map((comment, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                    {comment.page || 'Unknown page'}
                  </Badge>
                  {comment.stepId && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Step {comment.stepId}
                    </Badge>
                  )}
                  {comment.userAccessCode && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {comment.userAccessCode}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                  <Calendar className="h-3 w-3" />
                  {formatDate(comment.timestamp)}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
