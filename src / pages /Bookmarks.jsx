import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import StoryCard from '@/components/story/StoryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Bookmarks() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery({
    queryKey: ['bookmarks', currentUser?.email],
    queryFn: () => base44.entities.Bookmark.filter({ user_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });

  const { data: allStories = [], isLoading: storiesLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => base44.entities.Story.list('-created_date', 500),
  });

  const bookmarkedStories = useMemo(() => {
    const bookmarkIds = new Set(bookmarks.map((b) => b.story_id));
    return allStories.filter((s) => bookmarkIds.has(s.id));
  }, [bookmarks, allStories]);

  const isLoading = bookmarksLoading || storiesLoading;

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Bookmark className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-2xl font-bold">Tủ sách của tôi</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : bookmarkedStories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {bookmarkedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="w-20 h-20 text-muted-foreground/20 mx-auto mb-6" />
            <h2 className="font-heading text-xl font-semibold mb-2">Tủ sách trống</h2>
            <p className="text-muted-foreground mb-6">Bạn chưa lưu truyện nào. Hãy khám phá và lưu những truyện yêu thích!</p>
            <Link to="/">
              <Button className="rounded-xl">Khám phá truyện</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
