// Create a draggable executor button
const executorBtn = document.createElement('md-filled-tonal-button');
executorBtn.innerHTML = '{ }';
executorBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    --md-sys-color-primary: #00ff00;
    --md-sys-color-on-primary: #1e1e1e;
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-family: monospace;
    font-size: 20px;
    z-index: 10000;
    user-select: none;
`;

// Create the executor panel
const executorPanel = document.createElement('div');
executorPanel.style.cssText = `
    position: fixed;
    bottom: 70px;
    right: 20px;
    width: 400px;
    background: var(--md-sys-color-surface);
    border-radius: 16px;
    padding: 16px;
    display: none;
    z-index: 10000;
    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
`;

// Create the editor
const editor = document.createElement('md-filled-text-field');
editor.setAttribute('type', 'textarea');
editor.setAttribute('rows', '6');
editor.label = 'Enter JavaScript code here...';
editor.style.cssText = `
    width: 100%;
    --md-sys-color-primary: #00ff00;
    margin-bottom: 12px;
`;

// Create the output area
const output = document.createElement('div');
output.style.cssText = `
    width: 100%;
    max-height: 150px;
    background: #2d2d2d;
    color: #ffffff;
    border-radius: 8px;
    padding: 12px;
    font-family: monospace;
    overflow-y: auto;
    margin-bottom: 12px;
    white-space: pre-wrap;
`;

// Create the run button
const runBtn = document.createElement('md-filled-button');
runBtn.innerHTML = `
    <md-icon>play_arrow</md-icon>
    Run
`;
runBtn.style.cssText = `
    --md-sys-color-primary: #00ff00;
    --md-sys-color-on-primary: #1e1e1e;
`;

// Create the clear button
const clearBtn = document.createElement('md-filled-button');
clearBtn.innerHTML = `
    <md-icon>clear</md-icon>
    Clear
`;
clearBtn.style.cssText = `
    --md-sys-color-primary: #ff4444;
    margin-left: 8px;
`;

// Add DevTools helper functions
const devTools = {
    // Element manipulation
    highlight: (selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.style.outline = '2px solid #f00';
            setTimeout(() => el.style.outline = '', 2000);
        });
        return `Found ${elements.length} elements`;
    },
    
    // Style manipulation
    setStyle: (selector, styles) => {
        document.querySelectorAll(selector).forEach(el => {
            Object.assign(el.style, styles);
        });
    },
    
    // Content manipulation
    setText: (selector, text) => {
        document.querySelectorAll(selector).forEach(el => {
            el.textContent = text;
        });
    },
    
    // Event listeners
    listen: (selector, event) => {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener(event, (e) => {
                console.log('Event triggered:', {
                    element: el,
                    event: e.type,
                    target: e.target
                });
            });
        });
    },
    
    // DOM traversal
    findParent: (selector, parentSelector) => {
        const element = document.querySelector(selector);
        return element?.closest(parentSelector);
    },
    
    // Element creation
    create: (tag, attributes = {}, styles = {}) => {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        Object.assign(element.style, styles);
        return element;
    },
    
    // Animation
    animate: (selector, keyframes, options) => {
        document.querySelectorAll(selector).forEach(el => {
            el.animate(keyframes, options);
        });
    },
    
    // Local Storage
    storage: {
        set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
        get: (key) => JSON.parse(localStorage.getItem(key)),
        clear: () => localStorage.clear(),
        list: () => Object.entries(localStorage)
    },
    
    // Network
    fetch: (url, options = {}) => {
        try {
            return fetch(url, options)
                .then(response => response.json())
                .catch(error => {
                    console.error('Fetch error:', error);
                });
        } catch (error) {
            console.error('Fetch error:', error);
        }
    },
    
    // Utility functions
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    log: (...args) => console.log(...args),
    table: (data) => console.table(data),
    
    // Page manipulation
    redirect: (url) => window.location.href = url,
    reload: () => window.location.reload(),
    
    // Element info
    info: (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        return {
            tag: el.tagName,
            id: el.id,
            classes: [...el.classList],
            attributes: Object.fromEntries([...el.attributes].map(attr => [attr.name, attr.value])),
            styles: getComputedStyle(el),
            size: el.getBoundingClientRect(),
            text: el.textContent
        };
    },

    // Add more utility functions
    // Cookie manipulation
    cookies: {
        get: (name) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        },
        set: (name, value, days = 7) => {
            const d = new Date();
            d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
        },
        delete: (name) => {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
        }
    },

    // Form manipulation
    form: {
        fill: (selector, data) => {
            const form = document.querySelector(selector);
            if (!form) return;
            Object.entries(data).forEach(([name, value]) => {
                const input = form.querySelector(`[name="${name}"]`);
                if (input) input.value = value;
            });
        },
        submit: (selector) => {
            const form = document.querySelector(selector);
            if (form) form.submit();
        },
        clear: (selector) => {
            const form = document.querySelector(selector);
            if (form) form.reset();
        }
    },

    // Element visibility
    toggle: (selector) => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.display = el.style.display === 'none' ? '' : 'none';
        });
    },

    // Class manipulation
    classes: {
        add: (selector, ...classes) => {
            document.querySelectorAll(selector).forEach(el => {
                el.classList.add(...classes);
            });
        },
        remove: (selector, ...classes) => {
            document.querySelectorAll(selector).forEach(el => {
                el.classList.remove(...classes);
            });
        },
        toggle: (selector, ...classes) => {
            document.querySelectorAll(selector).forEach(el => {
                classes.forEach(c => el.classList.toggle(c));
            });
        }
    },

    // URL manipulation
    url: {
        params: new URLSearchParams(window.location.search),
        get: (param) => new URLSearchParams(window.location.search).get(param),
        set: (param, value) => {
            const params = new URLSearchParams(window.location.search);
            params.set(param, value);
            window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
        }
    },

    // Debug helpers
    debug: {
        outline: (color = 'red') => {
            document.querySelectorAll('*').forEach(el => {
                el.style.outline = `1px solid ${color}`;
            });
        },
        clearOutline: () => {
            document.querySelectorAll('*').forEach(el => {
                el.style.outline = '';
            });
        },
        logClicks: (enable = true) => {
            if (enable) {
                document.addEventListener('click', e => {
                    console.log('Clicked:', {
                        element: e.target,
                        position: { x: e.clientX, y: e.clientY },
                        time: new Date().toISOString()
                    });
                });
            }
        }
    }
};

// Add elements to panel
executorPanel.appendChild(editor);
executorPanel.appendChild(output);
const buttonContainer = document.createElement('div');
buttonContainer.style.display = 'flex';
buttonContainer.appendChild(runBtn);
buttonContainer.appendChild(clearBtn);
executorPanel.appendChild(buttonContainer);

// Add everything to body
document.body.appendChild(executorBtn);
document.body.appendChild(executorPanel);

// Make the button draggable
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

executorBtn.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === executorBtn) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, executorBtn);
        
        // Move panel with button
        const panelX = currentX + parseInt(executorBtn.style.right || '20px');
        const panelY = currentY + parseInt(executorBtn.style.bottom || '70px');
        setTranslate(panelX, panelY, executorPanel);
    }
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

// Toggle panel visibility
let isPanelVisible = false;
executorBtn.addEventListener('click', () => {
    if (!isDragging) {
        isPanelVisible = !isPanelVisible;
        executorPanel.style.display = isPanelVisible ? 'block' : 'none';
    }
});

// Run code function with DevTools
function runCode() {
    const code = editor.value;
    output.innerHTML = '';
    
    const originalLog = console.log;
    console.log = (...args) => {
        output.innerHTML += args.map(arg => 
            typeof arg === 'object' ? 
                JSON.stringify(arg, null, 2) : 
                String(arg)
        ).join(' ') + '\n';
        originalLog.apply(console, args);
    };

    try {
        // Wrap code in async IIFE to support await
        const wrappedCode = `
            (async () => {
                with (devTools) {
                    ${code}
                }
            })().catch(error => {
                throw error;
            });
        `;
        eval(wrappedCode);
    } catch (error) {
        output.innerHTML += `\nError: ${error.message}`;
    }

    console.log = originalLog;
}

// Add button event listeners
runBtn.addEventListener('click', runCode);
clearBtn.addEventListener('click', () => {
    editor.value = '';
    output.innerHTML = '';
});

// Add keyboard shortcut (Ctrl/Cmd + Enter to run)
editor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
    }
}); 