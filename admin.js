import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, remove, set, get, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db, collection, query, where, orderBy, onSnapshot, doc, deleteDoc, setDoc, updateDoc } from './firebase-config.js';

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBoT-HND1o56AJlpbqfEV3iMLR5YnK8fVg",
    authDomain: "besedka-chat.firebaseapp.com",
    databaseURL: "https://besedka-chat-default-rtdb.firebaseio.com",
    projectId: "besedka-chat",
    messagingSenderId: "751408360344",
    appId: "1:751408360344:web:fa0c11530b270184c499ed",
    measurementId: "G-M075LD8008"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Проверка доступа администратора
const adminPassword = localStorage.getItem('adminPassword');
if (!adminPassword) {
    const password = prompt('Введите пароль администратора:');
    if (password === 'admin123') {
        localStorage.setItem('adminPassword', password);
    } else {
        window.location.href = 'index.html';
    }
}

// DOM элементы
const usersSearch = document.getElementById('users-search');
const messagesSearch = document.getElementById('messages-search');
const readonlyMode = document.getElementById('readonly-mode');
const clearAllMessages = document.getElementById('clear-all-messages');
const changePassword = document.getElementById('change-password');
const passwordDialog = document.getElementById('password-dialog');
const refreshUsers = document.getElementById('refresh-users');
const refreshMessages = document.getElementById('refresh-messages');

// Статистика
let stats = {
    totalUsers: 0,
    onlineUsers: 0,
    bannedUsers: 0,
    totalMessages: 0,
    todayMessages: 0,
    deletedMessages: 0
};

// Обновление статистики
function updateStats() {
    document.getElementById('total-users').textContent = stats.totalUsers;
    document.getElementById('online-users').textContent = stats.onlineUsers;
    document.getElementById('banned-users').textContent = stats.bannedUsers;
    document.getElementById('total-messages').textContent = stats.totalMessages;
    document.getElementById('today-messages').textContent = stats.todayMessages;
    document.getElementById('deleted-messages').textContent = stats.deletedMessages;
}

// Получение списка пользователей
function loadUsers(searchTerm = '') {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';
        
        stats.totalUsers = 0;
        stats.onlineUsers = 0;
        stats.bannedUsers = 0;
        
        snapshot.forEach((userSnapshot) => {
            const user = userSnapshot.val();
            if (!searchTerm || user.username?.toLowerCase().includes(searchTerm.toLowerCase())) {
                stats.totalUsers++;
                if (user.banned) stats.bannedUsers++;
                if (Date.now() - user.lastSeen < 300000) stats.onlineUsers++; // 5 минут

                const userElement = document.createElement('div');
                userElement.className = 'admin-item';
                userElement.innerHTML = `
                    <div class="admin-item-info">
                        <div class="title-medium">${user.username || 'Без имени'}</div>
                        <div class="body-medium">
                            ID: ${user.userId}<br>
                            Статус: ${user.banned ? 'Заблокирован' : 'Активен'}<br>
                            Последняя активность: ${new Date(user.lastSeen).toLocaleString()}
                        </div>
                    </div>
                    <div class="actions">
                        ${user.banned ? `
                            <md-filled-button id="unban-${user.userId}" class="unban-button">
                                <md-icon slot="icon">lock_open</md-icon>
                                Разблокировать
                            </md-filled-button>
                        ` : `
                            <md-outlined-button id="ban-${user.userId}" class="ban-button">
                                <md-icon slot="icon">block</md-icon>
                                Заблокировать
                            </md-outlined-button>
                        `}
                    </div>
                `;
                usersList.appendChild(userElement);
                
                // Добавляем обработчики после рендеринга
                const button = user.banned ? 
                    userElement.querySelector(`#unban-${user.userId}`) :
                    userElement.querySelector(`#ban-${user.userId}`);
                    
                button.addEventListener('click', () => {
                    user.banned ? unbanUser(user.userId) : banUser(user.userId);
                });
            }
        });
        
        updateStats();
    });
}

// Получение сообщений
function loadMessages(searchTerm = '') {
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        const messagesList = document.getElementById('messages-list');
        messagesList.innerHTML = '';
        
        stats.totalMessages = 0;
        stats.todayMessages = 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        snapshot.forEach((doc) => {
            const message = doc.data();
            if (!searchTerm || message.text?.toLowerCase().includes(searchTerm.toLowerCase())) {
                stats.totalMessages++;
                if (message.timestamp.toDate() > today) stats.todayMessages++;

                const messageElement = document.createElement('div');
                messageElement.className = 'admin-item';
                messageElement.innerHTML = `
                    <div class="admin-item-info">
                        <div class="title-medium">${message.username || 'Аноним'}</div>
                        <div class="body-large">${message.text || '<Изображение>'}</div>
                        <div class="body-small">${message.timestamp.toDate().toLocaleString()}</div>
                    </div>
                    <md-outlined-button class="delete-button" id="delete-${doc.id}">
                        <md-icon slot="icon">delete</md-icon>
                        Удалить
                    </md-outlined-button>
                `;
                messagesList.appendChild(messageElement);
                
                messageElement.querySelector(`#delete-${doc.id}`)
                    .addEventListener('click', () => deleteMessage(doc.id));
            }
        });
        
        updateStats();
    });
}

// Функции модерации
window.banUser = async (userId) => {
    if (confirm('Вы уверены, что хотите заблокировать этого пользователя?')) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            banned: true,
            bannedAt: new Date()
        });
        stats.bannedUsers++;
        updateStats();
    }
};

window.unbanUser = async (userId) => {
    if (confirm('Разблокировать пользователя?')) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            banned: false,
            bannedAt: null
        });
        stats.bannedUsers--;
        updateStats();
    }
};

window.deleteMessage = async (messageId) => {
    if (confirm('Вы уверены, что хотите удалить это сообщение?')) {
        await deleteDoc(doc(db, 'messages', messageId));
        stats.deletedMessages++;
        updateStats();
    }
};

// Обработчики событий
usersSearch.addEventListener('input', (e) => loadUsers(e.target.value));
messagesSearch.addEventListener('input', (e) => loadMessages(e.target.value));

readonlyMode.addEventListener('change', async (e) => {
    const settingsRef = ref(database, 'settings');
    await set(settingsRef, {
        readonly: e.target.checked
    });
});

clearAllMessages.addEventListener('click', async () => {
    if (confirm('Вы уверены, что хотите удалить ВСЕ сообщения? Это действие нельзя отменить!')) {
        await remove(ref(database, 'messages'));
        alert('Все сообщения удалены');
    }
});

changePassword.addEventListener('click', async () => {
    const dialog = document.getElementById('password-dialog');
    // Ждем, пока компонент будет готов
    await dialog.updateComplete;
    dialog.show();
});

document.getElementById('save-password').addEventListener('click', async () => {
    const dialog = document.getElementById('password-dialog');
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword === confirmPassword && newPassword.length >= 6) {
        localStorage.setItem('adminPassword', newPassword);
        await dialog.updateComplete;
        dialog.close();
        alert('Пароль успешно изменен');
    } else {
        alert('Пароли не совпадают или слишком короткие');
    }
});

refreshUsers.addEventListener('click', () => loadUsers());
refreshMessages.addEventListener('click', () => loadMessages());

// Загрузка начальных данных
loadUsers();
loadMessages();

// Загрузка настроек
const settingsRef = ref(database, 'settings');
onValue(settingsRef, (snapshot) => {
    const settings = snapshot.val() || {};
    readonlyMode.checked = settings.readonly || false;
});

// Тема
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    document.body.className = isDark ? 'light-theme' : 'dark-theme';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
});

// Применяем сохраненную тему
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.className = `${savedTheme}-theme`;

// Функция удаления всех пользователей
async function clearAllUsers() {
    try {
        // Создаем диалог подтверждения
        const confirmResult = confirm('Вы уверены, что хотите удалить всех пользователей? Это действие нельзя отменить.');
        
        if (confirmResult) {
            // Получаем ссылку на всех пользователей
            const usersRef = ref(database, 'users');
            
            // Получаем текущий список пользователей
            const snapshot = await get(usersRef);
            if (snapshot.exists()) {
                // Удаляем всех пользователей напрямую
                await remove(usersRef);
                
                // Обновляем статистику
                stats.totalUsers = 0;
                stats.onlineUsers = 0;
                stats.bannedUsers = 0;
                updateStats();
                
                // Очищаем список пользователей
                const usersList = document.getElementById('users-list');
                usersList.innerHTML = '';
                
                showNotification('Все пользователи успешно удалены');
                
                // Принудительно обновляем список
                loadUsers();
            } else {
                showNotification('Нет пользователей для удаления');
            }
        }
    } catch (error) {
        console.error('Error clearing users:', error);
        showNotification('Ошибка при удалении пользователей', true);
    }
}

// Функция отображения уведомлений
function showNotification(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.innerHTML = `
        <md-icon>${isError ? 'error' : 'check_circle'}</md-icon>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Добавляем обработчик для кнопки удаления всех пользователей
document.getElementById('clear-users').addEventListener('click', clearAllUsers); 