export class BankCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['number', 'holder', 'expires', 'theme', 'primary-color', 'secondary-color', 'pattern', 'chip-style'];
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
        const primaryColor = this.getAttribute('primary-color');
        const secondaryColor = this.getAttribute('secondary-color');
        const pattern = this.getAttribute('pattern') || 'none';
        const chipStyle = this.getAttribute('chip-style') || 'classic';

        if (theme === 'custom' && primaryColor && secondaryColor) {
            this.style.setProperty('--custom-primary-color', primaryColor);
            this.style.setProperty('--custom-secondary-color', secondaryColor);
        }

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="card-styles.css">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
            <div class="bank-card card-theme-${theme} pattern-${pattern}">
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