const API_URL = '/api/tasks';
let currentView = 'dashboard';
let tasksChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    setupEventListeners();
});

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Create task button
    document.getElementById('createTaskBtn').addEventListener('click', () => openTaskModal());
    
    // Task form submission
    document.getElementById('taskForm').addEventListener('submit', saveTask);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    
    // Filters
    document.getElementById('searchInput').addEventListener('input', loadTasks);
    document.getElementById('statusFilter').addEventListener('change', loadTasks);
    document.getElementById('priorityFilter').addEventListener('change', loadTasks);
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('taskModal')) closeModal();
    });
}

async function switchView(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update view visibility
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.id === `${view}-view`);
    });
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        tasks: 'All Tasks',
        analytics: 'Analytics'
    };
    document.getElementById('page-title').textContent = titles[view];
    
    // Load data based on view
    if (view === 'dashboard') await loadDashboard();
    else if (view === 'tasks') await loadTasks();
    else if (view === 'analytics') await loadAnalytics();
}

async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('totalTasks').textContent = result.data.total || 0;
            document.getElementById('pendingTasks').textContent = result.data.pending || 0;
            document.getElementById('inProgressTasks').textContent = result.data.in_progress || 0;
            document.getElementById('completedTasks').textContent = result.data.completed || 0;
        }
        
        // Load recent tasks
        const tasksResponse = await fetch(`${API_URL}?status=&priority=&search=`);
        const tasksResult = await tasksResponse.json();
        
        if (tasksResult.success) {
            const recentTasks = tasksResult.data.slice(0, 5);
            displayTasks(recentTasks, 'recentTasksList', true);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadTasks() {
    const search = document.getElementById('searchInput').value;
    const status = document.getElementById('statusFilter').value;
    const priority = document.getElementById('priorityFilter').value;
    
    try {
        const response = await fetch(`${API_URL}?search=${search}&status=${status}&priority=${priority}`);
        const result = await response.json();
        
        if (result.success) {
            displayTasks(result.data, 'allTasksList', false);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function displayTasks(tasks, containerId, showActions = true) {
    const container = document.getElementById(containerId);
    
    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<div class="task-card">No tasks found</div>';
        return;
    }
    
    container.innerHTML = tasks.map(task => `
        <div class="task-card">
            <div class="task-info">
                <h3>${escapeHtml(task.title)}</h3>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <span class="priority ${task.priority}">${task.priority}</span>
                    <span class="status">${task.status.replace('_', ' ')}</span>
                    ${task.due_date ? `<span>Due: ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
            ${showActions ? `
                <div class="task-actions">
                    <button class="edit-btn" onclick="editTask('${task.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteTask('${task.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function saveTask(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('taskId').value;
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        due_date: document.getElementById('taskDueDate').value
    };
    
    try {
        const url = taskId ? `${API_URL}/${taskId}` : API_URL;
        const method = taskId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeModal();
            if (currentView === 'dashboard') await loadDashboard();
            else if (currentView === 'tasks') await loadTasks();
            else if (currentView === 'analytics') await loadAnalytics();
        } else {
            alert('Error saving task');
        }
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Error saving task');
    }
}

async function editTask(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const result = await response.json();
        
        if (result.success) {
            const task = result.data;
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskDueDate').value = task.due_date ? task.due_date.slice(0, 16) : '';
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading task:', error);
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (result.success) {
            if (currentView === 'dashboard') await loadDashboard();
            else if (currentView === 'tasks') await loadTasks();
            else if (currentView === 'analytics') await loadAnalytics();
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

function openTaskModal(task = null) {
    document.getElementById('taskId').value = '';
    document.getElementById('taskForm').reset();
    document.getElementById('modalTitle').textContent = 'Create New Task';
    document.getElementById('taskModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
}

async function loadAnalytics() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data;
            
            // Create chart
            const ctx = document.getElementById('tasksChart').getContext('2d');
            if (tasksChart) tasksChart.destroy();
            
            tasksChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Pending', 'In Progress', 'Completed'],
                    datasets: [{
                        label: 'Task Status Distribution',
                        data: [stats.pending || 0, stats.in_progress || 0, stats.completed || 0],
                        backgroundColor: ['#f59e0b', '#10b981', '#6366f1']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Task Analytics' }
                    }
                }
            });
            
            // Display metrics
            const metricsHtml = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Total Tasks</h3>
                            <p class="stat-number">${stats.total || 0}</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Completion Rate</h3>
                            <p class="stat-number">${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Avg Completion Time</h3>
                            <p class="stat-number">${stats.avg_completion_time ? stats.avg_completion_time.toFixed(1) : 0} days</p>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('metrics').innerHTML = metricsHtml;
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}