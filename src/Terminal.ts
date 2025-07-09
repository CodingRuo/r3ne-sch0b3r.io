import type { TerminalOptions, Command, CommandMap } from './types';

export class Terminal {
    private options: TerminalOptions;
    private history: { command: string; output: string }[] = [];
    private modal: HTMLElement;
    private body: HTMLElement;
    private input: HTMLInputElement;
    private commands: CommandMap;

    private readonly defaultCommands: CommandMap = {
        'rene.whoami': {
            description: 'Eine kurze Vorstellung meiner Person und Vision.',
            output: `<strong>René Schober</strong> - Full-Stack Entwickler aus Salzburg.<br><br>` +
                `🚀 Ich bin ein leidenschaftlicher Entwickler, der den <strong class="highlight">gesamten Entwicklungszyklus</strong> liebt – von der ersten Idee bis zum produktiven Server.<br>` +
                `💡 Meine Stärke liegt darin, komplexe Probleme in elegante, skalierbare Lösungen zu verwandeln.`
        },
        'rene.getskills': {
            description: 'Listet meinen Tech-Stack auf.',
            output: `<strong class="highlight">🎨 Frontend:</strong>  Vue.js, Quasar Framework, TypeScript, HTML5, CSS3<br>` +
                `<strong class="highlight">⚙️ Backend:</strong>   Node.js, Fastify, REST APIs, Clean Architecture<br>` +
                `<strong class="highlight">🗄️ Datenbank:</strong> MongoDB, Mongoose ODM<br>` +
                `<strong class="highlight">🐳 DevOps:</strong>    Docker, Linux Server Administration, NGINX`
        },
        'rene.showprojects': {
            description: 'Zeigt eine Übersicht meiner Schlüsselprojekte.',
            output: `Hier sind meine Kernprojekte. Für Details scrolle bitte zur Projekt-Sektion auf der Webseite.\n\n` +
                `1. Admin-Oberfläche (Eigenverantwortliche Neuentwicklung)\n` +
                `2. DevOps & Server-Infrastruktur`
        },
        'rene.contact': {
            description: 'Gibt meine Kontaktdaten aus.',
            output: `Du kannst mich gerne jederzeit erreichen:\n\n` +
                `📧 E-Mail:   deine.email@provider.com\n` +
                `💼 LinkedIn: linkedin.com/in/dein-profil`
        },
        'help': {
            description: 'Zeigt alle Befehle an.',
            output: (params?: string[]) => this.getHelpText()
        },
        'clear': {
            description: 'Leert den Terminal-Bildschirm.',
            output: ''
        }
    };

    private getHelpText(): string {
        let helpText = 'Verfügbare Befehle:\n\n';
        for (const key in this.commands) {
            // @ts-ignore
            helpText += `${key.padEnd(20)} → ${this.commands[key].description}\n`;
        }
        // @ts-ignore
        helpText += `${'clear'.padEnd(20)} → Leert den Terminal-Bildschirm.`;
        return helpText;
    }

    constructor(options: TerminalOptions) {
        this.options = options;

        const safeCustomCommands = { ...this.options.customCommands };
        if (safeCustomCommands.help) {
            console.warn('[InteractiveCV] Der "help"-Befehl kann nicht überschrieben werden.');
            delete safeCustomCommands.help;
        }
        if (safeCustomCommands.clear) {
            delete safeCustomCommands.clear;
        }

        this.commands = { ...this.defaultCommands, ...safeCustomCommands };

        this.modal = this.createTerminalElement();

        if (this.options.width) this.modal.style.width = this.options.width;
        if (this.options.height) this.modal.style.height = this.options.height;

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
        <div class="icv-header-buttons">
          <div class="icv-btn close"></div>
          <div class="icv-btn minimize"></div>
          <div class="icv-btn maximize"></div>
        </div>
        <span class="icv-header-title">rene-schober -- bash</span>
      </div>
      <div class="icv-body"></div>
      <div class="icv-input-line">
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
        const closeBtn = this.modal.querySelector('.icv-btn.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    }

    private showWelcomeMessage() {
        const welcome = this.options.welcomeMessage || 'Willkommen! Tippe "help" für eine Liste aller Befehle.';
        this.renderOutput(welcome);
    }

    private executeCommand(commandStr: string) {
        if (commandStr.toLowerCase() === 'clear') {
            this.history = [];
            this.body.innerHTML = '';
            this.showWelcomeMessage();
            this.input.value = '';
            return;
        }

        const [commandName, ...args] = commandStr.split(' ');
        // @ts-ignore
        const command = this.commands[commandName.toLowerCase()];

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

    private renderHistory() {
        this.body.innerHTML = '';
        this.showWelcomeMessage();

        this.history.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'icv-history-entry';

            const promptLine = document.createElement('div');
            promptLine.className = 'icv-prompt-line';
            const promptSpan = document.createElement('span');
            promptSpan.className = 'icv-prompt';
            promptSpan.textContent = this.options.prompt || '$';
            const commandSpan = document.createElement('span');
            commandSpan.className = 'icv-command-text';
            commandSpan.textContent = entry.command;
            promptLine.appendChild(promptSpan);
            promptLine.appendChild(commandSpan);

            const outputDiv = document.createElement('div');
            outputDiv.className = 'icv-output';
            outputDiv.innerHTML = entry.output;

            entryDiv.appendChild(promptLine);
            entryDiv.appendChild(outputDiv);
            this.body.appendChild(entryDiv);
        });
        this.body.scrollTop = this.body.scrollHeight;
    }

    private renderOutput(output: string) {
        const outputDiv = document.createElement('div');
        outputDiv.className = 'icv-output';
        outputDiv.innerHTML = output;
        this.body.appendChild(outputDiv);
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