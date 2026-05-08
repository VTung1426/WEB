import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Settings,
  Sun, Moon, Minus, Plus, Home, List
} from 'lucide-react';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';

function ChapterContent({ content, fontSize }) {
  // Detect if content has image tags
  const hasImages = content?.includes('[IMG]');
  if (!hasImages) {
    return (
      <div className="leading-[1.9] whitespace-pre-wrap" style={{ fontSize: `${fontSize}px` }}>
        {content}
      </div>
    );
  }
  // Parse image tags
  const parts = content.split(/(\[IMG\].*?\[\/IMG\])/gs);
  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        const match = part.match(/^\[IMG\](.*?)\[\/IMG\]$/s);
        if (match) {
          return (
            <img
              key={i}
              src={match[1]}
              alt={`trang ${i}`}
              className="w-full max-w-2xl mx-auto block rounded-lg"
            />
          );
        }
        return part.trim() ? (
          <p key={i} className="leading-[1.9] whitespace-pre-wrap" style={{ fontSize: `${fontSize}px` }}>
            {part}
          </p>
        ) : null;
      })}
    </div>
  );
}

export default function ReadChapter() {
  const pathParts = window.location.pathname.split('/');
  const storyId = pathParts[2];
  const chapterId = pathParts[3];

  const [fontSize, setFontSize] = useState(18);
  const [darkMode, setDarkMode] = useState(false);

  const { data: chapter, isLoading: chapterLoading } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: async () => {
      const chapters = await base44.entities.Chapter.filter({ id: chapterId });
      return chapters[0];
    },
    enabled: !!chapterId,
  });

  const { data: story } = useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => {
      const stories = await base44.entities.Story.filter({ id: storyId });
      return stories[0];
    },
    enabled: !!storyId,
  });

  const { data: allChapters = [] } = useQuery({
    queryKey: ['chapters', storyId],
    queryFn: () => base44.entities.Chapter.filter({ story_id: storyId }, 'chapter_number', 500),
    enabled: !!storyId,
  });

  // Update view count
  useEffect(() => {
    if (story) {
      base44.entities.Story.update(story.id, {
        view_count: (story.view_count || 0) + 1,
      });
    }
  }, [story?.id]);

  const currentIndex = allChapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const bgClass = darkMode ? 'bg-[#1a1a1a] text-[#d4c5a9]' : 'bg-[#f8f4eb] text-[#2c2416]';

  if (chapterLoading) {
    return (
      <div className={`min-h-screen ${bgClass} font-body`}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-64" />
          <div className="space-y-3 pt-8">
            {Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-background font-body flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Không tìm thấy chương</p>
          <Link to="/">
            <Button variant="outline" className="mt-4">Về trang chủ</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300 font-body`}>
      {/* Top Bar */}
      <div className={`sticky top-0 z-50 border-b ${darkMode ? 'border-white/10 bg-[#1a1a1a]/95' : 'border-black/5 bg-[#f8f4eb]/95'} backdrop-blur-xl`}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to={`/story/${storyId}`} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="hidden sm:block">
              <p className="text-xs opacity-60 truncate max-w-[200px]">{story?.title}</p>
              <p className="text-sm font-medium truncate max-w-[200px]">Chương {chapter.chapter_number}: {chapter.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link to="/" className="p-2 rounded-lg hover:bg-black/5 transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <Link to={`/story/${storyId}`} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
              <List className="w-4 h-4" />
            </Link>
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-black/5 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 space-y-4" align="end">
                <div>
                  <p className="text-sm font-medium mb-2">Cỡ chữ</p>
                  <div className="flex items-center gap-3">
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg"
                      onClick={() => setFontSize(Math.max(14, fontSize - 2))}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-mono w-8 text-center">{fontSize}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg"
                      onClick={() => setFontSize(Math.min(28, fontSize + 2))}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Chế độ</p>
                  <div className="flex gap-2">
                    <Button variant={!darkMode ? 'default' : 'outline'} size="sm" className="flex-1 rounded-lg"
                      onClick={() => setDarkMode(false)}>
                      <Sun className="w-3.5 h-3.5 mr-1.5" /> Sáng
                    </Button>
                    <Button variant={darkMode ? 'default' : 'outline'} size="sm" className="flex-1 rounded-lg"
                      onClick={() => setDarkMode(true)}>
                      <Moon className="w-3.5 h-3.5 mr-1.5" /> Tối
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Chapter Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="text-center mb-8 sm:mb-12">
          <p className="text-sm opacity-50 mb-2">{story?.title}</p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">
            Chương {chapter.chapter_number}: {chapter.title}
          </h1>
        </header>

        <ChapterContent content={chapter.content} fontSize={fontSize} />
      </article>

      {/* Navigation */}
      <div className={`border-t ${darkMode ? 'border-white/10' : 'border-black/5'}`}>
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          {prevChapter ? (
            <Link to={`/read/${storyId}/${prevChapter.id}`}>
              <Button variant="outline" className={`rounded-xl ${darkMode ? 'border-white/10 hover:bg-white/5' : ''}`}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Chương trước
              </Button>
            </Link>
          ) : <div />}

          <Link to={`/story/${storyId}`}>
            <Button variant="ghost" size="sm" className="rounded-xl">
              <List className="w-4 h-4 mr-1" /> Mục lục
            </Button>
          </Link>

          {nextChapter ? (
            <Link to={`/read/${storyId}/${nextChapter.id}`}>
              <Button className="rounded-xl shadow-md shadow-primary/20">
                Chương sau <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
