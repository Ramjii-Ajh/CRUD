const STORAGE_KEY = 'crud_app_data';
const q = (s, el = document) => el.querySelector(s);
const qs = (s, el = document) => Array.from(el.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- Helpers untuk LocalStorage dan Data ----------
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function seedData() {
    const s = [
        // Perbaiki role agar konsisten dengan Admin/User
        { id: uid(), name: 'Ramtzy', email: 'anjay@gmail.com', role: 'Admin', notes: 'ini note admin', createdAt: Date.now() },
        { id: uid(), name: 'Wiltzy', email: 'wiltzy@gmail.com', role: 'User', notes: 'ini note user', createdAt: Date.now() - 3600000 }, // Dibuat 1 jam lalu
    ];
    saveData(s);
    return s;
}

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        // Jika tidak ada data di localStorage, panggil seedData
        return raw ? JSON.parse(raw) : seedData();
    } catch (e) {
        // Jika error, kembalikan array kosong
        console.error("Gagal memuat data dari localStorage:", e);
        return [];
    }
}

const Views = {
    dashboard: renderdashboard, // Perbaikan ejaan: Dashbard -> dashboard
    home: renderhome,
    add: renderadd,
    edit: renderedit,
    settings: rendersettings,
    about: renderabout, // Tambahkan fungsi renderabout ke Views
};

// ---------- Navigation ----------
function setActive(routeHash) {
    qs('#main-nav a').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === routeHash);
    });
}

// ---------- Router ----------
function router() {
    const hash = location.hash || '#/dashboard';
    const cleanHash = hash.split('?')[0]; // Hapus query string
    
    // Logika untuk menentukan base path: #/edit/id -> #/edit, atau #/home
    const base = cleanHash.startsWith('#/edit/') ? '#/edit' : cleanHash.split('/').slice(0, 2).join('/');
    
    setActive(base);

    if (cleanHash.startsWith('#/edit/')) {
        const id = cleanHash.split('/')[2];
        Views.edit(id);
        return;
    }
    
    const path = cleanHash.slice(2).split('/')[0];
    
    // Panggil fungsi view, fallback ke Views.dashboard
    const viewFn = Views[path] || Views.dashboard;
    viewFn();
}


// ---------- Render functions ----------
function renderdashboard() {
    const data = loadData();
    const root = q('#view-root');
    root.innerHTML = `
    <header class="hdr">
    <h2>Dashboard</h2>
    <div class="muted">Ringkasan</div></header>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
      <div class="card">
      <div class="muted">Total items</div>
      <div style="font-size:28px;font-weight:700">${data.length}</div>
      </div>
      <div class="card">
      <div class="muted">Admin</div>
      <div style="font-size:22px;font-weight:700">${data.filter(d => d.role.toLowerCase() === 'admin').length}</div>
      </div>
      <div class="card">
      <div class="muted">User</div>
      <div style="font-size:22px;font-weight:700">${data.filter(d => d.role.toLowerCase() === 'user').length}</div>
      </div>
    </div>
    <div style="margin-top:16px" class="card">
      <div style="font-weight:600;margin-bottom:8px">Recent entries</div>
      ${data.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(d => `
        <div style="padding:8px 0;border-bottom:1px solid #f1f5f9">
          <div style="display:flex;justify-content:space-between">
            <div><strong>${escapeHtml(d.name)}</strong> <span class="muted">(${d.role})</span></div>
            <div class="muted">${new Date(d.createdAt).toLocaleString()}</div>
          </div>
          <div class="muted" style="font-size:13px">${escapeHtml(d.email)} — ${escapeHtml(d.notes)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// Home / List view
function renderhome() {
    const data = loadData();
    const root = q('#view-root');
    root.innerHTML = `
    <header class="hdr"><h2>Home — Tabel</h2>
      <div>
        <input id="search" placeholder="Cari nama atau email..." style="padding:8px;border-radius:8px;border:1px solid #e6e9f2;margin-right:8px">
        <button class="btn" id="btn-add">➕ Tambah</button>
      </div>
    </header>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="muted">Tabel data sekarang</div>
        <div class="muted">Total: <strong>${data.length}</strong></div>
      </div>
      <table id="table-main">
        <thead><tr>
        <th>#</th>
        <th>Nama</th>
        <th>Email</th>
        <th>Role</th>
        <th>Catatan</th>
        <th>Aksi</th>
        </tr>
        </thead>
        <tbody>${data.map((d, i) => `
          <tr data-id="${d.id}">
            <td>${i + 1}</td>
            <td>${escapeHtml(d.name)}</td>
            <td>${escapeHtml(d.email)}</td>
            <td>${escapeHtml(d.role)}</td>
            <td>${escapeHtml(d.notes)}</td>
            <td>
              <button class="btn ghost btn-edit" data-id="${d.id}">Edit</button>
              <button class="btn danger btn-delete small" data-id="${d.id}">Hapus</button>
            </td>
          </tr>
        `).join('')}</tbody>
      </table>
    </div>
  `;

  // Event bindings and handlers
    q('#btn-add').addEventListener('click', () => location.hash = '#/add');
    q('#search').addEventListener('input', (e) => {
        const qstr = e.target.value.toLowerCase();
        qs('#table-main tbody tr').forEach(tr => {
            const name = tr.children[1].textContent.toLowerCase();
            const email = tr.children[2].textContent.toLowerCase();
            tr.style.display = (name.includes(qstr) || email.includes(qstr)) ? '' : 'none';
        });
    });
    qs('.btn-edit').forEach(b => b.addEventListener('click', e => {
        const id = e.currentTarget.getAttribute('data-id');
        location.hash = '#/edit/' + id;
    }));
    qs('.btn-delete').forEach(b => b.addEventListener('click', e => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Yakin ingin menghapus data ini?')) {
            let arr = loadData();
            arr = arr.filter(x => x.id !== id);
            saveData(arr); // Pastikan saveData dipanggil
            router(); // Perbaikan: Ganti renderHome() menjadi router()
        }
    }));
}

// Add view and form
function renderadd() {
    const root = q('#view-root');
    root.innerHTML = `
    <header class="hdr">
    <h2>Tambah Data</h2>
    <div class="muted">Isi form di bawah</div>
    </header>
    <div class="card">
      <form id="form-add" class="row">
        <div><label>Nama</label>
        <input type="text" id="f-name" required /></div>
        <div>
        <label>Email</label><input type="text" id="f-email" />
        </div>
        <div>
        <label>Role</label>
        <select id="f-role">
        <option>Admin</option>
        <option selected>User</option>
        </select>
        </div>
        <div>
        <label>Umur (optional)</label>
        <input type="number" id="f-age" />
        </div>
        <div class="full">
        <label>Catatan</label><textarea id="f-notes" rows="3"></textarea>
        </div>
        <div class="controls full">
          <button class="btn" type="submit">Simpan</button>
          <button class="btn ghost" id="cancel-add" type="button">Batal</button>
        </div>
      </form>
    </div>`;
    q('#cancel-add').addEventListener('click', () => location.hash = '#/home');
    q('#form-add').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const name = q('#f-name').value.trim();
        const email = q('#f-email').value.trim();
        const role = q('#f-role').value;
        const notes = q('#f-notes').value.trim();
        const item = { id: uid(), name, email, role, notes, createdAt: Date.now() };
        const arr = loadData(); arr.push(item); saveData(arr);
        location.hash = '#/home';
    });
}

// Edit view with delete
function renderedit(id) {
    const arr = loadData();
    const item = arr.find(x => x.id === id);
    const root = q('#view-root');
    if (!item) {
        root.innerHTML = `<div class="muted">Data tidak ditemukan. <button class="btn" onclick="location.hash='#/home'">Kembali</button></div>`;
        return;
    }
    // Perbaikan: Pastikan value untuk textarea di escape juga (meskipun escapeAttr sudah cukup)
    root.innerHTML = `
    <header class="hdr">
    <h2>Edit Data</h2>
    <div class="muted">Mengubah: <strong>${escapeHtml(item.name)}</strong>
    </div>
    </header>
    <div class="card">
      <form id="form-edit" class="row">
        <div><label>Nama</label><input type="text" id="f-name" value="${escapeAttr(item.name)}" required />
        </div>
        <div>
        <label>Email</label>
        <input type="text" id="f-email" value="${escapeAttr(item.email)}" />
        </div>
        <div>
        <label>Role</label>
        <select id="f-role"><option ${item.role === 'Admin' ? 'selected' : ''}>Admin</option><option ${item.role === 'User' ? 'selected' : ''}>User</option>
        </select>
        </div>
        <div>
        <label>Umur (optional)</label>
        <input type="number" id="f-age" />
        </div>
        <div class="full">
        <label>Catatan</label>
        <textarea id="f-notes" rows="3">${escapeHtml(item.notes)}</textarea>
        </div>
        <div class="controls full">
          <button class="btn" type="submit">Update</button>
          <button class="btn ghost" id="cancel-edit" type="button">Batal</button>
          <button class="btn danger" id="btn-delete" type="button">Hapus</button>
        </div>
      </form>
    </div>
  `;
    q('#cancel-edit').addEventListener('click', () => location.hash = '#/home');
    q('#form-edit').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const name = q('#f-name').value.trim();
        const email = q('#f-email').value.trim();
        const role = q('#f-role').value;
        const notes = q('#f-notes').value.trim();
        const idx = arr.findIndex(x => x.id === id);
        // Pastikan tidak ada data yang hilang saat update (misal f-age)
        if (idx > -1) { 
            arr[idx] = { ...arr[idx], name, email, role, notes }; 
            saveData(arr); 
            location.hash = '#/home'; 
        }
    });
    q('#btn-delete').addEventListener('click', () => {
        if (confirm('Hapus data ini permanen?')) {
            const newArr = arr.filter(x => x.id !== id); 
            saveData(newArr); 
            location.hash = '#/home';
        }
    });
}

// Settings view setting
function rendersettings() {
    const root = q('#view-root');
    root.innerHTML = `
    <header class="hdr">
    <h2>Settings</h2>
    <div class="muted">Import / Export</div>
    </header>
    <div class="card">
      <div style="margin-bottom:12px">
      <div class="muted">Reset data</div>
      <div class="small">Hapus semua data dan kembalikan ke sample default.</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn danger" id="btn-reset">Reset Data</button>
        <button class="btn ghost" id="btn-export-csv">Export CSV</button>
        <button class="btn ghost" id="btn-export-json">Export JSON</button>
        <button class="btn" id="btn-import-csv">Import CSV</button>
        <button class="btn ghost" id="btn-import-json">Import JSON</button>
      </div>
      <div id="import-area" style="margin-top:12px;display:none">
        <textarea id="import-json" rows="6" style="width:100%;padding:8px;border-radius:8px;border:1px solid #e6e9f2"></textarea>
        <div style="margin-top:8px">
          <button class="btn" id="do-import-json">Lakukan Import JSON</button>
          <button class="btn ghost" id="cancel-import-json">Batal</button>
        </div>
      </div>
    </div>
  `;
    q('#btn-reset').addEventListener('click', () => {
        if (confirm('Yakin ingin menghapus semua data dan kembalikan ke default?')) {
            localStorage.removeItem(STORAGE_KEY); 
            seedData(); // Pastikan seedData diakses
            alert('Data telah direset.'); 
            router();
        }
    });

    q('#btn-export-json').addEventListener('click', () => {
        const data = loadData(); 
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = 'crud-data-export.json'; 
        a.click(); 
        URL.revokeObjectURL(url);
    });

    q('#btn-export-csv').addEventListener('click', () => {
        const data = loadData();
        const csv = arrayToCsv(data, ['id', 'name', 'email', 'role', 'notes', 'createdAt']);
        const blob = new Blob([csv], { type: 'text/csv' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = 'crud-data-export.csv'; 
        a.click(); 
        URL.revokeObjectURL(url);
    });

    // CSV import prosessing
    const csvInput = document.createElement('input');
    csvInput.type = 'file';
    csvInput.id = 'csvFileInput';
    csvInput.accept = '.csv';
    csvInput.style.display = 'none';
    document.body.appendChild(csvInput);
    
    q('#btn-import-csv').addEventListener('click', () => csvInput.click());
    csvInput.addEventListener('change', (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const arr = csvToArray(text);
                let parsed = [];
                if (arr.length === 0) { alert('CSV kosong'); return; }
                if (typeof arr[0] === 'object' && !Array.isArray(arr[0])) {
                    parsed = arr.map(r => {
                        return {
                            id: r.id ? String(r.id) : uid(),
                            name: r.name || r.nama || '',
                            email: r.email || '',
                            role: r.role || '',
                            notes: r.notes || r.catatan || '',
                            createdAt: r.createdAt ? Number(r.createdAt) : Date.now()
                        };
                    });
                } else {
                    parsed = arr.map(cols => {
                        // Jika kolom lebih dari atau sama dengan 6 (sesuai header eksport)
                        if (cols.length >= 6) {
                            return { id: cols[0] || uid(), name: cols[1] || '', email: cols[2] || '', role: cols[3] || '', notes: cols[4] || '', createdAt: cols[5] ? Number(cols[5]) : Date.now() };
                        } else {
                            // Jika kurang dari 6 kolom, asumsikan name, email, role, notes
                            return { id: uid(), name: cols[0] || '', email: cols[1] || '', role: cols[2] || '', notes: cols[3] || '', createdAt: Date.now() };
                        }
                    });
                }

                // Merge with existing data
                const existing = loadData();
                const merged = existing.concat(parsed);
                saveData(merged);
                alert('Import CSV sukses. Baris ditambahkan: ' + parsed.length);
                csvInput.value = ''; // Reset input file
                router();
            } catch (err) {
                alert('Gagal mengimport CSV: ' + err.message);
            }
        };
        reader.readAsText(file, 'utf8');
    });

    // JSON import
    q('#btn-import-json').addEventListener('click', () => {
        q('#import-area').style.display = 'block';
    });
    q('#cancel-import-json').addEventListener('click', () => { q('#import-area').style.display = 'none'; });
    q('#do-import-json').addEventListener('click', () => {
        const raw = q('#import-json').value.trim();
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                // Tambahkan validasi sederhana untuk memastikan isinya adalah objek data
                const validData = parsed.filter(item => item && typeof item === 'object' && item.name);
                if (validData.length > 0) {
                     saveData(validData);
                     alert('Import JSON sukses! ' + validData.length + ' item dimuat.');
                     q('#import-area').style.display = 'none';
                     router();
                } else {
                    alert('Data JSON tidak valid atau array kosong setelah filter.');
                }
            } else alert('Format JSON harus berupa array.');
        } catch (e) { alert('JSON tidak valid.'); }
    });
}

// About view
function renderabout() {
    const root = q('#view-root');
    root.innerHTML = `
    <header class="hdr"><h2>About</h2><div class="muted">Tentang aplikasi</div></header>
    <div class="card">
      <p>CRUD sederhana menggunakan <strong>HTML/CSS/JS</strong> tanpa backend. Data disimpan di localStorage.</p>
      <p class="muted">CSV import akan membaca header jika ada. Header yang dikenali:</p>
      <ul>
        <li>id</li>
        <li>name / nama</li>
        <li>email</li>
        <li>role</li>
        <li>notes / catatan</li>
        <li>createdAt / created_at</li>
      </ul>
    </div>
  `;
}

// ---------- CSV helpers ----------
function escapeCsvField(str) {
    if (str === null || str === undefined) return '';
    str = String(str);
    if (str.includes('"')) str = str.replaceAll('"', '""');
    if (str.includes(',') || str.includes('\n') || str.includes('"')) return `"${str}"`;
    return str;
}

// Converts array of objects to CSV string
function arrayToCsv(arr, keys) {
    const header = keys.join(',');
    const lines = arr.map(item => keys.map(k => escapeCsvField(item[k] ?? '')).join(','));
    return [header].concat(lines).join('\n');
}

// Parses CSV string into array of objects (if header detected) or array of arrays
function csvToArray(str) {
    const rows = [];
    let cur = '';
    let row = [];
    let inQuotes = false;
    // Menghapus Byte Order Mark (BOM) jika ada
    str = str.startsWith('\uFEFF') ? str.slice(1) : str;

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === '"') {
            if (inQuotes && str[i + 1] === '"') { cur += '"'; i++; }
            else inQuotes = !inQuotes;
            continue;
        }
        if (ch === ',' && !inQuotes) { row.push(cur.trim()); cur = ''; continue; }
        if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && str[i + 1] === '\n') { /* windows newline */ }
            if (cur !== '' || row.length > 0) { 
                row.push(cur.trim()); 
                // Hanya push row jika ada konten yang berarti
                if (row.some(c => c !== '')) {
                     rows.push(row); 
                }
                row = []; 
                cur = ''; 
            }
            if (ch === '\r' && str[i + 1] === '\n') i++;
            continue;
        }
        cur += ch;
    }
    // Tambahkan baris terakhir
    if (cur !== '' || row.length > 0) { 
        row.push(cur.trim()); 
        if (row.some(c => c !== '')) { 
            rows.push(row); 
        }
    }

    if (rows.length === 0) return [];
    
    // Logika deteksi header
    const firstRowValues = rows[0].map(c => c.toLowerCase());
    const commonHeaders = ['id', 'name', 'nama', 'email', 'role', 'notes', 'catatan', 'createdat', 'created_at'];
    // Deteksi header jika ada minimal 3 kolom umum yang cocok
    const headerMatchCount = firstRowValues.filter(h => commonHeaders.includes(h)).length;
    const headerDetected = headerMatchCount >= 3;
    
    if (headerDetected) {
        const headers = rows[0].map(h => h.trim());
        const objs = [];
        for (let r = 1; r < rows.length; r++) {
            const cols = rows[r];
            if (cols.length === 1 && cols[0] === '') continue;
            const obj = {};
            for (let c = 0; c < headers.length; c++) {
                obj[headers[c]] = (cols[c] !== undefined) ? cols[c] : '';
            }
            objs.push(obj);
        }
        return objs;
    } else {
        return rows;
    }
}

// ---------- helpers ----------
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
function escapeAttr(str) { return str ? String(str).replaceAll('"', '&quot;') : ''; }

// ---------- Init ----------
window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
    // Tidak perlu memanggil seedData() jika loadData() sudah memanggilnya (diperbaiki di atas).
    // Tapi untuk jaga-jaga, biarkan saja:
    if (!localStorage.getItem(STORAGE_KEY)) seedData();
    router();
});