import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Send, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function CommentSection({ storyId, currentUser }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', storyId],
    queryFn: () => base44.entities.Comment.filter({ story_id: storyId }, '-created_date', 100),
    enabled: !!storyId,
  });

  const addComment = useMutation({
    mutationFn: () => base44.entities.Comment.create({
      story_id: storyId,
      user_email: currentUser.email,
      user_name: currentUser.full_name || currentUser.email.split('@')[0],
      content: content.trim(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', storyId] });
      setContent('');
      toast.success('Đã gửi bình luận!');
    },
  });

  const deleteComment = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', storyId] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate();
  };

  return (
    <section className="mt-8">
      <h2 className="font-heading text-lg font-bold flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        Bình luận {comments.length > 0 && <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>}
      </h2>

      {/* Input */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Viết bình luận của bạn..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="rounded-xl resize-none min-h-[80px] text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(e); }}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  disabled={!content.trim() || addComment.isPending}
                >
                  <Send className="w-3.5 h-3.5" /> Gửi
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-secondary/50 text-center text-sm text-muted-foreground">
          Đăng nhập để bình luận
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Chưa có bình luận nào. Hãy là người đầu tiên!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 group">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{c.user_name || c.user_email?.split('@')[0]}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.created_date ? formatDistanceToNow(new Date(c.created_date), { addSuffix: true, locale: vi }) : ''}
                  </span>
                  {currentUser && (currentUser.email === c.user_email || currentUser.role === 'admin') && (
                    <button
                      onClick={() => deleteComment.mutate(c.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="bg-secondary/50 rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                  {c.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
