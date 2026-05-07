const manga = [
  {
    id: "sky-rail",
    title: "Duong Ray Tren May",
    author: "Minh Quan",
    team: "Cloud Note",
    status: "Dang tien hanh",
    genres: ["Phieu luu", "Gia tuong", "Doi thuong"],
    views: 184200,
    likes: 9420,
    color1: "#0e9384",
    color2: "#356fca",
    description: "Mot co tho may tim thay ban do dan toi thanh pho treo tren tang may cuoi cung.",
    chapters: [
      { no: 1, title: "Ga tau khong bong", locked: false },
      { no: 2, title: "Tin hieu mau luc", locked: false },
      { no: 3, title: "Mat khau cua gio", locked: true, password: "harbor" }
    ]
  },
  {
    id: "paper-lantern",
    title: "Den Giay Cuoi Pho",
    author: "Ha Vy",
    team: "Amber Fox",
    status: "Hoan thanh",
    genres: ["Lang man", "Bi an"],
    views: 98210,
    likes: 6130,
    color1: "#c98420",
    color2: "#c43d5f",
    description: "Cua hang den giay chi mo vao nua dem va moi chiec den giu mot loi hua chua gui.",
    chapters: [
      { no: 1, title: "Anh den qua cua so", locked: false },
      { no: 2, title: "Buc thu bi uot", locked: false },
      { no: 3, title: "Ngay pho tat den", locked: false }
    ]
  },
  {
    id: "atlas-room",
    title: "Can Phong Atlas",
    author: "Nhat Lam",
    team: "Northline",
    status: "Tam dung",
    genres: ["Hanh dong", "Vien tuong"],
    views: 126005,
    likes: 7211,
    color1: "#4b5563",
    color2: "#0e9384",
    description: "Moi buc tuong trong can phong la mot chau luc dang thay doi theo nhip tim cua chu nhan.",
    chapters: [
      { no: 1, title: "Ban do khong bien gioi", locked: false },
      { no: 2, title: "Nguoi giu toa do", locked: false }
    ]
  },
  {
    id: "salt-moon",
    title: "Mat Trang Vi Muoi",
    author: "Tue Nhi",
    team: "Sea Glass",
    status: "Dang tien hanh",
    genres: ["Doi thuong", "Hai huoc"],
    views: 76450,
    likes: 4880,
    color1: "#3b82f6",
    color2: "#f59e0b",
    description: "Quan an ven bien co mot dau bep khong the nem duoc vi, cho den khi trang tron len.",
    chapters: [
      { no: 1, title: "Noi sup thu nhat", locked: false },
      { no: 2, title: "Thuc don dem trang", locked: false }
    ]
  },
  {
    id: "circuit-flower",
    title: "Hoa Mach Dien",
    author: "An Du",
    team: "Binary Bloom",
    status: "Dang tien hanh",
    genres: ["Vien tuong", "Hoc duong"],
    views: 149030,
    likes: 8520,
    color1: "#7c3aed",
    color2: "#0ea5e9",
    description: "Mot hoc sinh lap trinh trong thay nhung bong hoa moc ra tu bo nho cua robot truong.",
    chapters: [
      { no: 1, title: "Hat giong silicon", locked: false },
      { no: 2, title: "Loi chao 0101", locked: false },
      { no: 3, title: "Vung nho mua xuan", locked: false }
    ]
  }
];

const teams = [
  { name: "Cloud Note", members: 9, projects: 2, status: "Dang tuyen bien tap" },
  { name: "Sea Glass", members: 6, projects: 1, status: "Cho duyet ung vien" },
  { name: "Binary Bloom", members: 12, projects: 3, status: "Mo don dich gia" }
];

const threads = [
  { title: "Goi y truyen de doc cuoi tuan", replies: 28, tag: "Thao luan" },
  { title: "Lich release thang nay", replies: 11, tag: "Thong bao" },
  { title: "Tuyen redraw cho du an moi", replies: 7, tag: "Tuyen thanh vien" }
];

const state = {
  route: "home",
  query: "",
  genre: "Tat ca",
  status: "Tat ca",
  currentManga: manga[0].id,
  currentChapter: 1,
  adminTab: "manga",
  communityTab: "forum",
  comments: JSON.parse(localStorage.getItem("story-comments") || "{}"),
  shelf: JSON.parse(localStorage.getItem("story-shelf") || "[]"),
  history: JSON.parse(localStorage.getItem("story-history") || "[]"),
  notifications: JSON.parse(localStorage.getItem("story-notifications") || JSON.stringify([
    { id: 1, text: "Co tra loi moi trong Duong Ray Tren May", read: false },
    { id: 2, text: "Cloud Note vua dang chuong moi", read: false },
    { id: 3, text: "Yeu cau vao nhom Sea Glass dang cho duyet", read: false }
  ]))
};

const view = document.querySelector("#view");
const searchInput = document.querySelector("#globalSearch");
const suggestions = document.querySelector("#suggestions");
const notificationBadge = document.querySelector("#notificationBadge");

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(n) {
  return n.toLocaleString("vi-VN");
}

function byId(id) {
  return manga.find((item) => item.id === id) || manga[0];
}

function setRoute(route, data = {}) {
  Object.assign(state, data, { route });
  document.body.classList.remove("nav-open");
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });
  render();
}

function coverStyle(item) {
  return `--c1:${item.color1};--c2:${item.color2}`;
}

function mangaCard(item) {
  const saved = state.shelf.includes(item.id);
  return `
    <article class="card">
      <div class="cover" style="${coverStyle(item)}">
        <span class="cover-title">${item.title}</span>
        <small>${item.team}</small>
      </div>
      <div class="card-body">
        <h3>${item.title}</h3>
        <div class="meta"><span>${item.status}</span><span>${money(item.views)} luot doc</span></div>
        <div class="tags">${item.genres.map((g) => `<span class="tag">${g}</span>`).join("")}</div>
        <div class="actions" style="margin-top:12px">
          <button class="btn primary" data-detail="${item.id}">Chi tiet</button>
          <button class="btn" data-read="${item.id}" data-chapter="1">Doc ngay</button>
          <button class="btn ghost" data-save="${item.id}">${saved ? "Da luu" : "Luu"}</button>
        </div>
      </div>
    </article>
  `;
}

function renderHome() {
  const featured = manga.slice(0, 3);
  const newest = [...manga].reverse();
  view.innerHTML = `
    <section class="hero-panel">
      <div class="hero-copy">
        <span class="eyebrow">Ban web moi doc lap</span>
        <h1>Doc, luu va quan ly truyen trong mot khong gian gon gang.</h1>
        <p>Ban nay mo phong cac luong chinh cua website doc truyen: tim kiem nhanh, thu vien co loc, chi tiet truyen, doc chuong, binh luan, tu sach, lich su, cong dong va quan tri.</p>
        <div class="actions">
          <button class="btn primary" data-route="library">Mo thu vien</button>
          <button class="btn" data-random>Chuong ngau nhien</button>
        </div>
        <div class="stats-row">
          <span class="stat"><strong>${manga.length}</strong> Bo truyen</span>
          <span class="stat"><strong>${manga.reduce((sum, item) => sum + item.chapters.length, 0)}</strong> Chuong</span>
          <span class="stat"><strong>${state.shelf.length}</strong> Dang luu</span>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="book-stack">
          <span class="book" style="--x:3%;--y:18%;--r:-10deg;--c1:#0e9384;--c2:#356fca"></span>
          <span class="book" style="--x:31%;--y:6%;--r:5deg;--c1:#c98420;--c2:#c43d5f"></span>
          <span class="book" style="--x:56%;--y:22%;--r:13deg;--c1:#4b5563;--c2:#0ea5e9"></span>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <h2>Truyen noi bat</h2>
        <button class="btn ghost" data-route="library">Xem tat ca</button>
      </div>
      <div class="grid cards">${featured.map(mangaCard).join("")}</div>
    </section>
    <section class="section">
      <div class="section-head">
        <h2>Moi cap nhat</h2>
      </div>
      <div class="grid cards">${newest.map(mangaCard).join("")}</div>
    </section>
  `;
}

function filteredManga() {
  const q = state.query.trim().toLowerCase();
  return manga.filter((item) => {
    const matchQuery = !q || [item.title, item.author, item.team, ...item.genres].join(" ").toLowerCase().includes(q);
    const matchGenre = state.genre === "Tat ca" || item.genres.includes(state.genre);
    const matchStatus = state.status === "Tat ca" || item.status === state.status;
    return matchQuery && matchGenre && matchStatus;
  });
}

function renderLibrary() {
  const genres = ["Tat ca", ...new Set(manga.flatMap((item) => item.genres))];
  const statuses = ["Tat ca", ...new Set(manga.map((item) => item.status))];
  const list = filteredManga();
  view.innerHTML = `
    <section class="section" style="margin-top:0">
      <div class="section-head">
        <h1>Thu vien truyen</h1>
        <span class="chip">${list.length} ket qua</span>
      </div>
      <div class="filters">
        <input id="librarySearch" value="${state.query}" placeholder="Nhap ten truyen, tac gia..." />
        <select id="genreFilter">${genres.map((g) => `<option ${g === state.genre ? "selected" : ""}>${g}</option>`).join("")}</select>
        <select id="statusFilter">${statuses.map((s) => `<option ${s === state.status ? "selected" : ""}>${s}</option>`).join("")}</select>
        <button class="btn" id="clearFilters">Xoa loc</button>
      </div>
      ${list.length ? `<div class="grid cards">${list.map(mangaCard).join("")}</div>` : `<div class="empty">Khong co truyen phu hop bo loc hien tai.</div>`}
    </section>
  `;
}

function renderDetail() {
  const item = byId(state.currentManga);
  const saved = state.shelf.includes(item.id);
  view.innerHTML = `
    <section class="detail-layout">
      <div class="detail-cover" style="${coverStyle(item)}">
        <span class="eyebrow" style="color:#fff">Ho so truyen</span>
        <h1>${item.title}</h1>
      </div>
      <div class="panel">
        <div class="section-head">
          <div>
            <h1>${item.title}</h1>
            <div class="meta"><span>Tac gia: ${item.author}</span><span>Nhom: ${item.team}</span><span>${item.status}</span></div>
          </div>
          <button class="btn ${saved ? "" : "primary"}" data-save="${item.id}">${saved ? "Bo luu" : "Luu truyen"}</button>
        </div>
        <p>${item.description}</p>
        <div class="tags">${item.genres.map((g) => `<span class="tag">${g}</span>`).join("")}</div>
        <div class="stats-row">
          <span class="stat"><strong>${money(item.views)}</strong> Luot doc</span>
          <span class="stat"><strong>${money(item.likes)}</strong> Yeu thich</span>
          <span class="stat"><strong>${item.chapters.length}</strong> Chuong</span>
        </div>
        <div class="actions" style="margin-top:16px">
          <button class="btn primary" data-read="${item.id}" data-chapter="1">Doc tu dau</button>
          <button class="btn" data-share="${item.id}">Chia se</button>
        </div>
        <div class="chapter-list">
          ${item.chapters.map((chapter) => `
            <div class="chapter-row">
              <div>
                <strong>Chuong ${chapter.no}: ${chapter.title}</strong>
                <div class="meta">${chapter.locked ? "Can mat khau: harbor" : "Mo doc tu do"}</div>
              </div>
              <button class="btn" data-read="${item.id}" data-chapter="${chapter.no}">${chapter.locked ? "Mo khoa" : "Doc"}</button>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderReader() {
  const item = byId(state.currentManga);
  const chapter = item.chapters.find((c) => c.no === Number(state.currentChapter)) || item.chapters[0];
  view.innerHTML = `
    <article class="reader-shell">
      <div class="reader-toolbar">
        <div>
          <button class="btn ghost" data-detail="${item.id}">Tro ve chi tiet</button>
          <strong>${item.title} - Chuong ${chapter.no}</strong>
          <div class="meta">${chapter.title}</div>
        </div>
        <select id="chapterSelect" class="field" style="max-width:220px">
          ${item.chapters.map((c) => `<option value="${c.no}" ${c.no === chapter.no ? "selected" : ""}>Chuong ${c.no}</option>`).join("")}
        </select>
      </div>
      <div class="reader-page">
        <div class="page-panel">
          <div class="fake-comic">
            <div class="panel-frame"></div>
            <div class="panel-frame"></div>
            <div class="panel-frame"></div>
            <div class="panel-frame"></div>
          </div>
        </div>
        <div class="actions">
          <button class="btn" data-prev="${item.id}" ${chapter.no === 1 ? "disabled" : ""}>Chuong truoc</button>
          <button class="btn primary" data-next="${item.id}" ${chapter.no === item.chapters.length ? "disabled" : ""}>Chuong sau</button>
          <button class="btn" id="scrollComments">Binh luan</button>
        </div>
      </div>
      <section class="section" id="commentsArea">
        <h2>Binh luan</h2>
        <div class="comment-box">
          <div class="panel">
            ${(state.comments[item.id] || []).map((comment) => `
              <div class="comment">
                <strong>${comment.name}</strong>
                <p>${comment.text}</p>
                <div class="comment-actions">
                  <button class="btn ghost">Thich ${comment.likes}</button>
                  <button class="btn ghost">Bao cao</button>
                </div>
              </div>
            `).join("") || `<div class="empty">Chua co binh luan nao cho truyen nay.</div>`}
          </div>
          <form class="panel" id="commentForm">
            <h3>Viet binh luan</h3>
            <textarea id="commentText" placeholder="Chia se cam nghi cua ban"></textarea>
            <button class="btn primary" type="submit">Gui binh luan</button>
          </form>
        </div>
      </section>
    </article>
  `;
  saveHistory(item, chapter);
}

function saveHistory(item, chapter) {
  const entry = { id: item.id, chapter: chapter.no, title: item.title, at: new Date().toLocaleString("vi-VN") };
  state.history = [entry, ...state.history.filter((old) => old.id !== item.id)].slice(0, 12);
  persist("story-history", state.history);
}

function renderShelf() {
  const saved = state.shelf.map(byId);
  view.innerHTML = `
    <section>
      <div class="section-head">
        <h1>Tu sach cua ban</h1>
        <span class="chip">${saved.length} truyen da luu</span>
      </div>
      ${saved.length ? `<div class="grid cards">${saved.map(mangaCard).join("")}</div>` : `<div class="empty">Ban chua luu truyen nao. Hay vao thu vien va bam Luu.</div>`}
    </section>
  `;
}

function renderHistory() {
  view.innerHTML = `
    <section>
      <div class="section-head">
        <h1>Lich su doc</h1>
        <button class="btn" id="clearHistory">Xoa lich su</button>
      </div>
      <div class="grid">
        ${state.history.map((entry) => `
          <div class="chapter-row">
            <div>
              <strong>${entry.title}</strong>
              <div class="meta">Dang doc chuong ${entry.chapter} - ${entry.at}</div>
            </div>
            <button class="btn primary" data-read="${entry.id}" data-chapter="${entry.chapter}">Doc tiep</button>
          </div>
        `).join("") || `<div class="empty">Chua co lich su doc.</div>`}
      </div>
    </section>
  `;
}

function renderCommunity() {
  view.innerHTML = `
    <section>
      <div class="section-head">
        <h1>Cong dong</h1>
        <button class="btn primary" id="joinTeam">Gui yeu cau vao nhom</button>
      </div>
      <div class="tabs">
        <button class="tab ${state.communityTab === "forum" ? "active" : ""}" data-community-tab="forum">Dien dan</button>
        <button class="tab ${state.communityTab === "teams" ? "active" : ""}" data-community-tab="teams">Nhom dich</button>
        <button class="tab ${state.communityTab === "messages" ? "active" : ""}" data-community-tab="messages">Nhan tin</button>
      </div>
      <div class="community-grid">
        <div class="panel">
          ${state.communityTab === "forum" ? renderForum() : state.communityTab === "teams" ? renderTeams() : renderMessages()}
        </div>
        <aside class="panel">
          <h2>Thong bao</h2>
          <div class="grid">
            ${state.notifications.map((note) => `
              <div class="notice-row">
                <span>${note.text}</span>
                <button class="btn ghost" data-note="${note.id}">${note.read ? "Da doc" : "Danh dau"}</button>
              </div>
            `).join("")}
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderForum() {
  return `<h2>Dien dan</h2>${threads.map((thread) => `
    <div class="thread-row">
      <div><strong>${thread.title}</strong><div class="meta">${thread.tag} - ${thread.replies} phan hoi</div></div>
      <button class="btn">Mo</button>
    </div>
  `).join("")}`;
}

function renderTeams() {
  return `<h2>Nhom dich</h2>${teams.map((team) => `
    <div class="thread-row">
      <div><strong>${team.name}</strong><div class="meta">${team.members} thanh vien - ${team.projects} du an - ${team.status}</div></div>
      <button class="btn">Xem nhom</button>
    </div>
  `).join("")}`;
}

function renderMessages() {
  return `<h2>Nhan tin</h2>
    <div class="message-row"><div><strong>Mai Tran</strong><div class="meta">Ban gui file anh chuong 2 chua?</div></div><span class="chip">2 moi</span></div>
    <div class="message-row"><div><strong>Cloud Note</strong><div class="meta">Hop nhom luc 21:00</div></div><span class="chip">Nhom</span></div>
    <textarea placeholder="Soan tin nhanh"></textarea>
    <button class="btn primary" id="sendMessage">Gui tin</button>`;
}

function renderAccount() {
  view.innerHTML = `
    <section>
      <div class="section-head"><h1>Tai khoan</h1><span class="chip">Dang nhap bang Google mo phong</span></div>
      <div class="account-grid">
        <form class="panel" id="profileForm">
          <h2>Ho so ca nhan</h2>
          <label>Ten hien thi<input class="field" value="Linh An" /></label>
          <label>Mo ta<textarea>Doc truyen vao buoi toi, thich the loai gia tuong va doi thuong.</textarea></label>
          <label>Link xa hoi<input class="field" value="https://story.example/linhan" /></label>
          <button class="btn primary">Cap nhat ho so</button>
        </form>
        <div class="panel">
          <h2>Trang cong khai</h2>
          <p>Hien thi avatar, mo ta, thanh tich doc va nut nhan tin cho thanh vien khac.</p>
          <div class="stats-row">
            <span class="stat"><strong>${state.history.length}</strong> Lich su</span>
            <span class="stat"><strong>${state.shelf.length}</strong> Tu sach</span>
          </div>
          <button class="btn warn" id="regenCode">Tao lai ma ket noi</button>
        </div>
      </div>
    </section>
  `;
}

function renderAdmin() {
  view.innerHTML = `
    <section>
      <div class="section-head"><h1>Quan tri noi dung</h1><span class="chip">Bang dieu khien mo phong</span></div>
      <div class="tabs">
        <button class="tab ${state.adminTab === "manga" ? "active" : ""}" data-admin-tab="manga">Truyen</button>
        <button class="tab ${state.adminTab === "chapters" ? "active" : ""}" data-admin-tab="chapters">Chuong</button>
        <button class="tab ${state.adminTab === "comments" ? "active" : ""}" data-admin-tab="comments">Binh luan</button>
        <button class="tab ${state.adminTab === "members" ? "active" : ""}" data-admin-tab="members">Thanh vien</button>
      </div>
      <div class="admin-grid">
        <div class="panel">${renderAdminTable()}</div>
        <form class="panel" id="adminForm">
          <h2>Tac vu nhanh</h2>
          <input class="field" placeholder="Ten truyen hoac thanh vien" />
          <select class="field"><option>Hien thi</option><option>An</option><option>Cho duyet</option><option>Khoa</option></select>
          <textarea placeholder="Ghi chu quan tri"></textarea>
          <button class="btn primary">Luu thay doi</button>
        </form>
      </div>
    </section>
  `;
}

function renderAdminTable() {
  if (state.adminTab === "manga") {
    return `<h2>Danh sach truyen</h2><table class="table"><thead><tr><th>Ten</th><th>Trang thai</th><th>Chuong</th></tr></thead><tbody>${manga.map((item) => `<tr><td>${item.title}</td><td>${item.status}</td><td>${item.chapters.length}</td></tr>`).join("")}</tbody></table>`;
  }
  if (state.adminTab === "chapters") {
    return `<h2>Quan ly chuong</h2><table class="table"><thead><tr><th>Truyen</th><th>Moi nhat</th><th>Xu ly</th></tr></thead><tbody>${manga.map((item) => `<tr><td>${item.title}</td><td>${item.chapters.length}</td><td>San sang</td></tr>`).join("")}</tbody></table>`;
  }
  if (state.adminTab === "comments") {
    return `<h2>Duyet binh luan</h2><div class="grid"><div class="notice-row"><span>Loc tu cam va bao cao theo loat</span><button class="btn warn">Xu ly</button></div><div class="notice-row"><span>3 binh luan moi dang cho duyet</span><button class="btn">Mo hang doi</button></div></div>`;
  }
  return `<h2>Thanh vien va nhom</h2><table class="table"><thead><tr><th>Ten</th><th>Vai tro</th><th>Trang thai</th></tr></thead><tbody><tr><td>Linh An</td><td>Reader</td><td>Hoat dong</td></tr><tr><td>Cloud Note</td><td>Nhom dich</td><td>Da duyet</td></tr></tbody></table>`;
}

function render() {
  updateNotificationBadge();
  if (state.route === "home") renderHome();
  if (state.route === "library") renderLibrary();
  if (state.route === "detail") renderDetail();
  if (state.route === "reader") renderReader();
  if (state.route === "shelf") renderShelf();
  if (state.route === "history") renderHistory();
  if (state.route === "community") renderCommunity();
  if (state.route === "account") renderAccount();
  if (state.route === "admin") renderAdmin();
}

function updateNotificationBadge() {
  const unread = state.notifications.filter((note) => !note.read).length;
  notificationBadge.textContent = unread;
  notificationBadge.classList.toggle("hidden", unread === 0);
  persist("story-notifications", state.notifications);
}

function toast(text) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  document.querySelector("#toastStack").append(el);
  setTimeout(() => el.remove(), 2400);
}

function tryRead(id, chapterNo) {
  const item = byId(id);
  const chapter = item.chapters.find((c) => c.no === Number(chapterNo));
  if (chapter?.locked) {
    const password = prompt("Chuong nay can mat khau. Goi y: harbor");
    if (password !== chapter.password) {
      toast("Mat khau chua dung");
      return;
    }
  }
  setRoute("reader", { currentManga: id, currentChapter: Number(chapterNo) });
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;

  if (target.dataset.route) setRoute(target.dataset.route);
  if (target.dataset.detail) setRoute("detail", { currentManga: target.dataset.detail });
  if (target.dataset.read) tryRead(target.dataset.read, target.dataset.chapter);
  if (target.dataset.save) {
    const id = target.dataset.save;
    state.shelf = state.shelf.includes(id) ? state.shelf.filter((saved) => saved !== id) : [...state.shelf, id];
    persist("story-shelf", state.shelf);
    toast(state.shelf.includes(id) ? "Da luu vao tu sach" : "Da bo luu");
    render();
  }
  if (target.dataset.random !== undefined) {
    const item = manga[Math.floor(Math.random() * manga.length)];
    const chapter = item.chapters[Math.floor(Math.random() * item.chapters.length)];
    tryRead(item.id, chapter.no);
  }
  if (target.dataset.prev) tryRead(target.dataset.prev, Number(state.currentChapter) - 1);
  if (target.dataset.next) tryRead(target.dataset.next, Number(state.currentChapter) + 1);
  if (target.dataset.share) {
    navigator.clipboard?.writeText(`${location.origin}${location.pathname}#${target.dataset.share}`);
    toast("Da sao chep lien ket chia se");
  }
  if (target.dataset.note) {
    const note = state.notifications.find((item) => item.id === Number(target.dataset.note));
    if (note) note.read = true;
    render();
  }
  if (target.dataset.adminTab) {
    state.adminTab = target.dataset.adminTab;
    render();
  }
  if (target.dataset.communityTab) {
    state.communityTab = target.dataset.communityTab;
    render();
  }
  if (target.id === "clearFilters") {
    state.query = "";
    state.genre = "Tat ca";
    state.status = "Tat ca";
    render();
  }
  if (target.id === "clearHistory") {
    state.history = [];
    persist("story-history", state.history);
    render();
  }
  if (target.id === "scrollComments") document.querySelector("#commentsArea")?.scrollIntoView({ behavior: "smooth" });
  if (target.id === "joinTeam") toast("Da gui yeu cau tham gia nhom dich");
  if (target.id === "sendMessage") toast("Da gui tin nhan");
  if (target.id === "regenCode") toast("Ma ket noi moi: SH-" + Math.floor(1000 + Math.random() * 9000));
  if (target.id === "notificationButton") setRoute("community");
});

document.addEventListener("change", (event) => {
  if (event.target.id === "genreFilter") {
    state.genre = event.target.value;
    render();
  }
  if (event.target.id === "statusFilter") {
    state.status = event.target.value;
    render();
  }
  if (event.target.id === "chapterSelect") {
    tryRead(state.currentManga, event.target.value);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "librarySearch") {
    state.query = event.target.value;
    renderLibrary();
  }
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.id === "commentForm") {
    const text = document.querySelector("#commentText").value.trim();
    if (!text) return;
    const id = state.currentManga;
    state.comments[id] = [{ name: "Linh An", text, likes: 0 }, ...(state.comments[id] || [])];
    persist("story-comments", state.comments);
    toast("Da gui binh luan");
    renderReader();
  }
  if (event.target.id === "profileForm") toast("Da cap nhat ho so");
  if (event.target.id === "adminForm") toast("Da luu tac vu quan tri");
});

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    suggestions.hidden = true;
    return;
  }
  const found = manga.filter((item) => [item.title, item.author, item.team, ...item.genres].join(" ").toLowerCase().includes(q)).slice(0, 5);
  suggestions.innerHTML = found.map((item) => `
    <button class="suggestion" data-detail="${item.id}">
      <span class="avatar">${item.title.slice(0, 2).toUpperCase()}</span>
      <span><strong>${item.title}</strong><br><small>${item.author} - ${item.team}</small></span>
      <span class="chip">${item.status}</span>
    </button>
  `).join("") || `<div class="suggestion">Khong tim thay ket qua</div>`;
  suggestions.hidden = false;
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    state.query = searchInput.value;
    suggestions.hidden = true;
    setRoute("library");
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-box")) suggestions.hidden = true;
});

document.querySelector("#menuToggle").addEventListener("click", () => {
  document.body.classList.toggle("nav-open");
});

render();
