import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AddChapterModal from '@/components/chapter/AddChapterModal';
import DeleteStoryDialog from '@/components/story/DeleteStoryDialog';
import CommentSection from '@/components/story/CommentSection';
import {
  BookOpen, Eye, Bookmark, BookmarkCheck, ArrowLeft, Clock, User,
  Tag, List, Plus, Trash2
} from 'lucide-react';

const genreLabels = {
  tiên_hiệp: 'Tiên Hiệp', kiếm_hiệp: 'Kiếm Hiệp', ngôn_tình: 'Ngôn Tình',
  đô_thị: 'Đô Thị', huyền_huyễn: 'Huyền Huyễn', khoa_huyễn: 'Khoa Huyễn',
  trinh_thám: 'Trinh Thám', lịch_sử: 'Lịch Sử', kinh_dị: 'Kinh Dị', khác: 'Khác',
};

const statusLabels = {
  đang_ra: 'Đang Ra', hoàn_thành: 'Hoàn Thành', tạm_ngưng: 'Tạm Ngưng',
};

export default function StoryDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = window.location.pathname.split('/story/')[1];
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [showDeleteStory, setShowDeleteStory] = useState(false);

  const { data: story, isLoading: storyLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => {
      const stories = await base44.entities.Story.filter({ id: storyId });
      return stories[0];
    },
    enabled: !!storyId,
  });

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ['chapters', storyId],
    queryFn: () => base44.entities.Chapter.filter({ story_id: storyId }, 'chapter_number', 500),
    enabled: !!storyId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks', currentUser?.email],
    queryFn: () => base44.entities.Bookmark.filter({ user_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });

  const isBookmarked = bookmarks.some((b) => b.story_id === storyId);
  const existingBookmark = bookmarks.find((b) => b.story_id === storyId);

  const toggleBookmark = useMutation({
    mutationFn: async () => {
      if (isBookmarked && existingBookmark) {
        await base44.entities.Bookmark.delete(existingBookmark.id);
      } else {
        await base44.entities.Bookmark.create({
          story_id: storyId,
          user_email: currentUser.email,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  if (storyLoading) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-6">
            <Skeleton className="w-48 aspect-[3/4] rounded-2xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Không tìm thấy truyện</p>
          <Link to="/">
            <Button variant="outline" className="mt-4">Về trang chủ</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Trang chủ
        </Link>

        {/* Story Info */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          <div className="w-40 sm:w-48 flex-shrink-0 mx-auto sm:mx-0">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-secondary shadow-lg">
              {story.cover_image ? (
                <img src={story.cover_image} alt={story.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <BookOpen className="w-12 h-12 text-primary/30" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">{story.title}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" /> {story.author}
              </span>
              {story.genre && (
                <Badge
                  variant="secondary"
                  className="rounded-full cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => navigate(`/?genre=${story.genre}`)}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {genreLabels[story.genre]}
                </Badge>
              )}
              {story.status && (
                <Badge className={`rounded-full border-0 ${
                  story.status === 'hoàn_thành' ? 'bg-green-500/10 text-green-600' :
                  story.status === 'tạm_ngưng' ? 'bg-yellow-500/10 text-yellow-600' :
                  'bg-primary/10 text-primary'
                }`}>
                  {statusLabels[story.status]}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" /> {(story.view_count || 0).toLocaleString()} lượt xem
              </span>
              <span className="flex items-center gap-1">
                <List className="w-4 h-4" /> {chapters.length} chương
              </span>
            </div>

            {story.description && (
              <p className="text-muted-foreground leading-relaxed text-sm">{story.description}</p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {chapters.length > 0 && (
                <Link to={`/read/${storyId}/${chapters[0]?.id}`}>
                  <Button className="rounded-xl shadow-md shadow-primary/20">
                    <BookOpen className="w-4 h-4 mr-2" /> Đọc từ đầu
                  </Button>
                </Link>
              )}
              {currentUser && (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => toggleBookmark.mutate()}
                >
                  {isBookmarked ? (
                    <><BookmarkCheck className="w-4 h-4 mr-2 text-primary" /> Đã lưu</>
                  ) : (
                    <><Bookmark className="w-4 h-4 mr-2" /> Lưu truyện</>
                  )}
                </Button>
              )}
              {currentUser && story?.created_by === currentUser.email && (
                <>
                  <Button variant="outline" className="rounded-xl" onClick={() => setShowAddChapter(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Thêm chương
                  </Button>
                  <Button variant="outline" className="rounded-xl text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setShowDeleteStory(true)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Xóa truyện
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chapter List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <List className="w-5 h-5 text-primary" /> Danh sách chương
            </h2>
            {currentUser && story?.created_by === currentUser.email && (
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => setShowAddChapter(true)}>
                <Plus className="w-4 h-4" /> Thêm chương
              </Button>
            )}
          </div>
          {chaptersLoading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : chapters.length > 0 ? (
            <div className="divide-y divide-border rounded-2xl border overflow-hidden">
              {chapters.map((ch) => (
                <Link
                  key={ch.id}
                  to={`/read/${storyId}/${ch.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground w-12">
                      #{ch.chapter_number}
                    </span>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">
                      {ch.title}
                    </span>
                  </div>
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Chưa có chương nào
            </div>
          )}
        </section>

        <CommentSection storyId={storyId} currentUser={currentUser} />
      </main>

      {showAddChapter && (
        <AddChapterModal
          storyId={storyId}
          currentChapterCount={chapters.length}
          open={showAddChapter}
          onClose={() => setShowAddChapter(false)}
        />
      )}

      {showDeleteStory && (
        <DeleteStoryDialog
          story={story}
          open={showDeleteStory}
          onClose={() => setShowDeleteStory(false)}
        />
      )}
    </div>
  );
}
