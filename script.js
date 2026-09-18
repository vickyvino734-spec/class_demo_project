// State Management
let projects = JSON.parse(localStorage.getItem('projects')) || [
    { id: 'p-all', name: 'All Tasks', desc: 'Manage all tasks across your workspace' },
    { id: 'p-1', name: 'Website Redesign', desc: 'Overhaul company website UI/UX' },
    { id: 'p-2', name: 'Mobile App', desc: 'iOS & Android app development' }
];

let tasks = JSON.parse(localStorage.getItem('tasks')) || [
    { id: 't-1', projectId: 'p-1', title: 'Design Mockups', desc: 'Create Figma designs for homepage', priority: 'High', status: 'completed', due: '2026-10-01' },
    { id: 't-2', projectId: 'p-1', title: 'Frontend Setup--> Changed by Vinodhini', desc: 'Setup React repository and structure', priority: 'Medium', status: 'in-progress', due: '2026-10-05' },
    { id: 't-3', projectId: 'p-2', title: 'API Integration-- Changed by Sulthan', desc: 'Connect auth endpoints', priority: 'High', status: 'todo', due: '2026-09-15' },
    { id: 't-4', projectId: 'p-2', title: 'App Store Submission', desc: 'Prepare screenshots and metadata', priority: 'Low', status: 'todo', due: '' }
];

let currentProjectId = 'p-all';
let draggedTaskId = null;

// DOM Elements
const projectListEl = document.getElementById('project-list');
const currentTitleEl = document.getElementById('current-project-title');
const currentDescEl = document.getElementById('current-project-desc');
const taskProjectSelect = document.getElementById('task-project');

const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const searchInput = document.getElementById('search-input');

const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderProjects();
    renderTasks();
    setupEventListeners();
    setupDragDropLists();
});

function saveData() {
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Dark Mode Switcher
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.onclick = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    };
}

function updateThemeIcon(theme) {
    themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// Render Projects in Sidebar
function renderProjects() {
    projectListEl.innerHTML = '';
    taskProjectSelect.innerHTML = '';

    projects.forEach(p => {
        const li = document.createElement('li');
        li.className = p.id === currentProjectId ? 'active' : '';
        li.dataset.id = p.id;

        const projectActionsHtml = p.id !== 'p-all' 
            ? `<div class="project-actions">
                 <i class="fa-solid fa-pen project-action-btn" title="Rename Project" onclick="event.stopPropagation(); renameProjectInline('${p.id}')"></i>
                 <i class="fa-solid fa-trash project-action-btn delete-btn" title="Delete Project" onclick="event.stopPropagation(); deleteProject('${p.id}')"></i>
               </div>` 
            : '';

        li.innerHTML = `
            <span class="project-name-wrapper">
                <i class="fa-regular fa-folder"></i> 
                <span class="project-title-text">${p.name}</span>
            </span>
            ${projectActionsHtml}
        `;
        
        li.onclick = () => selectProject(p.id);
        projectListEl.appendChild(li);

        if (p.id !== 'p-all') {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name;
            taskProjectSelect.appendChild(option);
        }
    });
}

// Switch Active Project View
function selectProject(projectId) {
    currentProjectId = projectId;
    const project = projects.find(p => p.id === projectId);
    currentTitleEl.textContent = project.name;
    currentDescEl.textContent = project.desc;
    renderProjects();
    renderTasks();
}

// Add New Project
document.getElementById('add-project-btn').addEventListener('click', () => {
    const name = prompt('Enter project name:');
    if (name && name.trim()) {
        const newProj = {
            id: 'p-' + Date.now(),
            name: name.trim(),
            desc: 'Custom project workspace'
        };
        projects.push(newProj);
        saveData();
        selectProject(newProj.id);
    }
});

// Inline Project Renaming
window.renameProjectInline = function(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const li = document.querySelector(`.project-list li[data-id="${projectId}"]`);
    if (!li) return;

    const wrapper = li.querySelector('.project-name-wrapper');
    const actions = li.querySelector('.project-actions');
    
    if (actions) actions.style.display = 'none';

    wrapper.innerHTML = `
        <i class="fa-regular fa-folder"></i>
        <input type="text" class="inline-project-input" value="${project.name}">
    `;

    const input = wrapper.querySelector('input');
    input.focus();
    input.select();

    let isSaved = false;
    const saveRename = () => {
        if (isSaved) return;
        isSaved = true;

        const newName = input.value.trim();
        if (newName && newName !== project.name) {
            project.name = newName;
            saveData();
            if (currentProjectId === projectId) {
                currentTitleEl.textContent = project.name;
            }
        }
        renderProjects();
    };

    input.onclick = (e) => e.stopPropagation();

    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            saveRename();
        } else if (e.key === 'Escape') {
            isSaved = true;
            renderProjects();
        }
    };

    input.onblur = saveRename;
};

// Delete Project and Associated Tasks
window.deleteProject = function(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (confirm(`Are you sure you want to delete "${project.name}"? All associated tasks will also be deleted.`)) {
        projects = projects.filter(p => p.id !== projectId);
        tasks = tasks.filter(t => t.projectId !== projectId);
        
        saveData();

        if (currentProjectId === projectId) {
            selectProject('p-all');
        } else {
            renderProjects();
            renderTasks();
        }
    }
};

// Render Tasks (Sorted strictly by Nearest Due Date with Priority Fallback & Overdue Highlighting)
// Render Tasks (Sorted strictly by Nearest Due Date with Priority Fallback & Overdue Highlighting)
function renderTasks() {
    const filterText = searchInput.value.toLowerCase();
    
    // Clear list columns
    ['todo', 'in-progress', 'completed'].forEach(status => {
        document.getElementById(`list-${status}`).innerHTML = '';
    });

    // 1. Filter tasks
    let filteredTasks = tasks.filter(t => {
        const matchesProject = currentProjectId === 'p-all' || t.projectId === currentProjectId;
        const matchesSearch = t.title.toLowerCase().includes(filterText) || t.desc.toLowerCase().includes(filterText);
        return matchesProject && matchesSearch;
    });

    // 2. Priority Rank Mapping for fallback sorting (High = 1, Medium = 2, Low = 3)
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };

    // 3. Sort tasks by nearest due date
    filteredTasks.sort((a, b) => {
        // Tasks without a due date are placed at the bottom
        if (!a.due && !b.due) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (!a.due) return 1;
        if (!b.due) return -1;
        
        // Compare dates (earliest date first)
        const dateDiff = new Date(a.due) - new Date(b.due);
        if (dateDiff !== 0) return dateDiff;

        // Fallback: If due dates are identical, sort by priority
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Statistics Counter
    let counts = { todo: 0, 'in-progress': 0, completed: 0 };

    filteredTasks.forEach(task => {
        counts[task.status]++;
        const taskCard = createTaskElement(task);
        document.getElementById(`list-${task.status}`).appendChild(taskCard);
    });

    // Update Stats Display
    document.getElementById('stat-total').textContent = filteredTasks.length;
    document.getElementById('stat-todo').textContent = counts.todo;
    document.getElementById('stat-progress').textContent = counts['in-progress'];
    document.getElementById('stat-done').textContent = counts.completed;

    document.getElementById('count-todo').textContent = counts.todo;
    document.getElementById('count-in-progress').textContent = counts['in-progress'];
    document.getElementById('count-completed').textContent = counts.completed;
}

// Create Task Element with Overdue Date Highlighting
function createTaskElement(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.id = task.id;

    // Overdue Logic
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.due && task.due < today && task.status !== 'completed';
    const dueStyle = isOverdue ? 'style="color: #ef4444; font-weight: bold;"' : '';
    const overdueBadge = isOverdue ? ' <span style="font-size: 0.7rem; background: #ef4444; color: #fff; padding: 2px 5px; border-radius: 3px; font-weight: 600;">Overdue</span>' : '';

    card.innerHTML = `
        <div class="task-header">
            <span class="task-title">${task.title}</span>
            <span class="priority-badge ${task.priority}">${task.priority}</span>
        </div>
        <div class="task-desc">${task.desc || 'No description provided.'}</div>
        <div class="task-footer">
            <span><i class="fa-regular fa-calendar"></i> <span ${dueStyle}>${task.due || 'No due date'}</span>${overdueBadge}</span>
            <div class="task-actions">
                <i class="fa-solid fa-pen" onclick="editTask('${task.id}')"></i>
                <i class="fa-solid fa-trash" onclick="deleteTask('${task.id}')"></i>
            </div>
        </div>
    `;

    card.addEventListener('dragstart', () => {
        draggedTaskId = task.id;
        card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });

    return card;
}

// Drag and Drop Listeners
function setupDragDropLists() {
    document.querySelectorAll('.task-list').forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            list.classList.add('drag-over');
        });

        list.addEventListener('dragleave', () => {
            list.classList.remove('drag-over');
        });

        list.addEventListener('drop', () => {
            list.classList.remove('drag-over');
        });
    });
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drop(ev, newStatus) {
    ev.preventDefault();
    const task = tasks.find(t => t.id === draggedTaskId);
    if (task) {
        task.status = newStatus;
        saveData();
        renderTasks();
    }
}

// Modal & Form Setup
function setupEventListeners() {
    document.getElementById('open-task-modal-btn').onclick = () => openModal();
    document.getElementById('close-modal-btn').onclick = closeModal;
    document.getElementById('cancel-btn').onclick = closeModal;
    searchInput.oninput = renderTasks;

    taskForm.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('task-id').value;
        const title = document.getElementById('task-title').value;
        const desc = document.getElementById('task-desc').value;
        const projectId = taskProjectSelect.value;
        const priority = document.getElementById('task-priority').value;
        const status = document.getElementById('task-status').value;
        const due = document.getElementById('task-due').value;

        if (id) {
            const index = tasks.findIndex(t => t.id === id);
            tasks[index] = { id, title, desc, projectId, priority, status, due };
        } else {
            tasks.push({
                id: 't-' + Date.now(),
                title, desc, projectId, priority, status, due
            });
        }

        saveData();
        renderTasks();
        closeModal();
    };
}

function openModal(task = null) {
    taskForm.reset();
    if (task) {
        document.getElementById('modal-title').textContent = 'Edit Task';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.desc;
        taskProjectSelect.value = task.projectId;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-due').value = task.due;
    } else {
        document.getElementById('modal-title').textContent = 'Create New Task';
        document.getElementById('task-id').value = '';
        if (currentProjectId !== 'p-all') taskProjectSelect.value = currentProjectId;
    }
    taskModal.classList.add('active');
}

function closeModal() {
    taskModal.classList.remove('active');
}

// Global Task Operations
window.editTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task) openModal(task);
};

window.deleteTask = function(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveData();
        renderTasks();
    }
};