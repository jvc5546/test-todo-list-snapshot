const API_URL = '/api/todos';

const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const totalCountEl = document.getElementById('totalCount');
const completedCountEl = document.getElementById('completedCount');

let todos = [];

async function fetchTodos() {
    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error('Failed to fetch todos');
        }

        todos = await response.json();
        renderTodos();
        updateStats();
    } catch (error) {
        showError('Failed to load todos: ' + error.message);
    } finally {
        loadingEl.style.display = 'none';
    }
}

async function addTodo() {
    const text = todoInput.value.trim();

    if (!text) {
        return;
    }

    try {
        errorEl.style.display = 'none';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error('Failed to add todo');
        }

        const newTodo = await response.json();
        todos.unshift(newTodo);
        todoInput.value = '';
        renderTodos();
        updateStats();
    } catch (error) {
        showError('Failed to add todo: ' + error.message);
    }
}

async function toggleTodo(id, completed) {
    try {
        errorEl.style.display = 'none';

        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed }),
        });

        if (!response.ok) {
            throw new Error('Failed to update todo');
        }

        const updatedTodo = await response.json();
        const index = todos.findIndex(t => t._id === id);

        if (index !== -1) {
            todos[index] = updatedTodo;
            renderTodos();
            updateStats();
        }
    } catch (error) {
        showError('Failed to update todo: ' + error.message);
        fetchTodos();
    }
}

async function deleteTodo(id) {
    try {
        errorEl.style.display = 'none';

        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete todo');
        }

        todos = todos.filter(t => t._id !== id);
        renderTodos();
        updateStats();
    } catch (error) {
        showError('Failed to delete todo: ' + error.message);
    }
}

function renderTodos() {
    if (todos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state">
                <p>No todos yet!</p>
                <p style="font-size: 14px;">Add your first todo above</p>
            </div>
        `;
        return;
    }

    todoList.innerHTML = todos.map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}">
            <input
                type="checkbox"
                class="todo-checkbox"
                ${todo.completed ? 'checked' : ''}
                onchange="toggleTodo('${todo._id}', ${!todo.completed})"
            >
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="delete-btn" onclick="deleteTodo('${todo._id}')">Delete</button>
        </li>
    `).join('');
}

function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;

    totalCountEl.textContent = `Total: ${total}`;
    completedCountEl.textContent = `Completed: ${completed}`;
}

function showError(message) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

fetchTodos();
