export function validateMessage(text) {
    if (!text || text.trim().length === 0) {
        throw new Error('Сообщение не может быть пустым');
    }
    if (text.length > 1000) {
        throw new Error('Сообщение слишком длинное');
    }
    return text.trim();
}

export function validateCardId(cardId) {
    if (!cardId || !/^\d{6}$/.test(cardId)) {
        throw new Error('Неверный формат номера карты');
    }
    return cardId;
} 