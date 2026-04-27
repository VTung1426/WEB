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

    // ✅ CHỨC NĂNG XÓA TRUYỆN
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

        // ✅ FIX: Cover Upload Click
        const coverUploadArea = document.getElementById('coverUploadArea');
        const coverInput = document.getElementById('coverImage');
        
        if (coverUploadArea && coverInput) {
            coverUploadArea.addEventListener('click', () => {
                coverInput.click();
            });

            coverInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const preview = document.getElementById('coverPreview');
                        preview.src = event.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

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

        // Stats
        document.getElementById('statsBtn').addEventListener('click', () => {
            this.switchView('stats');
        });

        // Add Chapter Modal
        document.getElementById('cancelAddChapter').addEventListener('click', () => {
            this.closeModal('addChapterModal');
        });

        document.getElementById('addChapterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddChapter();
        });

        // ✅ FIX: Pages Upload Click
        const pagesUploadArea = document.getElementById('pagesUploadArea');
        const pagesInput = document.getElementById('pageImages');
        
        if (pagesUploadArea && pagesInput) {
            pagesUploadArea.addEventListener('click', () => {
                pagesInput.click();
            });

            pagesUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                pagesUploadArea.classList.add('drag-over');
            });

            pagesUploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                pagesUploadArea.classList.remove('drag-over');
            });

            pagesUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                pagesUploadArea.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    pagesInput.files = files;
                    pagesInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            pagesInput.addEventListener('change', (e) => {
                this.displayPagePreviews(e.target.files);
            });
        }

        // Back buttons
        document.getElementById('backBtn').addEventListener('click', () => {
            this.switchView('library');
        });

        // Confirm modal
        document.getElementById('cancelConfirm').addEventListener('click', () => {
            this.closeModal('confirmModal');
        });
    }

    switchView(viewName) {
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.remove('active');
        });

        document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(viewName);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;

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

        switch (this.currentSort) {
            case 'name':
                mangas.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'chapters':
                mangas.sort((a, b) => b.chapters.length - a.chapters.length);
                break;
            default:
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
            <img src="${manga.cover || ''}" 
                 class="manga-card-image" 
                 alt="${manga.name}" 
                 onerror="this.style.display='none'; this.parentElement.textContent='📚';">
            <div class="manga-card-content">
                <div class="manga-card-title">${manga.name}</div>
                <div class="manga-card-meta">${manga.type}</div>
                <div class="manga-card-meta">${manga.chapters.length} chương</div>
                <div class="manga-card-actions">
                    <button class="btn-favorite ${manga.favorite ? 'active' : ''}" data-id="${manga.id}">
                        ${manga.favorite ? '❤️' : '🤍'}
                    </button>
                    <button class="btn-read" data-id="${manga.id}">📖 Xem</button>
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
            this.showMangaDetail(manga.id);
        });

        return card;
    }

    showMangaDetail(mangaId) {
        this.db.currentMangaId = mangaId;
        const manga = this.db.getManga(mangaId);
        if (!manga) return;

        const container = document.getElementById('mangaDetailContent');
        const coverImage = manga.cover ? `<img src="${manga.cover}" alt="${manga.name}" style="width:100%; border-radius:0.5rem;">` : 
                          `<div style="width: 100%; height: 300px; background: #ECF0F1; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; font-size: 3rem;">📚</div>`;

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 250px 1fr; gap: 2rem;">
                <div>
                    ${coverImage}
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button class="btn-primary" onclick="ui.showAddChapterModal()" style="flex: 1;">+ Chương</button>
                        <button class="btn-danger" onclick="ui.deleteManga('${manga.id}')" style="flex: 1;">🗑️ Xóa</button>
                    </div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                    <h2>${manga.name}</h2>
                    ${manga.author ? `<p><strong>Tác Giả:</strong> ${manga.author}</p>` : ''}
                    <p><strong>Loại:</strong> ${manga.type}</p>
                    <p><strong>Tình Trạng:</strong> ${manga.status}</p>
                    ${manga.description ? `<p><strong>Mô Tả:</strong> ${manga.description}</p>` : ''}
                    
                    <h3 style="margin-top: 2rem;">📋 Danh Sách Chương (${manga.chapters.length})</h3>
                    <div id="chaptersContainer" style="margin-top: 1rem;"></div>
                </div>
            </div>
        `;

        const chaptersContainer = document.getElementById('chaptersContainer');
        if (manga.chapters.length === 0) {
            chaptersContainer.innerHTML = '<p style="text-align: center; color: #7F8C8D;">Chưa có chương nào</p>';
        } else {
            const sortedChapters = [...manga.chapters].sort((a, b) => parseFloat(b.number) - parseFloat(a.number));
            sortedChapters.forEach(chapter => {
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #ECF0F1;';
                
                const pageCount = chapter.pages ? chapter.pages.length : 0;
                item.innerHTML = `
                    <div>
                        <strong>Chương ${chapter.number}${chapter.name ? ` - ${chapter.name}` : ''}</strong>
                        <p style="color: #999; font-size: 0.9em;">${pageCount} trang</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-secondary" onclick="ui.viewChapter('${chapter.id}')" style="padding: 0.5rem 1rem;">👁️ Xem</button>
                        <button class="btn-danger" onclick="ui.deleteChapter('${chapter.id}')" style="padding: 0.5rem 1rem;">🗑️</button>
                    </div>
                `;
                chaptersContainer.appendChild(item);
            });
        }

        this.switchView('mangaDetail');
    }

    // ✅ CHỨC NĂNG XÓA TRUYỆN
    deleteManga(mangaId) {
        if (confirm('❓ Bạn chắc chắn muốn xóa truyện này?\n(Tất cả chương sẽ bị xóa)')) {
            this.db.deleteManga(mangaId);
            this.render();
            this.switchView('library');
            alert('✅ Truyện đã bị xóa!');
        }
    }

    deleteChapter(chapterId) {
        if (confirm('❓ Bạn chắc chắn muốn xóa chương này?')) {
            const mangaId = this.db.currentMangaId;
            this.db.deleteChapter(mangaId, parseInt(chapterId));
            this.showMangaDetail(mangaId);
            alert('✅ Chương đã bị xóa!');
        }
    }

    viewChapter(chapterId) {
        const manga = this.db.getManga(this.db.currentMangaId);
        const chapter = this.db.getChapter(this.db.currentMangaId, parseInt(chapterId));
        if (!chapter) return;
        alert(`👁️ ${chapter.pages.length} trang - Chức năng đọc sẽ được thêm vào`);
    }

    showAddChapterModal() {
        document.getElementById('addChapterForm').reset();
        document.getElementById('pagesList').innerHTML = '';
        this.openModal('addChapterModal');
    }

    displayPagePreviews(files) {
        const pagesList = document.getElementById('pagesList');
        pagesList.innerHTML = '';

        if (!files || files.length === 0) return;

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
                    evt.stopPropagation();
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
            alert('✅ Thêm chương thành công!');
        } catch (error) {
            console.error('Error adding chapter:', error);
            alert('❌ Lỗi: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showAddMangaModal() {
        document.getElementById('addMangaForm').reset();
        document.getElementById('coverPreview').style.display = 'none';
        this.openModal('addMangaModal');
    }

    async handleAddManga() {
        this.showLoading(true, 'Đang xử lý...');

        try {
            const name = document.getElementById('mangaName').value;
            const author = document.getElementById('author').value;
            const type = document.getElementById('type').value;
            const status = document.getElementById('status').value;
            const description = document.getElementById('description').value;
            const coverFile = document.getElementById('coverImage').files[0];

            if (!name) {
                alert('Vui lòng nhập tên truyện');
                return;
            }

            let coverUrl = null;
            if (coverFile) {
                this.showLoading(true, 'Đang tải ảnh bìa...');
                const uploadedCover = await this.uploader.uploadImage(coverFile);
                coverUrl = uploadedCover.url;
            }

            const manga = {
                name,
                author,
                type,
                status,
                description,
                cover: coverUrl
            };

            this.db.addManga(manga);
            this.closeModal('addMangaModal');
            this.render();
            alert('✅ Thêm truyện thành công!');
        } catch (error) {
            console.error('Error adding manga:', error);
            alert('❌ Lỗi: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    renderStats() {
        const container = document.getElementById('statsContent');
        const allMangas = this.db.getAllMangas();
        const totalChapters = allMangas.reduce((sum, m) => sum + m.chapters.length, 0);
        const favorites = this.db.getFavorites().length;
        const reading = this.db.getReading().length;
        const completed = this.db.getCompleted().length;

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem;">
                <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); text-align: center;">
                    <h3 style="color: #999; font-size: 0.9rem;">Tổng Truyện</h3>
                    <div style="font-size: 2.5rem; font-weight: 700; color: #FF6B6B;">${allMangas.length}</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); text-align: center;">
                    <h3 style="color: #999; font-size: 0.9rem;">Tổng Chương</h3>
                    <div style="font-size: 2.5rem; font-weight: 700; color: #FF6B6B;">${totalChapters}</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); text-align: center;">
                    <h3 style="color: #999; font-size: 0.9rem;">Yêu Thích</h3>
                    <div style="font-size: 2.5rem; font-weight: 700; color: #FF6B6B;">${favorites}</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); text-align: center;">
                    <h3 style="color: #999; font-size: 0.9rem;">Đang Đọc</h3>
                    <div style="font-size: 2.5rem; font-weight: 700; color: #FF6B6B;">${reading}</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); text-align: center;">
                    <h3 style="color: #999; font-size: 0.9rem;">Hoàn Thành</h3>
                    <div style="font-size: 2.5rem; font-weight: 700; color: #FF6B6B;">${completed}</div>
                </div>
            </div>
        `;
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
    
    console.log('✅ MangaVault initialized successfully');
});
