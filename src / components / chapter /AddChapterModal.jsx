import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, X, Upload, Loader2, FileImage, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AddChapterModal({ storyId, currentChapterCount, open, onClose }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState('text');
  const [form, setForm] = useState({
    chapter_number: (currentChapterCount || 0) + 1,
    title: '',
    content: '',
  });
  const [images, setImages] = useState([]); // [{file, preview, url}]
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      url: null,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      let content = form.content;
      if (tab === 'images') {
        if (images.length === 0) throw new Error('Chưa có ảnh');
        setUploadingImages(true);
        const uploaded = await Promise.all(
          images.map(async (img) => {
            const { file_url } = await base44.integrations.Core.UploadFile({ file: img.file });
            return file_url;
          })
        );
        setUploadingImages(false);
        // Store image URLs as special content format
        content = uploaded.map((url) => `[IMG]${url}[/IMG]`).join('\n');
      }
      return base44.entities.Chapter.create({
        story_id: storyId,
        chapter_number: Number(form.chapter_number),
        title: form.title,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters', storyId] });
      toast.success('Thêm chương thành công!');
      onClose();
      setForm({ chapter_number: (currentChapterCount || 0) + 2, title: '', content: '' });
      setImages([]);
    },
    onError: (err) => {
      setUploadingImages(false);
      toast.error(err.message || 'Có lỗi xảy ra!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề chương!'); return; }
    if (tab === 'text' && !form.content.trim()) { toast.error('Vui lòng nhập nội dung chương!'); return; }
    if (tab === 'images' && images.length === 0) { toast.error('Vui lòng thêm ít nhất 1 ảnh!'); return; }
    addMutation.mutate();
  };

  const isLoading = addMutation.isPending || uploadingImages;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Thêm chương mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Số chương</Label>
              <Input
                type="number"
                min={1}
                value={form.chapter_number}
                onChange={(e) => setForm({ ...form, chapter_number: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tiêu đề chương <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Tiêu đề..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nội dung</Label>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="rounded-xl mb-3">
                <TabsTrigger value="text" className="rounded-lg gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5" /> Văn bản
                </TabsTrigger>
                <TabsTrigger value="images" className="rounded-lg gap-1.5">
                  <FileImage className="w-3.5 h-3.5" /> Hình ảnh
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text">
                <Textarea
                  placeholder="Nhập nội dung chương ở đây..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="rounded-xl min-h-[240px] resize-none font-body text-sm leading-relaxed"
                />
              </TabsContent>

              <TabsContent value="images">
                <div className="space-y-3">
                  {/* Image list */}
                  {images.length > 0 && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {images.map((img, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden border border-border">
                          <img src={img.preview} alt={`page ${i + 1}`} className="w-full object-contain max-h-64" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => removeImage(i)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                            Trang {i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <label className="cursor-pointer block">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageAdd}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                      <ImagePlus className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nhấn để thêm ảnh từ máy tính
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        JPG, PNG, WEBP — có thể chọn nhiều ảnh cùng lúc
                      </p>
                    </div>
                  </label>

                  {images.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      {images.length} ảnh đã chọn • Thứ tự hiển thị từ trên xuống
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl" disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" className="rounded-xl shadow-md shadow-primary/20" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadingImages ? 'Đang tải ảnh...' : 'Đang lưu...'}
                </>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Thêm chương</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
