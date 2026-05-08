import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const genreLabels = {
  tiên_hiệp: 'Tiên Hiệp',
  kiếm_hiệp: 'Kiếm Hiệp',
  ngôn_tình: 'Ngôn Tình',
  đô_thị: 'Đô Thị',
  huyền_huyễn: 'Huyền Huyễn',
  khoa_huyễn: 'Khoa Huyễn',
  trinh_thám: 'Trinh Thám',
  lịch_sử: 'Lịch Sử',
  kinh_dị: 'Kinh Dị',
  khác: 'Khác',
};

const statusLabels = {
  đang_ra: 'Đang Ra',
  hoàn_thành: 'Hoàn Thành',
  tạm_ngưng: 'Tạm Ngưng',
};

export default function StoryCard({ story }) {
  return (
    <Link to={`/story/${story.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        {/* Cover */}
        <div className="aspect-[3/4] overflow-hidden bg-secondary">
          {story.cover_image ? (
            <img
              src={story.cover_image}
              alt={story.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <BookOpen className="w-12 h-12 text-primary/30" />
            </div>
          )}
          {/* Status badge */}
          {story.status && (
            <div className="absolute top-3 left-3">
              <Badge
                className={`text-xs font-medium border-0 backdrop-blur-sm ${
                  story.status === 'hoàn_thành'
                    ? 'bg-green-500/90 text-white'
                    : story.status === 'tạm_ngưng'
                    ? 'bg-yellow-500/90 text-white'
                    : 'bg-primary/90 text-primary-foreground'
                }`}
              >
                {statusLabels[story.status] || story.status}
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-heading font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {story.title}
          </h3>
          <p className="text-sm text-muted-foreground font-body">{story.author}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            {story.genre && (
              <span className="bg-accent px-2 py-0.5 rounded-full text-accent-foreground">
                {genreLabels[story.genre] || story.genre}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {(story.view_count || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
