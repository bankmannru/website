import { db, doc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, onSnapshot } from './firebase-config.js';

const userId = '646839'; // В реальном приложении это должно быть динамическим

// Слушаем изменения баланса
function initializeBalanceListener() {
    const userDoc = doc(db, 'users', userId);
    onSnapshot(userDoc, (doc) => {
        if (doc.exists()) {
            const userData = doc.data();
            updateBalanceDisplay(userData.balance || 0);
        }
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
        // Получаем документы отправителя и получателя
        const senderDoc = doc(db, 'users', userId);
        const recipientDoc = doc(db, 'users', recipientId);
        
        const senderSnapshot = await getDoc(senderDoc);
        const recipientSnapshot = await getDoc(recipientDoc);
        
        if (!senderSnapshot.exists() || !recipientSnapshot.exists()) {
            throw new Error('Пользователь не найден');
        }
        
        const senderBalance = senderSnapshot.data().balance || 0;
        
        if (senderBalance < amount) {
            throw new Error('Недостаточно средств');
        }
        
        // Создаем транзакцию
        const transactionData = {
            from: userId,
            to: recipientId,
            amount: amount,
            timestamp: new Date()
        };
        
        // Добавляем транзакцию в коллекцию
        await addDoc(collection(db, 'transactions'), transactionData);
        
        // Обновляем балансы
        await updateDoc(senderDoc, {
            balance: senderBalance - amount
        });
        
        await updateDoc(recipientDoc, {
            balance: (recipientSnapshot.data().balance || 0) + amount
        });
        
        showSuccess('Перевод выполнен успешно');
    } catch (error) {
        console.error('Transaction error:', error);
        showError(error.message || 'Ошибка при выполнении перевода');
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