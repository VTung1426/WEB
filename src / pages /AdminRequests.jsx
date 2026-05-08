import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, BookOpen, User, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const genreLabels = {
  tiên_hiệp: 'Tiên Hiệp', kiếm_hiệp: 'Kiếm Hiệp', ngôn_tình: 'Ngôn Tình',
  đô_thị: 'Đô Thị', huyền_huyễn: 'Huyền Huyễn', khoa_huyễn: 'Khoa Huyễn',
  trinh_thám: 'Trinh Thám', lịch_sử: 'Lịch Sử', kinh_dị: 'Kinh Dị', khác: 'Khác',
};

export default function AdminRequests() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [notes, setNotes] = useState({});

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['publishRequests'],
    queryFn: () => base44.entities.PublishRequest.list('-created_date', 100),
    enabled: !!currentUser,
  });

  const approveMutation = useMutation({
    mutationFn: async (req) => {
      // Create the actual story
      await base44.entities.Story.create({
        title: req.story_title,
        author: req.story_author,
        genre: req.story_genre,
        status: req.story_status || 'đang_ra',
        description: req.story_description,
        cover_image: req.cover_image || '',
        view_count: 0,
        chapter_count: 0,
      });
      // Update request status
      await base44.entities.PublishRequest.update(req.id, {
        status: 'approved',
        admin_note: notes[req.id] || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishRequests'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Đã duyệt và đăng truyện!');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (req) => base44.entities.PublishRequest.update(req.id, {
      status: 'rejected',
      admin_note: notes[req.id] || '',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishRequests'] });
      toast.success('Đã từ chối yêu cầu.');
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <XCircle className="w-16 h-16 text-destructive/40 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Không có quyền truy cập</h2>
          <p className="text-muted-foreground mb-4">Trang này chỉ dành cho admin.</p>
          <Link to="/"><Button variant="outline" className="rounded-xl">Về trang chủ</Button></Link>
        </div>
      </div>
    );
  }

  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Trang chủ
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Quản lý yêu cầu đăng truyện</h1>
            <p className="text-sm text-muted-foreground">{pending.length} yêu cầu đang chờ duyệt</p>
          </div>
        </div>

        {/* Pending */}
        {pending.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl mb-8">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            Không có yêu cầu nào đang chờ duyệt
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            <h2 className="font-heading font-semibold text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" /> Chờ duyệt ({pending.length})
            </h2>
            {pending.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                note={notes[req.id] || ''}
                onNoteChange={(v) => setNotes(n => ({ ...n, [req.id]: v }))}
                onApprove={() => approveMutation.mutate(req)}
                onReject={() => rejectMutation.mutate(req)}
                isLoading={approveMutation.isPending || rejectMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Processed */}
        {processed.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-heading font-semibold text-base text-muted-foreground">Đã xử lý ({processed.length})</h2>
            {processed.map((req) => (
              <div key={req.id} className="border border-border rounded-2xl p-4 opacity-70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{req.story_title}</p>
                    <p className="text-xs text-muted-foreground">{req.story_author} · {req.user_email}</p>
                  </div>
                  <Badge className={req.status === 'approved'
                    ? 'bg-green-100 text-green-700 border-0'
                    : 'bg-red-100 text-red-700 border-0'
                  }>
                    {req.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                  </Badge>
                </div>
                {req.admin_note && <p className="text-xs text-muted-foreground mt-2 italic">"{req.admin_note}"</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function RequestCard({ req, note, onNoteChange, onApprove, onReject, isLoading }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-4">
        {req.cover_image ? (
          <img src={req.cover_image} alt="" className="w-16 aspect-[3/4] object-cover rounded-lg flex-shrink-0" />
        ) : (
          <div className="w-16 aspect-[3/4] bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-muted-foreground/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight">{req.story_title}</p>
          <p className="text-sm text-muted-foreground">Tác giả: {req.story_author}</p>
          {req.story_genre && <p className="text-xs text-muted-foreground mt-0.5">Thể loại: {genreLabels[req.story_genre] || req.story_genre}</p>}
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <User className="w-3 h-3" /> {req.user_name || req.user_email}
          </div>
          {req.story_description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{req.story_description}</p>
          )}
        </div>
      </div>

      <Textarea
        placeholder="Ghi chú cho tác giả (không bắt buộc)..."
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        className="rounded-xl text-sm resize-none min-h-[60px]"
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 rounded-xl gap-1.5 bg-green-600 hover:bg-green-700"
          onClick={onApprove}
          disabled={isLoading}
        >
          <CheckCircle className="w-4 h-4" /> Duyệt & Đăng
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 rounded-xl gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={onReject}
          disabled={isLoading}
        >
          <XCircle className="w-4 h-4" /> Từ chối
        </Button>
      </div>
    </div>
  );
}
