import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Search, Bookmark, Home, PenSquare, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Navbar({ searchQuery, onSearchChange }) {
  const location = useLocation();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const navLinks = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/bookmarks', label: 'Tủ sách', icon: Bookmark },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight hidden sm:block">
              Truyện Hay
            </span>
          </Link>

          {/* Search */}
          {onSearchChange && (
            <div className="flex-1 max-w-md mx-4 sm:mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm truyện..."
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 h-10 rounded-xl font-body"
                />
              </div>
            </div>
          )}

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
            {currentUser?.role === 'admin' && (
              <Link to="/admin/requests">
                <Button size="sm" variant="outline" className="rounded-xl ml-1 gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Duyệt truyện</span>
                </Button>
              </Link>
            )}
            <Link to="/publish">
              <Button size="sm" className="rounded-xl ml-1 gap-1.5 shadow-sm shadow-primary/20">
                <PenSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng truyện</span>
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
