import type { TerminalOptions } from './types';

export class Terminal {
    private options: TerminalOptions;
    private history: { command: string; output: string }[] = [];
    private modal: HTMLElement;
    private body: HTMLElement;
    private input: HTMLInputElement;

    constructor(options: TerminalOptions) {
        this.options = options;
        this.modal = this.createTerminalElement();
        this.body = this.modal.querySelector('.icv-body')!;
        this.input = this.modal.querySelector('.icv-input')!;

        this.attachEventListeners();
        this.showWelcomeMessage();
        this.options.mountPoint.appendChild(this.modal);
    }

    private createTerminalElement(): HTMLElement {
        const modal = document.createElement('div');
        modal.className = 'interactive-cv-modal';
        modal.innerHTML = `
      <div class="icv-header">
        <span class="icv-header-title">rene@bewerbung: ~</span>
        <button class="icv-close-btn"></button>
      </div>
      <div class="icv-body"></div>
      <div class="icv-input-line p-3 border-t border-slate-700">
        <span class="icv-prompt">${this.options.prompt || '$'}</span>
        <input type="text" class="icv-input" autofocus />
      </div>
    `;
        return modal;
    }

    private attachEventListeners() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.input.value.trim();
                this.executeCommand(command);
                this.input.value = '';
            }
        });
        this.modal.querySelector('.icv-close-btn')?.addEventListener('click', () => this.close());
    }

    private showWelcomeMessage() {
        const welcome = this.options.welcomeMessage || 'Willkommen! Tippe "help" für eine Liste aller Befehle.';
        this.renderOutput(welcome);
    }

    private executeCommand(commandStr: string) {
        const [commandName, ...args] = commandStr.split(' ');

        if (!commandName) {
            return;
        }

        const command = this.options.commands[commandName.toLowerCase()];

        let output = `Befehl nicht gefunden: ${commandName}. Tippe "help".`;

        if (command) {
            const commandOutput = command.output;
            if (typeof commandOutput === 'function') {
                output = commandOutput(args);
            } else {
                output = commandOutput;
            }
        }

        this.history.push({ command: commandStr, output });
        this.renderHistory();
    }

    private renderOutput(output: string) {
        const outputDiv = document.createElement('div');
        outputDiv.className = 'icv-output';
        outputDiv.textContent = output;
        this.body.appendChild(outputDiv);
    }

    private renderHistory() {
        this.body.innerHTML = '';
        this.showWelcomeMessage();
        this.history.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'icv-history-entry';
            entryDiv.innerHTML = `
        <div class="icv-prompt-line">
          <span class="icv-prompt">${this.options.prompt || '$'}</span>
          <span>${entry.command}</span>
        </div>
        <div class="icv-output">${entry.output}</div>
      `;
            this.body.appendChild(entryDiv);
        });
        this.body.scrollTop = this.body.scrollHeight;
    }

    public open() {
        this.modal.style.display = 'flex';
        this.input.focus();
    }

    public close() {
        this.modal.style.display = 'none';
    }

    public destroy() {
        this.options.mountPoint.removeChild(this.modal);
    }
}