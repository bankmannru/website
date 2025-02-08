import { database } from './firebase-config.js';
import { ref, onValue, set, push } from 'firebase/database';

const userId = '646839'; // В реальном приложении это должно быть динамическим

// Слушаем изменения баланса
function initializeBalanceListener() {
    const balanceRef = ref(database, `users/${userId}/balance`);
    onValue(balanceRef, (snapshot) => {
        const balance = snapshot.val() || 0;
        updateBalanceDisplay(balance);
    });
}

function updateBalanceDisplay(balance) {
    const balanceText = document.querySelector('.balance-text');
    balanceText.textContent = `${balance} МР`;
}

async function showTransactionDialog() {
    const dialog = document.createElement('md-dialog');
    dialog.innerHTML = `
        <div slot="headline">Перевод</div>
        <form slot="content" id="transaction-form" method="dialog">
            <md-outlined-text-field
                label="ID получателя"
                type="text"
                id="recipient-id"
                style="width: 100%; margin-bottom: 16px;">
            </md-outlined-text-field>
            <md-outlined-text-field
                label="Сумма (МР)"
                type="number"
                id="amount"
                style="width: 100%;">
            </md-outlined-text-field>
        </form>
        <div slot="actions">
            <md-text-button form="transaction-form" value="cancel">Отмена</md-text-button>
            <md-text-button form="transaction-form" value="confirm">Перевести</md-text-button>
        </div>
    `;

    document.body.appendChild(dialog);
    dialog.show();

    try {
        const result = await new Promise((resolve) => {
            dialog.addEventListener('close', () => {
                resolve(dialog.returnValue);
            });
        });

        if (result === 'confirm') {
            const recipientId = document.getElementById('recipient-id').value;
            const amount = parseInt(document.getElementById('amount').value);
            
            if (!recipientId || !amount || amount <= 0) {
                showError('Пожалуйста, заполните все поля корректно');
                return;
            }

            await makeTransaction(recipientId, amount);
        }
    } catch (error) {
        console.error('Dialog error:', error);
        showError('Произошла ошибка');
    } finally {
        dialog.remove();
    }
}

async function makeTransaction(recipientId, amount) {
    try {
        const transactionRef = ref(database, 'transactions');
        const newTransaction = {
            from: userId,
            to: recipientId,
            amount: amount,
            timestamp: Date.now()
        };

        await push(transactionRef, newTransaction);
        showSuccess('Перевод выполнен успешно');
    } catch (error) {
        console.error('Transaction error:', error);
        showError('Ошибка при выполнении перевода');
    }
}

function showSuccess(message) {
    const snackbar = document.createElement('md-snackbar');
    snackbar.innerHTML = `
        <md-icon slot="icon">check_circle</md-icon>
        <span>${message}</span>
    `;
    document.body.appendChild(snackbar);
    snackbar.show();
}

function showError(message) {
    const snackbar = document.createElement('md-snackbar');
    snackbar.innerHTML = `
        <md-icon slot="icon">error</md-icon>
        <span>${message}</span>
    `;
    document.body.appendChild(snackbar);
    snackbar.show();
}

// Initialize
document.addEventListener('DOMContentLoaded', initializeBalanceListener);

// Export functions for use in HTML
window.showTransactionDialog = showTransactionDialog; 