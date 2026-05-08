import React from 'react';
import { Button } from '@/components/ui/button';

const genres = [
  { value: 'all', label: 'Tất cả' },
  { value: 'tiên_hiệp', label: 'Tiên Hiệp' },
  { value: 'kiếm_hiệp', label: 'Kiếm Hiệp' },
  { value: 'ngôn_tình', label: 'Ngôn Tình' },
  { value: 'đô_thị', label: 'Đô Thị' },
  { value: 'huyền_huyễn', label: 'Huyền Huyễn' },
  { value: 'khoa_huyễn', label: 'Khoa Huyễn' },
  { value: 'trinh_thám', label: 'Trinh Thám' },
  { value: 'lịch_sử', label: 'Lịch Sử' },
  { value: 'kinh_dị', label: 'Kinh Dị' },
  { value: 'khác', label: 'Khác' },
];

export default function GenreFilter({ activeGenre, onGenreChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map(({ value, label }) => (
        <Button
          key={value}
          variant={activeGenre === value ? 'default' : 'secondary'}
          size="sm"
          onClick={() => onGenreChange(value)}
          className={`rounded-full text-xs font-body transition-all ${
            activeGenre === value
              ? 'shadow-md shadow-primary/20'
              : 'hover:bg-accent'
          }`}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
