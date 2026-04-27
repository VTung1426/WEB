// ==========================================
// Cloudinary Configuration
// ==========================================
const CLOUDINARY_CONFIG = {
    cloud_name: 'dlys3waqo',
    api_key: '656516489339242',
    api_secret: 'mGJwGBnVajLwKbXnVaOJbgBW_Rg',
    upload_preset: 'manga_upload'
};

// ==========================================
// Data Management
// ==========================================
class MangaDB {
    constructor() {
        this.mangas = this.loadFromStorage() || [];
        this.currentMangaId = null;
        this.currentChapterId = null;
    }

    loadFromStorage() {
        const data = localStorage.getItem('mangaData');
        return data ? JSON.parse(data) : [];
    }

    saveToStorage() {
        localStorage.setItem('mangaData', JSON.stringify(this.mangas));
    }

    addManga(manga) {
        manga.id = Date.now();
        manga.createdAt = new Date().toISOString();
        manga.chapters = [];
        manga.favorite = false;
        manga.readingProgress = 0;
        this.mangas.push(manga);
        this.saveToStorage();
        return manga;
    }

    updateManga(id, updates) {
        const manga = this.getManga(id);
        if (manga) {
            Object.assign(manga, updates);
            this.saveToStorage();
        }
        return manga;
    }

    deleteManga(id) {
        this.mangas = this.mangas.filter(m => m.id !== id);
        this.saveToStorage();
    }

    getManga(id) {
        return this.mangas.find(m => m.id === id);
    }

    getAllMangas() {
        return this.mangas;
    }

    addChapter(mangaId, chapter) {
        const manga = this.getManga(mangaId);
        if (manga) {
            chapter.id = Date.now();
            chapter.createdAt = new Date().toISOString();
            chapter.pages = chapter.pages || [];
            manga.chapters.push(chapter);
            this.saveToStorage();
            return chapter;
        }
        return null;
    }

    getChapter(mangaId, chapterId) {
        const manga = this.getManga(mangaId);
        return manga ? manga.chapters.find(c => c.id === chapterId) : null;
    }

    updateChapter(mangaId, chapterId, updates) {
        const chapter = this.getChapter(mangaId, chapterId);
        if (chapter) {
            Object.assign(chapter, updates);
            this.saveToStorage();
        }
        return chapter;
    }

    deleteChapter(mangaId, chapterId) {
        const manga = this.getManga(mangaId);
        if (manga) {
            manga.chapters = manga.chapters.filter(c => c.id !== chapterId);
            this.saveToStorage();
        }
    }

    getFavorites() {
        return this.mangas.filter(m => m.favorite);
    }

    getReading() {
        return this.mangas.filter(m => m.readingProgress > 0 && m.readingProgress < 100);
    }

    getCompleted() {
        return this.mangas.filter(m => m.readingProgress === 100);
    }

    exportData() {
        return JSON.stringify(this.mangas, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (Array.isArray(data)) {
                this.mangas = data;
                this.saveToStorage();
                return true;
            }
        } catch (e) {
            console.error('Import failed:', e);
        }
        return false;
    }
}

// ==========================================
// Cloudinary Upload
// ==========================================
class CloudinaryUploader {
    constructor(config) {
        this.config = config;
        this.apiUrl = `https://api.cloudinary.com/v1_1/${config.cloud_name}/image/upload`;
    }

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.config.upload_preset);
        formData.append('folder', 'manga-reader');

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                url: data.secure_url,
                publicId: data.public_id,
                width: data.width,
                height: data.height
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    }

    async uploadMultipleImages(files) {
        const uploads = Array.from(files).map(file => this.uploadImage(file));
        return Promise.all(uploads);
    }

    deleteImage(publicId) {
        // Note: Deletion requires backend signature. For now, we'll just mark as deleted in DB
        // Implement backend deletion endpoint if needed
        console.log('Delete image:', publicId);
    }
}

// ==========================================
// UI Manager
// ==========================================
class UIManager {
    constructor(db, uploader) {
        this.db = db;
        this.uploader = uploader;
        this.currentView = 'home';
        this.currentSort = 'date';
        this.currentFilter = 'all';
        this.currentMode = 'vertical';
        this.initEventListeners();
        this.render();
    }

    initEventListeners() {
        // Navigation
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(btn.dataset.view);
            });
        });

        // Add Manga
        document.getElementById('addMangaBtn').addEventListener('click', () => {
            this.showAddMangaModal();
        });

        document.getElementById('addFirstManga').addEventListener('click', () => {
            this.showAddMangaModal();
        });

        document.getElementById('cancelAddManga').addEventListener('click', () => {
            this.closeModal('addMangaModal');
        });

        document.getElementById('addMangaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddManga();
        });

        // Cover image preview
        document.getElementById('coverImage').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = document.getElementById('coverPreview');
                    preview.src = event.target.result;
                    preview.classList.add('show');
                };
                reader.readAsDataURL(file);
            }
        });

        // Tags input
        document.getElementById('tagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag();
            }
        });

        // Modal closes
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = btn.closest('.modal');
                modal.classList.remove('active');
            });
        });

        // Library controls
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSort = btn.dataset.sort;
                this.renderLibrary();
            });
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentFilter = btn.dataset.filter;
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderLibrary();
            });
        });

        // Stats
        document.getElementById('statsBtn').addEventListener('click', () => {
            this.switchView('stats');
        });

        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    const jsonData = event.target.result;
                    if (this.db.importData(jsonData)) {
                        alert('Nhập dữ liệu thành công!');
                        this.render();
                    } else {
                        alert('Nhập dữ liệu thất bại!');
                    }
                };
                reader.readAsText(file);
            });
            input.click();
        });

        // Add Chapter Modal
        document.getElementById('cancelAddChapter').addEventListener('click', () => {
            this.closeModal('addChapterModal');
        });

        document.getElementById('addChapterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddChapter();
        });

        // Page images
        document.getElementById('pageImages').addEventListener('change', (e) => {
            this.displayPagePreviews(e.target.files);
        });

        // Back buttons
        document.getElementById('backBtn').addEventListener('click', () => {
            this.switchView('library');
        });

        document.getElementById('readerBackBtn').addEventListener('click', () => {
            this.switchView('mangaDetail');
        });

        // Reader controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMode = btn.dataset.mode;
                this.updateReaderMode();
            });
        });

        document.getElementById('prevBtn').addEventListener('click', () => {
            this.previousPage();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.nextPage();
        });

        // Confirm modal
        document.getElementById('cancelConfirm').addEventListener('click', () => {
            this.closeModal('confirmModal');
        });
    }

    switchView(viewName) {
        // Remove active from all nav items
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active to clicked nav item
        document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show target view
        const targetView = document.getElementById(viewName);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;

            // Render specific view
            switch (viewName) {
                case 'home':
                    this.renderHome();
                    break;
                case 'library':
                    this.renderLibrary();
                    break;
                case 'favorites':
                    this.renderFavorites();
                    break;
                case 'reading':
                    this.renderReading();
                    break;
                case 'completed':
                    this.renderCompleted();
                    break;
                case 'stats':
                    this.renderStats();
                    break;
            }
        }
    }

    renderHome() {
        this.renderContinueReading();
        this.renderNewManga();
        this.renderFavoritesHome();
        this.updateLibraryCount();
    }

    renderContinueReading() {
        const container = document.getElementById('continueReading');
        const mangas = this.db.getReading().slice(0, 6);
        container.innerHTML = mangas.length ? '' : '<p style="grid-column: 1/-1; text-align: center; color: #7F8C8D;">Chưa bắt đầu đọc truyện nào</p>';
        mangas.forEach(manga => {
            container.appendChild(this.createMangaCard(manga));
        });
    }

    renderNewManga() {
        const container = document.getElementById('newManga');
        const mangas = this.db.getAllMangas().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
        container.innerHTML = mangas.length ? '' : '<p style="grid-column: 1/-1; text-align: center; color: #7F8C8D;">Chưa có truyện nào</p>';
        mangas.forEach(manga => {
            container.appendChild(this.createMangaCard(manga));
        });
    }

    renderFavoritesHome() {
        const container = document.getElementById('favorites-home');
        const noFavorites = document.getElementById('noFavorites');
        const mangas = this.db.getFavorites().slice(0, 6);

        if (mangas.length === 0) {
            container.style.display = 'none';
            noFavorites.style.display = 'block';
        } else {
            container.style.display = 'grid';
            noFavorites.style.display = 'none';
            container.innerHTML = '';
            mangas.forEach(manga => {
                container.appendChild(this.createMangaCard(manga));
            });
        }
    }

    renderLibrary() {
        const container = document.getElementById('libraryContent');
        const emptyState = document.getElementById('emptyLibrary');

        let mangas = this.db.getAllMangas();

        // Filter
        if (this.currentFilter !== 'all') {
            if (this.currentFilter === 'ongoing') {
                mangas = mangas.filter(m => m.status === 'Đang Ra');
            } else if (this.currentFilter === 'completed') {
                mangas = mangas.filter(m => m.status === 'Hoàn Thành');
            } else if (this.currentFilter === 'paused') {
                mangas = mangas.filter(m => m.status === 'Tạm Ngưng');
            } else if (['manga', 'manhwa', 'manhua'].includes(this.currentFilter)) {
                const typeMap = {
                    manga: 'Manga (JP)',
                    manhwa: 'Manhwa (KR)',
                    manhua: 'Manhua (CN)'
                };
                mangas = mangas.filter(m => m.type === typeMap[this.currentFilter]);
            }
        }

        // Sort
        switch (this.currentSort) {
            case 'name':
                mangas.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'chapters':
                mangas.sort((a, b) => b.chapters.length - a.chapters.length);
                break;
            case 'rating':
                mangas.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            default: // date
                mangas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        if (mangas.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            container.style.display = 'grid';
            emptyState.style.display = 'none';
            container.innerHTML = '';
            mangas.forEach(manga => {
                container.appendChild(this.createMangaCard(manga));
            });
        }

        this.updateLibraryCount();
    }

    renderFavorites() {
        const container = document.getElementById('favoritesContent');
        const emptyState = document.getElementById('emptyFavorites');
        const mangas = this.db.getFavorites();

        if (mangas.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            container.style.display = 'grid';
            emptyState.style.display = 'none';
            container.innerHTML = '';
            mangas.forEach(manga => {
                container.appendChild(this.createMangaCard(manga));
            });
        }
    }

    renderReading() {
        const container = document.getElementById('readingContent');
        const emptyState = document.getElementById('emptyReading');
        const mangas = this.db.getReading();

        if (mangas.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            container.style.display = 'grid';
            emptyState.style.display = 'none';
            container.innerHTML = '';
            mangas.forEach(manga => {
                container.appendChild(this.createMangaCard(manga));
            });
        }
    }

    renderCompleted() {
        const container = document.getElementById('completedContent');
        const emptyState = document.getElementById('emptyCompleted');
        const mangas = this.db.getCompleted();

        if (mangas.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            container.style.display = 'grid';
            emptyState.style.display = 'none';
            container.innerHTML = '';
            mangas.forEach(manga => {
                container.appendChild(this.createMangaCard(manga));
            });
        }
    }

    createMangaCard(manga) {
        const card = document.createElement('div');
        card.className = 'manga-card';
        card.innerHTML = `
            <img src="${manga.cover || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22%3E%3C/svg%3E'}" 
                 class="manga-card-image ${!manga.cover ? 'no-image' : ''}" 
                 alt="${manga.name}" onerror="this.classList.add('no-image'); this.textContent='📚';">
            <div class="manga-card-content">
                <div class="manga-card-title">${manga.name}</div>
                <div class="manga-card-meta">${manga.type}</div>
                <div class="manga-card-meta">${manga.chapters.length} chương</div>
                <div class="manga-card-actions">
                    <button class="btn-favorite ${manga.favorite ? 'active' : ''}" data-id="${manga.id}">
                        ${manga.favorite ? '❤️' : '🤍'}
                    </button>
                    <button class="btn-read" data-id="${manga.id}">📖 Đọc</button>
                </div>
            </div>
        `;

        card.querySelector('.manga-card-image').addEventListener('click', () => {
            this.showMangaDetail(manga.id);
        });

        card.querySelector('.manga-card-title').addEventListener('click', () => {
            this.showMangaDetail(manga.id);
        });

        const favoriteBtn = card.querySelector('.btn-favorite');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            manga.favorite = !manga.favorite;
            this.db.updateManga(manga.id, manga);
            favoriteBtn.classList.toggle('active');
            favoriteBtn.textContent = manga.favorite ? '❤️' : '🤍';
            this.updateLibraryCount();
        });

        const readBtn = card.querySelector('.btn-read');
        readBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (manga.chapters.length > 0) {
                this.showReader(manga.id, manga.chapters[0].id);
            } else {
                alert('Truyện này chưa có chương nào');
            }
        });

        return card;
    }

    showMangaDetail(mangaId) {
        this.db.currentMangaId = mangaId;
        const manga = this.db.getManga(mangaId);
        if (!manga) return;

        const container = document.getElementById('mangaDetailContent');
        const coverImage = manga.cover ? `<img src="${manga.cover}" alt="${manga.name}">` : 
                          `<div style="width: 100%; height: 300px; background: #ECF0F1; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; font-size: 3rem;">📚</div>`;

        container.innerHTML = `
            <div class="manga-detail-cover">
                ${coverImage}
                <div class="manga-detail-cover-actions">
                    <button class="btn-primary" onclick="ui.showAddChapterModal(${mangaId})">+ Thêm Chương</button>
                    <button class="btn-secondary" onclick="ui.editManga(${mangaId})">✏️ Sửa</button>
                </div>
            </div>
            <div class="manga-detail-info">
                <div class="detail-row">
                    <div class="detail-label">Tên:</div>
                    <div class="detail-value">${manga.name}</div>
                </div>
                ${manga.alternativeName ? `
                <div class="detail-row">
                    <div class="detail-label">Tên Khác:</div>
                    <div class="detail-value">${manga.alternativeName}</div>
                </div>
                ` : ''}
                ${manga.author ? `
                <div class="detail-row">
                    <div class="detail-label">Tác Giả:</div>
                    <div class="detail-value">${manga.author}</div>
                </div>
                ` : ''}
                ${manga.artist ? `
                <div class="detail-row">
                    <div class="detail-label">Họa Sĩ:</div>
                    <div class="detail-value">${manga.artist}</div>
                </div>
                ` : ''}
                <div class="detail-row">
                    <div class="detail-label">Loại:</div>
                    <div class="detail-value">${manga.type}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Tình Trạng:</div>
                    <div class="detail-value">${manga.status}</div>
                </div>
                ${manga.tags && manga.tags.length > 0 ? `
                <div class="detail-row">
                    <div class="detail-label">Tags:</div>
                    <div class="detail-value">
                        <div class="tags-display">
                            ${manga.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}
                ${manga.description ? `
                <div class="detail-row" style="grid-column: 1/-1;">
                    <div class="detail-label">Mô Tả:</div>
                    <div class="detail-value">${manga.description}</div>
                </div>
                ` : ''}
                <h3 style="margin-top: 2rem; grid-column: 1/-1;">📋 Danh Sách Chương</h3>
            </div>
        `;

        const detailInfo = container.querySelector('.manga-detail-info');
        const chaptersList = this.createChaptersList(manga);
        detailInfo.appendChild(chaptersList);

        this.switchView('mangaDetail');
    }

    createChaptersList(manga) {
        const section = document.createElement('div');
        section.className = 'chapters-section';
        section.style.gridColumn = '1/-1';

        if (manga.chapters.length === 0) {
            section.innerHTML = '<p style="text-align: center; color: #7F8C8D;">Chưa có chương nào</p>';
            return section;
        }

        const list = document.createElement('div');
        list.className = 'chapters-list';

        // Sort chapters by number
        const sortedChapters = [...manga.chapters].sort((a, b) => {
            const numA = parseFloat(a.number) || 0;
            const numB = parseFloat(b.number) || 0;
            return numB - numA;
        });

        sortedChapters.forEach(chapter => {
            const item = document.createElement('div');
            item.className = 'chapter-item';

            const date = new Date(chapter.createdAt).toLocaleDateString('vi-VN');
            const pageCount = chapter.pages ? chapter.pages.length : 0;

            item.innerHTML = `
                <div class="chapter-info">
                    <div class="chapter-title">Chương ${chapter.number}${chapter.name ? ` - ${chapter.name}` : ''}</div>
                    <div class="chapter-meta">${pageCount} trang • ${date}</div>
                </div>
                <div class="chapter-actions">
                    <button class="read-btn" data-chapter-id="${chapter.id}">📖 Đọc</button>
                    <button class="delete-btn" data-chapter-id="${chapter.id}">🗑️ Xóa</button>
                </div>
            `;

            item.querySelector('.read-btn').addEventListener('click', () => {
                this.showReader(manga.id, chapter.id);
            });

            item.querySelector('.delete-btn').addEventListener('click', () => {
                this.confirmDelete(`Xóa chương ${chapter.number}?`, () => {
                    this.db.deleteChapter(manga.id, chapter.id);
                    this.showMangaDetail(manga.id);
                });
            });

            list.appendChild(item);
        });

        section.appendChild(list);
        return section;
    }

    showAddChapterModal(mangaId) {
        this.db.currentMangaId = mangaId;
        document.getElementById('addChapterForm').reset();
        document.getElementById('pagesList').innerHTML = '';
        this.openModal('addChapterModal');
    }

    displayPagePreviews(files) {
        const pagesList = document.getElementById('pagesList');
        pagesList.innerHTML = '';

        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const item = document.createElement('div');
                item.className = 'page-item';
                item.innerHTML = `
                    <img src="${e.target.result}" alt="Page ${index + 1}">
                    <div class="page-item-number">${index + 1}</div>
                    <button type="button" class="page-item-remove" data-index="${index}">✕</button>
                `;

                item.querySelector('.page-item-remove').addEventListener('click', (evt) => {
                    evt.preventDefault();
                    item.remove();
                });

                pagesList.appendChild(item);
            };
            reader.readAsDataURL(file);
        });
    }

    async handleAddChapter() {
        this.showLoading(true, 'Đang tải ảnh lên Cloudinary...');

        try {
            const mangaId = this.db.currentMangaId;
            const chapterNumber = document.getElementById('chapterNumber').value;
            const chapterName = document.getElementById('chapterName').value;
            const pageFiles = document.getElementById('pageImages').files;

            if (!mangaId || !chapterNumber) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }

            let pages = [];

            if (pageFiles.length > 0) {
                // Upload images to Cloudinary
                const uploadedImages = await this.uploader.uploadMultipleImages(pageFiles);
                pages = uploadedImages.map((img, index) => ({
                    number: index + 1,
                    url: img.url,
                    publicId: img.publicId
                }));
            }

            const chapter = {
                number: parseFloat(chapterNumber),
                name: chapterName,
                pages: pages
            };

            this.db.addChapter(mangaId, chapter);
            this.closeModal('addChapterModal');
            this.showMangaDetail(mangaId);
            alert('Thêm chương thành công!');
        } catch (error) {
            console.error('Error adding chapter:', error);
            alert('Lỗi: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showReader(mangaId, chapterId) {
        const manga = this.db.getManga(mangaId);
        const chapter = manga ? this.db.getChapter(mangaId, chapterId) : null;

        if (!chapter) {
            alert('Không tìm thấy chương');
            return;
        }

        this.db.currentMangaId = mangaId;
        this.db.currentChapterId = chapterId;

        // Update reading progress
        if (manga.readingProgress === undefined) {
            manga.readingProgress = 0;
        }
        manga.readingProgress = Math.min(100, (manga.chapters.indexOf(chapter) + 1) / manga.chapters.length * 100);
        this.db.updateManga(mangaId, manga);

        this.renderReader();
        this.switchView('reader');
    }

    renderReader() {
        const manga = this.db.getManga(this.db.currentMangaId);
        const chapter = this.db.getChapter(this.db.currentMangaId, this.db.currentChapterId);

        if (!manga || !chapter) return;

        const readerInfo = document.querySelector('.reader-info');
        const currentChapterIndex = manga.chapters.findIndex(c => c.id === chapter.id);

        readerInfo.innerHTML = `
            <p><strong>${manga.name}</strong></p>
            <p>Chương ${chapter.number} ${chapter.name ? `- ${chapter.name}` : ''}</p>
        `;

        const readerContent = document.querySelector('.reader-content');
        readerContent.innerHTML = '';
        readerContent.className = `reader-content ${this.currentMode}`;

        const pages = chapter.pages || [];
        pages.forEach((page, index) => {
            const img = document.createElement('img');
            img.src = page.url;
            img.alt = `Page ${page.number}`;
            readerContent.appendChild(img);
        });

        const pageInfo = document.querySelector('.page-info');
        pageInfo.textContent = `${currentChapterIndex + 1}/${manga.chapters.length}`;

        // Update button states
        document.getElementById('prevBtn').disabled = currentChapterIndex === 0;
        document.getElementById('nextBtn').disabled = currentChapterIndex === manga.chapters.length - 1;
    }

    previousPage() {
        const manga = this.db.getManga(this.db.currentMangaId);
        const currentIndex = manga.chapters.findIndex(c => c.id === this.db.currentChapterId);

        if (currentIndex > 0) {
            this.showReader(this.db.currentMangaId, manga.chapters[currentIndex - 1].id);
        }
    }

    nextPage() {
        const manga = this.db.getManga(this.db.currentMangaId);
        const currentIndex = manga.chapters.findIndex(c => c.id === this.db.currentChapterId);

        if (currentIndex < manga.chapters.length - 1) {
            this.showReader(this.db.currentMangaId, manga.chapters[currentIndex + 1].id);
        }
    }

    updateReaderMode() {
        const readerContent = document.querySelector('.reader-content');
        readerContent.className = `reader-content ${this.currentMode}`;
    }

    showAddMangaModal() {
        document.getElementById('addMangaForm').reset();
        document.getElementById('tagsList').innerHTML = '';
        document.getElementById('coverPreview').classList.remove('show');
        this.openModal('addMangaModal');
    }

    addTag() {
        const input = document.getElementById('tagInput');
        const tag = input.value.trim();

        if (!tag) return;

        const tagsList = document.getElementById('tagsList');
        const existingTags = Array.from(tagsList.querySelectorAll('.tag')).map(t => t.textContent.trim());

        if (existingTags.includes(tag)) {
            alert('Tag này đã tồn tại');
            return;
        }

        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag}
            <button type="button">✕</button>
        `;

        tagElement.querySelector('button').addEventListener('click', (e) => {
            e.preventDefault();
            tagElement.remove();
        });

        tagsList.appendChild(tagElement);
        input.value = '';
    }

    async handleAddManga() {
        this.showLoading(true, 'Đang xử lý...');

        try {
            const name = document.getElementById('mangaName').value;
            const alternativeName = document.getElementById('alternativeName').value;
            const author = document.getElementById('author').value;
            const artist = document.getElementById('artist').value;
            const type = document.getElementById('type').value;
            const status = document.getElementById('status').value;
            const description = document.getElementById('description').value;
            const coverFile = document.getElementById('coverImage').files[0];

            if (!name) {
                alert('Vui lòng nhập tên truyện');
                return;
            }

            const tags = Array.from(document.getElementById('tagsList').querySelectorAll('.tag')).map(t => t.textContent.trim());

            let coverUrl = null;
            if (coverFile) {
                this.showLoading(true, 'Đang t���i ảnh bìa...');
                const uploadedCover = await this.uploader.uploadImage(coverFile);
                coverUrl = uploadedCover.url;
            }

            const manga = {
                name,
                alternativeName,
                author,
                artist,
                type,
                status,
                description,
                cover: coverUrl,
                tags
            };

            this.db.addManga(manga);
            this.closeModal('addMangaModal');
            this.render();
            alert('Thêm truyện thành công!');
        } catch (error) {
            console.error('Error adding manga:', error);
            alert('Lỗi: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    editManga(mangaId) {
        // TODO: Implement edit functionality
        alert('Chức năng sửa sẽ được triển khai');
    }

    renderStats() {
        const container = document.getElementById('statsContent');
        const allMangas = this.db.getAllMangas();
        const totalChapters = allMangas.reduce((sum, m) => sum + m.chapters.length, 0);
        const favorites = this.db.getFavorites().length;
        const reading = this.db.getReading().length;
        const completed = this.db.getCompleted().length;

        // Count tags
        const tagCounts = {};
        allMangas.forEach(manga => {
            (manga.tags || []).forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Tổng Truyện</h3>
                    <div class="number">${allMangas.length}</div>
                </div>
                <div class="stat-card">
                    <h3>Tổng Chương</h3>
                    <div class="number">${totalChapters}</div>
                </div>
                <div class="stat-card">
                    <h3>Yêu Thích</h3>
                    <div class="number">${favorites}</div>
                </div>
                <div class="stat-card">
                    <h3>Đang Đọc</h3>
                    <div class="number">${reading}</div>
                </div>
                <div class="stat-card">
                    <h3>Đã Hoàn Thành</h3>
                    <div class="number">${completed}</div>
                </div>
            </div>

            ${sortedTags.length > 0 ? `
            <div class="popular-tags">
                <h3>🏷️ Tags Phổ Biến</h3>
                <div class="tag-cloud">
                    ${sortedTags.map(([tag, count]) => `
                        <div class="tag-item">
                            <span class="tag-name">${tag}</span>
                            <span class="tag-count">${count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        `;
    }

    exportData() {
        const data = this.db.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manga-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    confirmDelete(message, callback) {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmMessage').textContent = message;

        const confirmBtn = document.getElementById('confirmBtn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.addEventListener('click', () => {
            callback();
            this.closeModal('confirmModal');
        });

        this.openModal('confirmModal');
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    showLoading(show, text = 'Đang xử lý...') {
        const spinner = document.getElementById('loadingSpinner');
        const loadingText = document.getElementById('loadingText');
        if (show) {
            spinner.classList.add('active');
            loadingText.textContent = text;
        } else {
            spinner.classList.remove('active');
        }
    }

    updateLibraryCount() {
        const count = this.db.getAllMangas().length;
        document.querySelector('[data-view="library"] .count').textContent = `(${count})`;
    }

    render() {
        this.renderHome();
        this.updateLibraryCount();
    }
}

// ==========================================
// Initialize App
// ==========================================
let db, uploader, ui;

document.addEventListener('DOMContentLoaded', () => {
    db = new MangaDB();
    uploader = new CloudinaryUploader(CLOUDINARY_CONFIG);
    ui = new UIManager(db, uploader);
    
    console.log('MangaVault initialized successfully');
    console.log('Cloudinary configured:', CLOUDINARY_CONFIG.cloud_name);
});
