import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, BookOpen, Loader2, ImagePlus, SendHorizonal, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const genres = [
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

const statuses = [
  { value: 'đang_ra', label: 'Đang Ra' },
  { value: 'hoàn_thành', label: 'Hoàn Thành' },
  { value: 'tạm_ngưng', label: 'Tạm Ngưng' },
];

const statusBadge = {
  pending: { label: 'Chờ duyệt', icon: Clock, cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt', icon: CheckCircle, cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Từ chối', icon: XCircle, cls: 'bg-red-100 text-red-700' },
};

export default function PublishStory() {
  const navigate = useNavigate();
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    status: 'đang_ra',
    cover_image: '',
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['myPublishRequests', currentUser?.email],
    queryFn: () => base44.entities.PublishRequest.filter({ user_email: currentUser.email }, '-created_date', 20),
    enabled: !!currentUser?.email,
  });

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const submitRequest = useMutation({
    mutationFn: async () => {
      let coverUrl = form.cover_image;
      if (coverFile) {
        setUploadingCover(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: coverFile });
        coverUrl = file_url;
        setUploadingCover(false);
      }
      return base44.entities.PublishRequest.create({
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        story_title: form.title,
        story_author: form.author,
        story_genre: form.genre,
        story_status: form.status,
        story_description: form.description,
        cover_image: coverUrl,
        status: 'pending',
      });
    },
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu! Admin sẽ xem xét sớm.');
      setSubmitted(true);
      setForm({ title: '', author: '', description: '', genre: '', status: 'đang_ra', cover_image: '' });
      setCoverPreview(null);
      setCoverFile(null);
    },
    onError: () => {
      setUploadingCover(false);
      toast.error('Có lỗi xảy ra, vui lòng thử lại!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      toast.error('Vui lòng điền tên truyện và tác giả!');
      return;
    }
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để gửi yêu cầu!');
      return;
    }
    submitRequest.mutate();
  };

  const isLoading = submitRequest.isPending || uploadingCover;

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Trang chủ
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Đăng truyện mới</h1>
            <p className="text-sm text-muted-foreground">Gửi yêu cầu cho admin xét duyệt trước khi đăng</p>
          </div>
        </div>

        {!currentUser ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">Bạn chưa đăng nhập</p>
            <p className="text-sm">Vui lòng đăng nhập để gửi yêu cầu đăng truyện.</p>
            <Button className="mt-4 rounded-xl" onClick={() => base44.auth.redirectToLogin(window.location.href)}>
              Đăng nhập
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6 mb-10">
              {/* Cover Upload */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Ảnh bìa</Label>
                <div className="flex gap-4 items-start">
                  <div className="w-32 aspect-[3/4] rounded-xl overflow-hidden bg-secondary border-2 border-dashed border-border flex items-center justify-center flex-shrink-0">
                    {coverPreview ? (
                      <img src={coverPreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-3">
                        <ImagePlus className="w-8 h-8 text-muted-foreground/40 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Chọn ảnh</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                      <div className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-secondary transition-colors w-fit">
                        <Upload className="w-4 h-4" /> Tải ảnh bìa lên
                      </div>
                    </label>
                    <p className="text-xs text-muted-foreground">Định dạng: JPG, PNG, WEBP. Tỉ lệ 3:4 tốt nhất.</p>
                    {!coverFile && (
                      <>
                        <p className="text-xs text-muted-foreground">Hoặc dán URL ảnh:</p>
                        <Input
                          placeholder="https://..."
                          value={form.cover_image}
                          onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                          className="text-sm h-9 rounded-xl"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">Tên truyện <span className="text-destructive">*</span></Label>
                <Input id="title" placeholder="Nhập tên truyện..." value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="author">Tác giả <span className="text-destructive">*</span></Label>
                <Input id="author" placeholder="Tên tác giả..." value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })} className="rounded-xl" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Thể loại</Label>
                  <Select value={form.genre} onValueChange={(v) => setForm({ ...form, genre: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chọn thể loại" /></SelectTrigger>
                    <SelectContent>{genres.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Trạng thái</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Mô tả truyện</Label>
                <Textarea id="description" placeholder="Viết mô tả ngắn..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded-xl min-h-[100px] resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="rounded-xl flex-1" onClick={() => navigate(-1)}>Hủy</Button>
                <Button type="submit" className="rounded-xl flex-1 shadow-md shadow-primary/20" disabled={isLoading}>
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang gửi...</>
                    : <><SendHorizonal className="w-4 h-4 mr-2" /> Gửi yêu cầu</>}
                </Button>
              </div>
            </form>

            {/* My requests */}
            {myRequests.length > 0 && (
              <div>
                <h2 className="font-heading font-semibold text-base mb-3">Yêu cầu của tôi</h2>
                <div className="space-y-3">
                  {myRequests.map((req) => {
                    const s = statusBadge[req.status] || statusBadge.pending;
                    const Icon = s.icon;
                    return (
                      <div key={req.id} className="border border-border rounded-xl p-3 flex items-center gap-3">
                        {req.cover_image ? (
                          <img src={req.cover_image} alt="" className="w-10 aspect-[3/4] object-cover rounded-lg flex-shrink-0" />
                        ) : (
                          <div className="w-10 aspect-[3/4] bg-secondary rounded-lg flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{req.story_title}</p>
                          <p className="text-xs text-muted-foreground">{req.story_author}</p>
                          {req.admin_note && <p className="text-xs text-muted-foreground italic mt-0.5">"{req.admin_note}"</p>}
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${s.cls}`}>
                          <Icon className="w-3 h-3" /> {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
