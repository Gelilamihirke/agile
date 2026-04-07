// 100% CLIENT-SIDE STORAGE (localStorage)
const STORAGE_KEY = 'taskflow_tasks';
let currentView = 'dashboard';

// Load tasks from localStorage
function getTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch(e) { return []; }
}

function saveTasksToLocal(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Helper: generate unique ID
function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}

// Initialize demo tasks if empty
function initDemoTasks() {
    let tasks = getTasks();
    if (tasks.length === 0) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 2);
        tasks = [
            { id: generateId(), title: "Update project documentation", description: "Write user guides and API references", priority: "high", status: "in_progress", due_date: tomorrow.toISOString().slice(0,16), createdAt: new Date().toISOString() },
            { id: generateId(), title: "Fix UI responsiveness", description: "Mobile sidebar adjustments", priority: "medium", status: "pending", due_date: new Date(now.getTime() + 86400000).toISOString().slice(0,16), createdAt: new Date().toISOString() },
            { id: generateId(), title: "Team sync meeting", description: "Weekly sprint review", priority: "low", status: "completed", due_date: new Date(now.getTime() - 86400000).toISOString().slice(0,16), createdAt: new Date().toISOString() },
        ];
        saveTasksToLocal(tasks);
    }
}

// Stats calculation
function getStats() {
    const tasks = getTasks();
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const in_progress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return { total, pending, in_progress, completed };
}

// Update dashboard numbers
function updateDashboardStats() {
    const stats = getStats();
    document.getElementById('totalTasks').innerText = stats.total;
    document.getElementById('pendingTasks').innerText = stats.pending;
    document.getElementById('inProgressTasks').innerText = stats.in_progress;
    document.getElementById('completedTasks').innerText = stats.completed;
}

// Display tasks in given container
function renderTaskList(tasks, containerId, showActions = true, limit = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let tasksToRender = tasks;
    if (limit && limit > 0) tasksToRender = tasks.slice(0, limit);
    
    if (!tasksToRender.length) {
        container.innerHTML = '<div class="task-card" style="justify-content:center;">✨ No tasks found. Create a new one!</div>';
        return;
    }

    container.innerHTML = tasksToRender.map(task => `
        <div class="task-card" data-id="${task.id}">
            <div class="task-info">
                <h3>${escapeHtml(task.title)}</h3>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <span class="priority ${task.priority}">${task.priority}</span>
                    <span class="status">${task.status.replace('_', ' ')}</span>
                    ${task.due_date ? `<span><i class="far fa-calendar-alt"></i> ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
            ${showActions ? `
            <div class="task-actions">
                <button class="edit-btn" onclick="editTaskById('${task.id}')"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteTaskById('${task.id}')"><i class="fas fa-trash"></i></button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

// Load dashboard (stats + recent 5)
function loadDashboard() {
    updateDashboardStats();
    const allTasks = getTasks();
    const sorted = [...allTasks].sort((a,b) => (b.createdAt || b.id) - (a.createdAt || a.id));
    renderTaskList(sorted, 'recentTasksList', false, 5);
}

// Load tasks view with filters
function loadTasksView() {
    let tasks = getTasks();
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusVal = document.getElementById('statusFilter')?.value || '';
    const priorityVal = document.getElementById('priorityFilter')?.value || '';
    
    let filtered = tasks.filter(task => {
        if (statusVal && task.status !== statusVal) return false;
        if (priorityVal && task.priority !== priorityVal) return false;
        if (searchTerm && !task.title.toLowerCase().includes(searchTerm) && !(task.description && task.description.toLowerCase().includes(searchTerm))) return false;
        return true;
    });
    filtered.sort((a,b) => (b.createdAt || b.id).localeCompare(a.createdAt || a.id));
    renderTaskList(filtered, 'allTasksList', true);
}

// Save or create task
function handleSaveTask(e) {
    e.preventDefault();
    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) return alert('Task title is required');
    
    const newTask = {
        title: title,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        due_date: document.getElementById('taskDueDate').value || null,
        updatedAt: new Date().toISOString()
    };
    
    let tasks = getTasks();
    if (taskId) {
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...newTask, id: taskId };
            saveTasksToLocal(tasks);
        }
    } else {
        const freshTask = { ...newTask, id: generateId(), createdAt: new Date().toISOString() };
        tasks.push(freshTask);
        saveTasksToLocal(tasks);
    }
    
    closeModal();
    refreshCurrentView();
}

window.editTaskById = function(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskDueDate').value = task.due_date ? task.due_date.slice(0, 16) : '';
    document.getElementById('modalTitle').innerText = 'Edit Task';
    document.getElementById('taskModal').style.display = 'flex';
};

window.deleteTaskById = function(id) {
    if (!confirm('Permanently delete this task?')) return;
    let tasks = getTasks();
    tasks = tasks.filter(t => t.id !== id);
    saveTasksToLocal(tasks);
    refreshCurrentView();
};

function openNewTaskModal() {
    document.getElementById('taskId').value = '';
    document.getElementById('taskForm').reset();
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskStatus').value = 'pending';
    document.getElementById('modalTitle').innerText = 'Create New Task';
    document.getElementById('taskModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
}

function refreshCurrentView() {
    if (currentView === 'dashboard') {
        loadDashboard();
    } else if (currentView === 'tasks') {
        loadTasksView();
    }
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.id === `${view}-view`);
    });
    const titles = { dashboard: 'Dashboard', tasks: 'All Tasks' };
    document.getElementById('page-title').innerText = titles[view] || 'TaskFlow';
    
    if (view === 'dashboard') loadDashboard();
    else if (view === 'tasks') loadTasksView();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Event listeners setup
function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    document.getElementById('createTaskBtn').addEventListener('click', openNewTaskModal);
    document.getElementById('taskForm').addEventListener('submit', handleSaveTask);
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === document.getElementById('taskModal')) closeModal(); });
    
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    if (searchInput) searchInput.addEventListener('input', () => { if(currentView === 'tasks') loadTasksView(); });
    if (statusFilter) statusFilter.addEventListener('change', () => { if(currentView === 'tasks') loadTasksView(); });
    if (priorityFilter) priorityFilter.addEventListener('change', () => { if(currentView === 'tasks') loadTasksView(); });
}

// Initial app start
function init() {
    initDemoTasks();
    setupEventListeners();
    loadDashboard();
    currentView = 'dashboard';
}

init();