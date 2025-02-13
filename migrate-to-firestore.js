import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getFirestore, doc, setDoc, collection } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);
const db = getFirestore(app);
const auth = getAuth(app);

export async function migrateData() {
    try {
        await signInAnonymously(auth);
        
        const snapshot = await get(ref(rtdb));
        const data = snapshot.val();
        
        if (!data) {
            throw new Error('Данные не найдены в Realtime Database');
        }

        const stats = {
            admins: 0,
            cards: 0,
            transactions: 0,
            exchangeRate: 0,
            market: 0,
            settings: 0
        };

        // Мигрируем админов
        if (data.admins) {
            try {
                for (const [adminId, admin] of Object.entries(data.admins)) {
                    await setDoc(doc(db, 'admins', adminId), {
                        ...admin,
                        updatedAt: new Date(),
                        migratedFrom: 'rtdb'
                    });
                    stats.admins++;
                }
                console.log('Админы мигрированы');
            } catch (e) {
                console.error('Ошибка при миграции админов:', e);
            }
        }
        
        // Мигрируем карты
        if (data.cards) {
            for (const [cardId, card] of Object.entries(data.cards)) {
                try {
                    const cardData = { ...card };
                    
                    // Выносим транзакции в отдельную подколлекцию
                    if (cardData.transactions) {
                        const transactions = cardData.transactions;
                        delete cardData.transactions; // Удаляем из основного документа
                        
                        // Создаем документ карты без транзакций
                        await setDoc(doc(db, 'cards', cardId), {
                            ...cardData,
                            updatedAt: new Date(),
                            migratedFrom: 'rtdb'
                        });
                        stats.cards++;

                        // Создаем подколлекцию транзакций
                        for (const [transactionId, transaction] of Object.entries(transactions)) {
                            await setDoc(
                                doc(db, 'cards', cardId, 'transactions', transactionId),
                                {
                                    ...transaction,
                                    timestamp: new Date(transaction.timestamp || Date.now())
                                }
                            );
                            stats.transactions++;
                        }
                    } else {
                        // Если транзакций нет, просто сохраняем карту
                        await setDoc(doc(db, 'cards', cardId), {
                            ...cardData,
                            updatedAt: new Date(),
                            migratedFrom: 'rtdb'
                        });
                        stats.cards++;
                    }
                    console.log(`Мигрирована карта: ${cardId}`);
                } catch (e) {
                    console.error(`Ошибка при миграции карты ${cardId}:`, e);
                }
            }
        }

        // Мигрируем курсы валют
        if (data.exchangeRate) {
            try {
                await setDoc(doc(db, 'exchangeRate', 'current'), {
                    ...data.exchangeRate,
                    updatedAt: new Date()
                });
                stats.exchangeRate++;
                console.log('Курсы валют мигрированы');
            } catch (e) {
                console.error('Ошибка при миграции курсов валют:', e);
            }
        }

        // Мигрируем маркет
        if (data.market) {
            try {
                for (const [itemId, item] of Object.entries(data.market)) {
                    await setDoc(doc(db, 'market', itemId), {
                        ...item,
                        updatedAt: new Date()
                    });
                    stats.market++;
                }
                console.log('Маркет мигрирован');
            } catch (e) {
                console.error('Ошибка при миграции маркета:', e);
            }
        }

        // Мигрируем настройки
        if (data.settings) {
            try {
                await setDoc(doc(db, 'settings', 'global'), {
                    ...data.settings,
                    updatedAt: new Date()
                });
                stats.settings++;
                console.log('Настройки мигрированы');
            } catch (e) {
                console.error('Ошибка при миграции настроек:', e);
            }
        }

        const summary = `Миграция завершена:
- Админы: ${stats.admins}
- Карты: ${stats.cards}
- Транзакции: ${stats.transactions}
- Курсы валют: ${stats.exchangeRate}
- Товары в маркете: ${stats.market}
- Настройки: ${stats.settings}

Всего мигрировано: ${Object.values(stats).reduce((a, b) => a + b, 0)} записей`;

        return summary;
    } catch (error) {
        console.error('Ошибка при миграции:', error);
        throw error;
    }
}

// Убираем автоматический запуск
// migrateData(); 