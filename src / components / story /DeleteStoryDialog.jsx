import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DeleteStoryDialog({ story, open, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete all chapters first
      const chapters = await base44.entities.Chapter.filter({ story_id: story.id });
      await Promise.all(chapters.map((ch) => base44.entities.Chapter.delete(ch.id)));
      // Delete all bookmarks
      const bookmarks = await base44.entities.Bookmark.filter({ story_id: story.id });
      await Promise.all(bookmarks.map((bm) => base44.entities.Bookmark.delete(bm.id)));
      // Delete story
      await base44.entities.Story.delete(story.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Đã xóa truyện thành công!');
      navigate('/');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi xóa truyện!');
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" /> Xóa truyện?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Bạn sắp xóa truyện <span className="font-semibold text-foreground">"{story?.title}"</span>.
            </p>
            <p className="text-destructive/80 text-sm font-medium">
              ⚠️ Hành động này không thể hoàn tác! Tất cả các chương và dữ liệu liên quan sẽ bị xóa vĩnh viễn.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl" disabled={deleteMutation.isPending}>
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl bg-destructive hover:bg-destructive/90"
            onClick={(e) => { e.preventDefault(); deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xóa...</>
            ) : (
              <><Trash2 className="w-4 h-4 mr-2" /> Xóa truyện</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
