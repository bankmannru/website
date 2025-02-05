export class BankCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['number', 'holder', 'expires', 'theme', 'pattern', 'chip-style'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const number = this.getAttribute('number') || '000000';
        const holder = this.getAttribute('holder') || 'CARD HOLDER';
        const expires = this.getAttribute('expires') || '12/25';
        const theme = this.getAttribute('theme') || 'default';
        const pattern = this.getAttribute('pattern') || 'none';
        const chipStyle = this.getAttribute('chip-style') || 'classic';

        // Создаем список классов
        const classes = ['bank-card'];
        if (pattern && pattern !== 'none') {
            classes.push(`pattern-${pattern}`);
        }

        // Определяем стили для карты
        let backgroundStyle = '';
        if (theme === 'custom') {
            const primaryColor = this.style.getPropertyValue('--card-primary-color');
            const secondaryColor = this.style.getPropertyValue('--card-secondary-color');
            if (primaryColor && secondaryColor) {
                backgroundStyle = `background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) !important;`;
            }
        }

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="card-styles.css">
            ${theme === 'custom' ? `
                <style>
                    .bank-card[theme="custom"] {
                        ${backgroundStyle}
                    }
                </style>
            ` : ''}
            <div class="${classes.join(' ')}" theme="${theme}">
                <div class="bank-logo">MANNRU BANK</div>
                <div class="card-chip chip-${chipStyle}"></div>
                <div class="card-nfc"></div>
                <div class="card-number">${this.formatCardNumber(number)}</div>
                <div class="card-details">
                    <div class="card-holder">
                        <div class="label">ДЕРЖАТЕЛЬ КАРТЫ</div>
                        <div class="value">${holder}</div>
                    </div>
                    <div class="card-expires">
                        <div class="label">СРОК ДЕЙСТВИЯ</div>
                        <div class="value">${expires}</div>
                    </div>
                </div>
            </div>
        `;
    }

    formatCardNumber(number) {
        return number.toString().replace(/(\d{3})(\d{3})/, '$1 $2');
    }
}

customElements.define('bank-card', BankCard); 