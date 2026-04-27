// ============= CLOUDINARY CONFIG =============
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dlys3waqo/image/upload';
const CLOUDINARY_PRESET = 'manga_upload';

// ============= BIẾN TOÀN CỤC =============
let mangas = JSON.parse(localStorage.getItem('mangas') || '[]');
let currentMangaIndex = null;

// ============= HÀM UPLOAD CLOUDINARY =============
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload thất bại');
    }

    const data = await response.json();
    return data.secure_url; // Trả về URL ảnh
  } catch (error) {
    console.error('Lỗi upload:', error);
    alert('❌ Lỗi: Không thể tải ảnh lên Cloudinary\n' + error.message);
    return null;
  }
}

// ============= HÀM LƯU VÀ RENDER =============
function saveToLocalStorage() {
  localStorage.setItem('mangas', JSON.stringify(mangas));
}

function render() {
  const mangaList = document.getElementById('mangaList');
  const emptyState = document.getElementById('emptyState');

  if (mangas.length === 0) {
    mangaList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  mangaList.innerHTML = mangas.map((manga, idx) => `
    <div class="manga-card">
      <div class="manga-cover">
        ${manga.cover ? `<img src="${manga.cover}" alt="${manga.name}">` : '📚'}
      </div>
      <div class="manga-info">
        <div class="manga-title">${manga.name}</div>
        ${manga.author ? `<div class="manga-meta">👤 ${manga.author}</div>` : ''}
        <div class="manga-meta">📌 ${manga.status}</div>
        <div class="manga-meta">📖 ${manga.type}</div>
        <div class="manga-chapters-count">${manga.chapters.length} chương</div>
        
        <div class="manga-actions">
          <button class="btn btn-success" onclick="openChapterModal(${idx})">➕ Chương</button>
          <button class="btn btn-warning" onclick="viewChapters(${idx})">👁️ Xem</button>
          <button class="btn btn-danger" onclick="deleteManga(${idx})">🗑️ Xóa</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ============= FORM THÊM TRUYỆN =============
document.getElementById('mangaForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const name = document.getElementById('mangaName').value.trim();
  const author = document.getElementById('mangaAuthor').value.trim();
  const status = document.getElementById('mangaStatus').value;
  const type = document.getElementById('mangaType').value;
  const coverFile = document.getElementById('mangaCover').files[0];

  let coverURL = '';

  // Upload ảnh bìa nếu có
  if (coverFile) {
    document.getElementById('loading').classList.add('active');
    coverURL = await uploadToCloudinary(coverFile);
    document.getElementById('loading').classList.remove('active');

    if (!coverURL) {
      return; // Lỗi upload
    }
  }

  // Thêm truyện mới
  mangas.push({
    id: Date.now(),
    name,
    author,
    status,
    type,
    cover: coverURL,
    chapters: []
  });

  saveToLocalStorage();
  render();
  this.reset();
  document.getElementById('coverPreview').style.display = 'none';
  alert('✅ Thêm truyện thành công!');
});

// ============= XÓA TRUYỆN =============
function deleteManga(idx) {
  const manga = mangas[idx];
  if (confirm(`❓ Bạn chắc chắn muốn xóa "${manga.name}"?\n(Tất cả chương sẽ bị xóa)`)) {
    mangas.splice(idx, 1);
    saveToLocalStorage();
    render();
    alert('✅ Truyện đã bị xóa!');
  }
}

// ============= MODAL THÊM CHƯƠNG =============
function openChapterModal(idx) {
  currentMangaIndex = idx;
  const manga = mangas[idx];
  
  document.getElementById('mangaNameInModal').textContent = `Đang thêm chương cho: ${manga.name}`;
  document.getElementById('chapterModal').classList.add('active');
  document.getElementById('chapterForm').reset();
  document.getElementById('imagePreview').innerHTML = '';
}

function closeChapterModal() {
  document.getElementById('chapterModal').classList.remove('active');
  document.getElementById('chapterForm').reset();
  document.getElementById('imagePreview').innerHTML = '';
}

// ============= PREVIEW ẢNH TRONG MODAL =============
document.getElementById('chapterImages').addEventListener('change', function() {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = '';

  if (this.files.length === 0) return;

  preview.innerHTML = `<p style="color: #667eea; font-weight: bold;">📷 ${this.files.length} ảnh được chọn:</p>`;

  const container = document.createElement('div');
  container.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-top: 10px;';

  for (let file of this.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.cssText = 'width: 100%; height: 120px; object-fit: cover; border-radius: 5px; border: 1px solid #ddd;';
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  preview.appendChild(container);
});

// ============= FORM THÊM CHƯƠNG =============
document.getElementById('chapterForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const chapterName = document.getElementById('chapterName').value.trim();
  const imageFiles = document.getElementById('chapterImages').files;

  if (imageFiles.length === 0) {
    alert('⚠️ Vui lòng chọn ít nhất 1 ảnh!');
    return;
  }

  document.getElementById('loading').classList.add('active');

  let images = [];

  try {
    // Upload từng ảnh
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const imageURL = await uploadToCloudinary(file);

      if (imageURL) {
        images.push({
          url: imageURL,
          fileName: file.name
        });
        document.getElementById('loading').innerHTML = `
          <div class="spinner"></div>
          <p>Đang tải ảnh... ${i + 1}/${imageFiles.length}</p>
        `;
      }
    }

    // Thêm chương
    if (currentMangaIndex !== null && images.length > 0) {
      mangas[currentMangaIndex].chapters.push({
        id: Date.now(),
        name: chapterName,
        images: images
      });

      saveToLocalStorage();
      render();
      closeChapterModal();
      alert(`✅ Thêm chương thành công! (${images.length} ảnh)`);
    } else {
      alert('❌ Lỗi: Không có ảnh nào được upload thành công');
    }
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    document.getElementById('loading').classList.remove('active');
    document.getElementById('loading').innerHTML = `
      <div class="spinner"></div>
      <p>Đang tải ảnh lên Cloudinary...</p>
    `;
  }
});

// ============= XEM CHƯƠNG =============
function viewChapters(mangaIdx) {
  const manga = mangas[mangaIdx];
  const modal = document.getElementById('viewChapterModal');
  const content = document.getElementById('viewChapterContent');

  if (manga.chapters.length === 0) {
    alert('📭 Truyện này chưa có chương nào!');
    return;
  }

  document.getElementById('viewChapterTitle').textContent = `📖 ${manga.name} (${manga.chapters.length} chương)`;

  content.innerHTML = manga.chapters.map((chapter, idx) => `
    <div class="chapter-item">
      <div class="chapter-title">Chương ${idx + 1}: ${chapter.name}</div>
      <div class="chapter-images">
        ${chapter.images.map(img => `<img src="${img.url}" class="chapter-image-thumb" alt="Page">`).join('')}
      </div>
      <div class="chapter-actions">
        <button class="btn btn-warning btn-sm" onclick="editChapter(${mangaIdx}, ${idx})">✏️ Sửa</button>
        <button class="btn btn-danger btn-sm" onclick="deleteChapter(${mangaIdx}, ${idx})">🗑️ Xóa</button>
      </div>
    </div>
  `).join('');

  modal.classList.add('active');
}

function closeViewChapterModal() {
  document.getElementById('viewChapterModal').classList.remove('active');
}

// ============= XÓA CHƯƠNG =============
function deleteChapter(mangaIdx, chapterIdx) {
  const chapter = mangas[mangaIdx].chapters[chapterIdx];
  if (confirm(`❓ Xóa "${chapter.name}"?`)) {
    mangas[mangaIdx].chapters.splice(chapterIdx, 1);
    saveToLocalStorage();
    render();
    viewChapters(mangaIdx); // Refresh view
    alert('✅ Chương đã bị xóa!');
  }
}

// ============= SỬA CHƯƠNG =============
function editChapter(mangaIdx, chapterIdx) {
  alert('✏️ Chức năng sửa chương sẽ được triển khai');
}

// ============= PREVIEW COVER KHI UPLOAD =============
document.getElementById('mangaCover').addEventListener('change', function() {
  const preview = document.getElementById('coverPreview');
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(this.files[0]);
  }
});

// ============= RENDER LẦN ĐẦU =============
render();
