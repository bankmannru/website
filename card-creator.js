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
        const theme = this.getAttribute('theme') || 'default';
        const number = this.getAttribute('number') || '000';
        const holder = this.getAttribute('holder') || 'CARD HOLDER';
        const expires = this.getAttribute('expires') || '12/25';
        const pattern = this.getAttribute('pattern') || 'none';
        const chipStyle = this.getAttribute('chip-style') || 'classic';

        // Добавляем стили для эффектов карты
        const styles = `
            .card {
                /* существующие стили... */
            }

            /* Стили для неоновой карты */
            .neon-card {
                border: 2px solid #0ff !important;
                box-shadow: 0 0 10px #0ff, inset 0 0 10px #0ff !important;
            }

            .neon-glow {
                animation: neonGlow 2s ease-in-out infinite;
            }

            @keyframes neonGlow {
                0%, 100% { box-shadow: 0 0 10px #0ff, inset 0 0 10px #0ff; }
                50% { box-shadow: 0 0 20px #0ff, inset 0 0 20px #0ff; }
            }

            /* Стили для голографической карты */
            .hologram-card {
                background: linear-gradient(
                    45deg,
                    rgba(255,255,255,0.1) 0%,
                    rgba(255,255,255,0.3) 25%,
                    rgba(255,255,255,0.1) 50%,
                    rgba(255,255,255,0.3) 75%,
                    rgba(255,255,255,0.1) 100%
                ) !important;
                animation: hologramShift 3s linear infinite;
            }

            @keyframes hologramShift {
                0% { background-position: 0% 0%; }
                100% { background-position: 200% 0%; }
            }

            /* Стили для матричной карты */
            .matrix-card {
                background-color: #000 !important;
                position: relative;
                overflow: hidden;
            }

            .matrix-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    transparent 0%,
                    rgba(32, 255, 77, 0.2) 50%,
                    transparent 100%
                );
                animation: matrixScan 2s linear infinite;
            }

            @keyframes matrixScan {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }

            /* Стили для анимированной карты */
            .animated-card {
                animation: cardPulse 3s ease-in-out infinite;
            }

            @keyframes cardPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
            }

            /* Стили для никнейма */
            .card-nickname {
                position: absolute;
                bottom: 20px;
                right: 20px;
                font-size: 14px;
                color: rgba(255,255,255,0.8);
                font-style: italic;
                z-index: 2;
            }

            /* Стили для эффектов */
            .effect-sparkle {
                position: relative;
            }

            .effect-sparkle::after {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), 
                                      rgba(255,255,255,0.2) 0%, 
                                      transparent 20%);
                pointer-events: none;
            }
        `;

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
            <style>${styles}</style>
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

        // Добавляем обработчик для эффекта sparkle
        const card = this.shadowRoot.querySelector('.bank-card');
        if (card.classList.contains('effect-sparkle')) {
            card.addEventListener('mousemove', (e) => {
                const rect = e.target.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--x', `${x}%`);
                card.style.setProperty('--y', `${y}%`);
            });
        }
    }

    formatCardNumber(number) {
        return number.toString().replace(/(\d{3})(\d{3})/, '$1 $2');
    }
}

customElements.define('bank-card', BankCard); 