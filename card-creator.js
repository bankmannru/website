export class BankCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['number', 'holder', 'expires', 'theme'];
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

        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="card-styles.css">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
            <div class="bank-card card-theme-${theme}">
                <div class="bank-logo">MANNRU BANK</div>
                <div class="card-chip"></div>
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