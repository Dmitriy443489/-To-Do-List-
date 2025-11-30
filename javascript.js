document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const tasksContainer = document.getElementById('tasksContainer');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchInput');
    const statsElement = document.getElementById('stats');
    
    // Состояние приложения
    let tasks = JSON.parse(localStorage.getItem('github-todo-tasks')) || [];
    let currentFilter = 'all';
    let searchQuery = '';
    
    // Инициализация приложения
    renderTasks();
    updateStats();
    
    // Обработчики событий
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            renderTasks();
        });
    });
    
    searchInput.addEventListener('input', function() {
        searchQuery = this.value.toLowerCase();
        renderTasks();
    });
    
    // Функции
    function addTask() {
        const text = taskInput.value.trim();
        if (text === '') return;
        
        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateStats();
        
        taskInput.value = '';
        taskInput.focus();
    }
    
    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    function editTask(id, newText) {
        if (newText.trim() === '') {
            deleteTask(id);
            return;
        }
        
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, text: newText.trim() };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
    }
    
    function saveTasks() {
        localStorage.setItem('github-todo-tasks', JSON.stringify(tasks));
    }
    
    function renderTasks() {
        let filteredTasks = tasks;
        
        // Применяем фильтр
        if (currentFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }
        
        // Применяем поиск
        if (searchQuery) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(searchQuery)
            );
        }
        
        // Очищаем контейнер
        tasksContainer.innerHTML = '';
        
        // Если задач нет, показываем состояние "пусто"
        if (filteredTasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            
            let message = '';
            if (searchQuery) {
                message = 'Задачи по вашему запросу не найдены';
            } else if (currentFilter === 'active') {
                message = 'Нет активных задач';
            } else if (currentFilter === 'completed') {
                message = 'Нет завершенных задач';
            } else {
                message = 'У вас пока нет задач. Добавьте первую задачу!';
            }
            
            emptyState.innerHTML = `
                <div class="empty-state-icon">📝</div>
                <p>${message}</p>
            `;
            
            tasksContainer.appendChild(emptyState);
            return;
        }
        
        // Рендерим задачи
        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            
            taskElement.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
                <div class="task-actions">
                    <button class="task-btn edit-btn">✏️</button>
                    <button class="task-btn delete-btn">🗑️</button>
                </div>
            `;
            
            // Обработчики событий для элементов задачи
            const checkbox = taskElement.querySelector('.task-checkbox');
            const editBtn = taskElement.querySelector('.edit-btn');
            const deleteBtn = taskElement.querySelector('.delete-btn');
            const taskText = taskElement.querySelector('.task-text');
            
            checkbox.addEventListener('change', () => toggleTask(task.id));
            
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            
            editBtn.addEventListener('click', () => {
                const currentText = taskText.textContent;
                taskText.innerHTML = `
                    <input type="text" class="edit-input" value="${escapeHtml(currentText)}" style="width: 100%; background: var(--github-dark); color: var(--github-text); border: 1px solid var(--github-accent); border-radius: 4px; padding: 4px 8px;">
                `;
                
                const editInput = taskText.querySelector('.edit-input');
                editInput.focus();
                editInput.select();
                
                const saveEdit = () => {
                    editTask(task.id, editInput.value);
                };
                
                editInput.addEventListener('blur', saveEdit);
                editInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        saveEdit();
                    }
                });
            });
            
            tasksContainer.appendChild(taskElement);
        });
    }
    
    function updateStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const activeTasks = totalTasks - completedTasks;
        
        statsElement.textContent = `Всего задач: ${totalTasks} | Активные: ${activeTasks} | Завершенные: ${completedTasks}`;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});