import { database } from './firebase-config.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Показываем диалог входа
export function showLoginDialog() {
    const dialog = document.createElement('md-dialog');
    dialog.innerHTML = `
        <div slot="headline">Вход по карте Маннру</div>
        <form slot="content" id="login-form" method="dialog">
            <md-outlined-text-field
                type="number"
                label="Номер карты"
                required
                id="card-number"
                style="width: 100%; margin-bottom: 16px;">
            </md-outlined-text-field>
            
            <md-outlined-text-field
                type="password"
                label="Код безопасности"
                required
                minlength="4"
                maxlength="4"
                id="security-code">
            </md-outlined-text-field>
        </form>
        <div slot="actions">
            <md-text-button form="login-form" value="cancel">Отмена</md-text-button>
            <md-filled-button id="submit-button" form="login-form" value="submit">
                Войти
            </md-filled-button>
        </div>
    `;

    document.body.appendChild(dialog);
    
    dialog.addEventListener('close', async (e) => {
        if (dialog.returnValue === 'submit') {
            const cardNumber = dialog.querySelector('#card-number').value;
            const securityCode = dialog.querySelector('#security-code').value;

            try {
                const success = await authenticateWithCard(cardNumber, securityCode);
                if (success) {
                    showNotification('success', 'Вход выполнен успешно!');
                    localStorage.setItem('userId', cardNumber);
                    window.location.href = `account=${cardNumber}.html`;
                } else {
                    showNotification('error', 'Неверный номер карты или код безопасности');
                }
            } catch (error) {
                console.error('Auth error:', error);
                showNotification('error', 'Ошибка при входе');
            }
        }
        dialog.remove();
    });

    dialog.show();
}

async function authenticateWithCard(cardNumber, securityCode) {
    try {
        const userRef = ref(database, `cards/${cardNumber}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const cardData = snapshot.val();
            return cardData.securityCode === securityCode;
        }
        return false;
    } catch (error) {
        console.error('Authentication error:', error);
        return false;
    }
}

// Выход из аккаунта
export async function logout() {
    localStorage.removeItem('userId');
    showNotification('success', 'Вы вышли из аккаунта');
    window.location.href = 'index.html';
}

function showNotification(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <md-icon>${type === 'success' ? 'check_circle' : 'error'}</md-icon>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Анимация появления
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Удаление через 3 секунды
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
} 