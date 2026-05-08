import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import StoryCard from '@/components/story/StoryCard';
import GenreFilter from '@/components/story/GenreFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, TrendingUp, Clock, SlidersHorizontal } from 'lucide-react';

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'az', label: 'Tên A → Z' },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('genre') || 'all';
  });
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const g = p.get('genre');
    if (g) setActiveGenre(g);
  }, [window.location.search]);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => base44.entities.Story.list('-created_date', 100),
  });

  const filteredStories = useMemo(() => {
    let result = stories;
    if (activeGenre !== 'all') {
      result = result.filter((s) => s.genre === activeGenre);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.author?.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'popular') result = [...result].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    else if (sortBy === 'az') result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi'));
    return result;
  }, [stories, activeGenre, searchQuery, sortBy]);

  const popularStories = useMemo(
    () => [...stories].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 6),
    [stories]
  );

  const recentStories = useMemo(
    () => [...stories].slice(0, 6),
    [stories]
  );

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        {!searchQuery && activeGenre === 'all' && (
          <section className="mb-12">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent to-secondary p-8 sm:p-12">
              <div className="relative z-10 max-w-2xl">
                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                  Khám phá thế giới
                  <br />
                  <span className="text-primary">truyện hay</span>
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg font-light leading-relaxed">
                  Hàng ngàn câu chuyện hấp dẫn đang chờ bạn. Đọc miễn phí, mọi lúc mọi nơi.
                </p>
              </div>
              <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
                <BookOpen className="w-full h-full" />
              </div>
            </div>
          </section>
        )}

        {/* Popular Section */}
        {!searchQuery && activeGenre === 'all' && popularStories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl font-bold">Truyện hot</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {popularStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Section */}
        {!searchQuery && activeGenre === 'all' && recentStories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl font-bold">Mới cập nhật</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </section>
        )}

        {/* All Stories with Filter */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="font-heading text-xl font-bold">
              {searchQuery ? `Kết quả tìm kiếm "${searchQuery}"` : activeGenre !== 'all' ? `Thể loại đang chọn` : 'Tất cả truyện'}
            </h2>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 rounded-xl h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mb-6">
            <GenreFilter activeGenre={activeGenre} onGenreChange={setActiveGenre} />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredStories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Không tìm thấy truyện nào</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
