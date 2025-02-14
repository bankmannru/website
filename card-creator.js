export class BankCard extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        
        shadow.innerHTML = `
            <style>
                .card {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #6b3fa0 0%, #4a2780 100%);
                    border-radius: 16px;
                    padding: 24px;
                    box-sizing: border-box;
                    color: white;
                    font-family: 'Roboto', sans-serif;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .chip {
                    width: 50px;
                    height: 40px;
                    background: linear-gradient(135deg, #ffd700 0%, #b8860b 100%);
                    border-radius: 8px;
                    margin-bottom: 40px;
                }

                .card-number {
                    font-size: 24px;
                    letter-spacing: 2px;
                    margin-bottom: 24px;
                    font-family: 'Courier New', monospace;
                }

                .card-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: auto;
                }

                .card-holder {
                    text-transform: uppercase;
                    font-size: 14px;
                }

                .card-holder .label {
                    font-size: 10px;
                    opacity: 0.7;
                    margin-bottom: 4px;
                }

                .card-expires {
                    text-align: right;
                    font-size: 14px;
                }

                .card-expires .label {
                    font-size: 10px;
                    opacity: 0.7;
                    margin-bottom: 4px;
                }

                .bank-name {
                    position: absolute;
                    top: 24px;
                    right: 24px;
                    font-size: 20px;
                    font-weight: bold;
                    color: rgba(255, 255, 255, 0.9);
                }
            </style>
            <div class="card">
                <div class="bank-name">MANNRU BANK</div>
                <div class="chip"></div>
                <div class="card-number"></div>
                <div class="card-info">
                    <div class="card-holder">
                        <div class="label">ДЕРЖАТЕЛЬ КАРТЫ</div>
                        <div class="value"></div>
                    </div>
                    <div class="card-expires">
                        <div class="label">СРОК ДЕЙСТВИЯ</div>
                        <div class="value"></div>
                    </div>
                </div>
            </div>
        `;
    }

    static get observedAttributes() {
        return ['number', 'holder', 'expires'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.shadowRoot) return;

        switch (name) {
            case 'number':
                const numberElement = this.shadowRoot.querySelector('.card-number');
                if (numberElement) {
                    numberElement.textContent = this.formatCardNumber(newValue);
                }
                break;
            case 'holder':
                const holderElement = this.shadowRoot.querySelector('.card-holder .value');
                if (holderElement) {
                    holderElement.textContent = newValue;
                }
                break;
            case 'expires':
                const expiresElement = this.shadowRoot.querySelector('.card-expires .value');
                if (expiresElement) {
                    expiresElement.textContent = newValue;
                }
                break;
        }
    }

    formatCardNumber(number) {
        if (!number) return '';
        const cleaned = number.replace(/\s+/g, '');
        const groups = cleaned.match(/.{1,3}/g) || [];
        return groups.join(' ');
    }
}

customElements.define('bank-card', BankCard); 