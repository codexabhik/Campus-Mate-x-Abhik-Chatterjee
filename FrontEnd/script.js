const API_URL = 'http://localhost:5000/api';

let currentUser = null;
let tasks = [];
let assignments = [];
let notes = [];

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    disableRightClick();
    displayCurrentDate();
    initWeather();
    await checkAuth();
});

function disableRightClick() {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
}

function displayCurrentDate() {
    const dateEl = document.getElementById('currentDateDisplay');
    if (dateEl) {
        dateEl.innerText = 'Fri, Aug 14, 2026';
    }
}

async function checkAuth() {
    try {
        const res = await fetch(`${API_URL}/auth`);
        const data = await res.json();
        
        currentUser = data.user;
        const loginScreen = document.getElementById('loginScreen');

        if (!currentUser) {
            loginScreen.style.display = 'flex';
        } else {
            loginScreen.style.display = 'none';
            document.getElementById('displayUserName').innerText = currentUser.name;
            document.getElementById('displayUserRole').innerText = currentUser.role || 'CSE-7th';
            document.getElementById('sidebarUserName').innerText = currentUser.name;
            await loadAllData();
        }
    } catch (err) {
        console.error("Backend offline. Please start server:", err);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const name = document.getElementById('userNameInput').value.trim();
    const role = document.getElementById('userRoleInput').value.trim();

    if (!name) return;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, role: role || 'CSE-7th' })
        });
        const data = await res.json();
        currentUser = data.user;
        await checkAuth();
    } catch (err) {
        alert("Failed to connect to backend server.");
    }
}

async function logout() {
    if (confirm('Logging out will clear all your stored tasks, assignments, and notes from server memory. Continue?')) {
        try {
            await fetch(`${API_URL}/logout`, { method: 'POST' });
            currentUser = null;
            tasks = [];
            assignments = [];
            notes = [];
            await checkAuth();
        } catch (err) {
            console.error("Logout error:", err);
        }
    }
}

async function loadAllData() {
    try {
        const [tasksRes, assignsRes, notesRes] = await Promise.all([
            fetch(`${API_URL}/tasks`),
            fetch(`${API_URL}/assignments`),
            fetch(`${API_URL}/notes`)
        ]);

        tasks = await tasksRes.json();
        assignments = await assignsRes.json();
        notes = await notesRes.json();

        renderAll();
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

function renderAll() {
    renderTasks();
    renderAssignments();
    renderNotes();
    updateStats();
    renderDashboardOverviews();
}

function switchView(viewName, element) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active-view'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active-view');
    if (element) element.classList.add('active');

    renderAll();
}

async function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    if (!text) return;

    const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    
    if (res.ok) {
        input.value = '';
        await loadAllData();
    }
}

async function toggleTask(id) {
    await fetch(`${API_URL}/tasks/${id}/toggle`, { method: 'PUT' });
    await loadAllData();
}

async function deleteTask(id) {
    await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
    await loadAllData();
}

function openEditTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    openEditModal('Edit Task', `
        <div class="input-row-stacked">
            <label>Task Description</label>
            <input type="text" id="modalEditInput" value="${escapeHtml(task.text)}">
        </div>
    `, async () => {
        const updated = document.getElementById('modalEditInput').value.trim();
        if (updated) {
            await fetch(`${API_URL}/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: updated })
            });
            await loadAllData();
            closeEditModal();
        }
    });
}

function renderTasks() {
    const list = document.getElementById('taskList');
    if (!list) return;
    list.innerHTML = '';

    if (tasks.length === 0) {
        list.innerHTML = `<li class="text-muted" style="justify-content:center;">No tasks created yet.</li>`;
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
                <span style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(task.text)}</span>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-sm" onclick="openEditTask(${task.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(li);
    });
}

async function addAssignment() {
    const titleInput = document.getElementById('assignTitle');
    const dateInput = document.getElementById('assignDate');
    const title = titleInput.value.trim();
    const date = dateInput.value;

    if (!title || !date) return alert('Please provide an assignment title and due date.');

    const res = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date })
    });

    if (res.ok) {
        titleInput.value = '';
        dateInput.value = '';
        await loadAllData();
    }
}

async function toggleAssignment(id) {
    await fetch(`${API_URL}/assignments/${id}/toggle`, { method: 'PUT' });
    await loadAllData();
}

async function deleteAssignment(id) {
    await fetch(`${API_URL}/assignments/${id}`, { method: 'DELETE' });
    await loadAllData();
}

function openEditAssignment(id) {
    const item = assignments.find(a => a.id === id);
    if (!item) return;

    openEditModal('Edit Assignment', `
        <div class="input-row-stacked">
            <label>Title</label>
            <input type="text" id="modalAssignTitle" value="${escapeHtml(item.title)}">
            <label style="margin-top: 8px;">Due Date</label>
            <input type="date" id="modalAssignDate" value="${item.date}">
        </div>
    `, async () => {
        const title = document.getElementById('modalAssignTitle').value.trim();
        const date = document.getElementById('modalAssignDate').value;
        if (title && date) {
            await fetch(`${API_URL}/assignments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, date })
            });
            await loadAllData();
            closeEditModal();
        }
    });
}

function renderAssignments() {
    const tbody = document.getElementById('assignmentList');
    if (!tbody) return;
    tbody.innerHTML = '';

    const today = '2026-08-14';

    if (assignments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No assignments added yet.</td></tr>`;
        return;
    }

    assignments.forEach(item => {
        const isOverdue = item.date < today && !item.completed;
        let badgeHtml = item.completed 
            ? '<span class="badge badge-success">Completed</span>' 
            : (isOverdue ? '<span class="badge badge-danger">Overdue</span>' : '<span class="badge badge-warning">Upcoming</span>');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(item.title)}</td>
            <td>${item.date}</td>
            <td>${badgeHtml}</td>
            <td>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="toggleAssignment(${item.id})">
                        <i class="fas ${item.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="openEditAssignment(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAssignment(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function addNote() {
    const titleInput = document.getElementById('noteTitle');
    const bodyInput = document.getElementById('noteBody');
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title || !body) return alert('Please enter both note title and content.');

    const res = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body })
    });

    if (res.ok) {
        titleInput.value = '';
        bodyInput.value = '';
        await loadAllData();
    }
}

async function deleteNote(id) {
    await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE' });
    await loadAllData();
}

function openEditNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    openEditModal('Edit Study Note', `
        <div class="input-row-stacked">
            <label>Title</label>
            <input type="text" id="modalNoteTitle" value="${escapeHtml(note.title)}">
            <label style="margin-top: 8px;">Content</label>
            <textarea id="modalNoteBody" rows="4">${escapeHtml(note.body)}</textarea>
        </div>
    `, async () => {
        const title = document.getElementById('modalNoteTitle').value.trim();
        const body = document.getElementById('modalNoteBody').value.trim();
        if (title && body) {
            await fetch(`${API_URL}/notes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body })
            });
            await loadAllData();
            closeEditModal();
        }
    });
}

function renderNotes() {
    const grid = document.getElementById('notesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (notes.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-muted); grid-column: span 2;">No study notes created yet.</p>`;
        return;
    }

    notes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'note-box';
        div.innerHTML = `
            <div>
                <h5>${escapeHtml(note.title)}</h5>
                <p>${escapeHtml(note.body)}</p>
            </div>
            <div class="note-footer">
                <button class="btn btn-secondary btn-sm" onclick="openEditNote(${note.id})"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteNote(${note.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        grid.appendChild(div);
    });
}

function updateStats() {
    const taskStat = document.getElementById('statTotalTasks');
    const assignStat = document.getElementById('statPendingAssignments');
    const compStat = document.getElementById('statCompletion');

    if (taskStat) taskStat.innerText = tasks.length;
    
    const pendingAssigns = assignments.filter(a => !a.completed).length;
    if (assignStat) assignStat.innerText = pendingAssigns;

    const totalItems = tasks.length + assignments.length;
    const completedItems = tasks.filter(t => t.completed).length + assignments.filter(a => a.completed).length;
    
    const rate = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
    if (compStat) compStat.innerText = `${rate}%`;
}

function renderDashboardOverviews() {
    const upcomingDiv = document.getElementById('dashboardUpcomingList');
    if (upcomingDiv) {
        const pending = assignments.filter(a => !a.completed).slice(0, 4);
        if (pending.length === 0) {
            upcomingDiv.innerHTML = `<p>No pending assignments! You are all caught up.</p>`;
        } else {
            upcomingDiv.innerHTML = pending.map(a => `<p>📅 <strong>${escapeHtml(a.title)}</strong> — Due: ${a.date}</p>`).join('');
        }
    }

    const tasksDiv = document.getElementById('dashboardQuickTasks');
    if (tasksDiv) {
        const activeTasks = tasks.filter(t => !t.completed).slice(0, 4);
        if (activeTasks.length === 0) {
            tasksDiv.innerHTML = `<p>No active tasks. Enjoy your free time!</p>`;
        } else {
            tasksDiv.innerHTML = activeTasks.map(t => `<p>📌 ${escapeHtml(t.text)}</p>`).join('');
        }
    }
}

function initWeather() {
    const savedLoc = localStorage.getItem('cm_saved_location');
    if (savedLoc) {
        const selectElem = document.getElementById('campusLocation');
        if (selectElem) selectElem.value = savedLoc;
        const [lat, lon, cityName] = savedLoc.split(',');
        fetchWeather(lat, lon, cityName);
    } else {
        fetchWeather();
    }
}

function changeCampus(selectedVal) {
    const [lat, lon, cityName] = selectedVal.split(',');
    localStorage.setItem('cm_saved_location', selectedVal);
    fetchWeather(lat, lon, cityName);
}

async function fetchWeather(lat = 22.57, lon = 88.36, cityName = 'Kolkata') {
    const el = document.getElementById('weatherWidget');
    if (!el) return;
    el.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;

    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const temp = data.current_weather.temperature;
        el.innerHTML = `<i class="fas fa-cloud-sun text-warning"></i> ${cityName}: ${temp}°C`;
    } catch (err) {
        el.innerHTML = `<i class="fas fa-exclamation-triangle text-danger"></i> ${cityName} Offline`;
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('cm_theme', isDark ? 'dark' : 'light');
    
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

function initTheme() {
    if (localStorage.getItem('cm_theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('#themeToggle i');
        if (icon) icon.className = 'fas fa-sun';
    }
}

let currentModalAction = null;

function openEditModal(title, bodyHtml, onSave) {
    document.getElementById('editModalTitle').innerText = title;
    document.getElementById('editModalBody').innerHTML = bodyHtml;
    document.getElementById('editModal').style.display = 'flex';
    currentModalAction = onSave;
    document.getElementById('saveEditBtn').onclick = currentModalAction;
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}