class BankCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return [
            'card-number',
            'holder-name',
            'expires',
            'chip-style',
            'primary-color',
            'secondary-color',
            'pattern',
            'theme',
            'frozen',
            'god-mode',
            'admin'
        ];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const cardNumber = this.getAttribute('card-number') || '000';
        const holderName = this.getAttribute('holder-name') || 'ИМЯ ФАМИЛИЯ';
        const expires = this.getAttribute('expires') || '00/00';
        const primaryColor = this.getAttribute('primary-color') || '#ff7e5f';
        const secondaryColor = this.getAttribute('secondary-color') || '#feb47b';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    perspective: 1000px;
                }
                .card {
                    width: 100%;
                    height: 100%;
                    border-radius: 28px;
                    padding: 32px;
                    box-sizing: border-box;
                    position: relative;
                    background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                    color: white;
                    font-family: 'Roboto', sans-serif;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease;
                }
                .card:hover {
                    transform: scale(1.02);
                }
                .bank-name {
                    position: absolute;
                    top: 32px;
                    right: 32px;
                    font-size: 20px;
                    font-weight: bold;
                    letter-spacing: 1px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .chip {
                    width: 50px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    margin-bottom: 48px;
                    backdrop-filter: blur(4px);
                    position: relative;
                    overflow: hidden;
                }
                .chip::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.3) 0%,
                        rgba(255, 255, 255, 0.1) 100%
                    );
                    border-radius: inherit;
                }
                .card-number {
                    font-size: 24px;
                    letter-spacing: 2px;
                    font-weight: 500;
                    margin-bottom: 48px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .card-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: auto;
                }
                .holder-label, .expires-label {
                    font-size: 12px;
                    opacity: 0.8;
                    margin-bottom: 8px;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }
                .holder, .expires {
                    font-size: 16px;
                    font-weight: 500;
                    letter-spacing: 1px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .expires-label {
                    text-align: right;
                }
                .expires {
                    text-align: right;
                }
            </style>
            <div class="card">
                <div class="bank-name">MANNRU BANK</div>
                <div class="chip"></div>
                <div class="card-number">${cardNumber}</div>
                <div class="card-info">
                    <div>
                        <div class="holder-label">ДЕРЖАТЕЛЬ КАРТЫ</div>
                        <div class="holder">${holderName}</div>
                    </div>
                    <div>
                        <div class="expires-label">СРОК ДЕЙСТВИЯ</div>
                        <div class="expires">${expires}</div>
                    </div>
                </div>
            </div>
        `;
    }
}

if (!customElements.get('bank-card')) {
    customElements.define('bank-card', BankCard);
}