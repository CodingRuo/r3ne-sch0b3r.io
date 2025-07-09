import type { TerminalOptions, Command, CommandMap, Theme, Project } from './types';

export class Terminal {
    private options: TerminalOptions;
    private history: { command: string; output: string }[] = [];
    private modal: HTMLElement;
    private body: HTMLElement;
    private input: HTMLInputElement;
    private commands: CommandMap;
    private projects: Project[];
    private themes: { [key: string]: Theme };
    private currentTheme: string;
    private themeKeys: string[];

    private readonly defaultProjects: Project[] = [
        {
            name: 'Admin-Oberfläche (Eigenverantwortliche Neuentwicklung)',
            description: '→ Komplexe Vue.js/Quasar Anwendung mit Node.js Backend nach Clean-Architecture-Prinzipien.',
        },
        {
            name: 'DevOps & Server-Infrastruktur',
            description: '→ Aufbau und Verwaltung von Linux-Servern, Docker-Containern und NGINX-Konfigurationen.',
            url: 'https://github.com/codingruo'
        }
    ];

    private readonly defaultThemes: { [key: string]: Theme } = {
        mocha: {
            '--ctp-base': '#1e1e2e', '--ctp-text': '#cdd6f4', '--ctp-mantle': '#181825',
            '--ctp-surface0': '#313244', '--ctp-blue': '#89b4fa', '--ctp-yellow': '#f9e2af',
            '--ctp-green': '#a6e3a1', '--ctp-red': '#f38ba8', '--ctp-mauve': '#cba6f7',
            '--ctp-sky': '#89dceb', '--ctp-shadow': 'rgba(0,0,0,0.4)'
        },
        latte: {
            '--ctp-base': '#eff1f5', '--ctp-text': '#4c4f69', '--ctp-mantle': '#e6e9ef',
            '--ctp-surface0': '#acb0be', '--ctp-blue': '#1e66f5', '--ctp-yellow': '#df8e1d',
            '--ctp-green': '#40a02b', '--ctp-red': '#d20f39', '--ctp-mauve': '#8839ef',
            '--ctp-sky': '#04a5e5', '--ctp-shadow': 'rgba(0,0,0,0.15)'
        }
    };

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
            output: () => {
                let projectOutput = 'Hier sind meine Kernprojekte. Für Details besuche bitte die verlinkten Seiten.<br><br>';
                this.projects.forEach(p => {
                    if (p.url) {
                        projectOutput += `<strong><a href="${p.url}" target="_blank">${p.name}</a></strong><br>${p.description}<br><br>`;
                    } else {
                        projectOutput += `<strong>${p.name}</strong><br>${p.description}<br><br>`;
                    }
                });
                return projectOutput;
            }
        },
        'rene.contact': {
            description: 'Gibt meine Kontaktdaten aus.',
            output: `Du kannst mich gerne jederzeit erreichen:<br><br>` +
                `📧 <strong>E-Mail:</strong>   <a href="mailto:deine.email@provider.com">deine.email@provider.com</a><br>` +
                `💼 <strong>LinkedIn:</strong> <a href="https://linkedin.com/in/dein-profil" target="_blank">linkedin.com/in/dein-profil</a>`
        },
        'theme': {
            description: 'Ändert das Farbschema. Verfügbar: [themes].',
            output: (params?: string[]) => {
                const themeName = params?.[0]?.toLowerCase();
                if (themeName && this.themes[themeName]) {
                    this.setTheme(themeName);
                    return `<span class="success">Theme erfolgreich zu '${themeName}' geändert.</span>`;
                }
                return `Fehler: Unbekanntes Theme. Verfügbar sind: ${this.themeKeys.join(', ')}`;
            }
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
        let tableRows = '';
        for (const key in this.commands) {
            tableRows += `
        <tr>
          <td class="icv-help-command">${key}</td>
          <td class="icv-help-arrow">→</td>
          <td class="icv-help-description">${this.commands[key]?.description || 'Beschreibung nicht verfügbar'}</td>
        </tr>
      `;
        }
        return `Verfügbare Befehle:\n<table class="icv-help-table">${tableRows}</table>`;
    }

    constructor(options: TerminalOptions) {
        this.options = options;
        this.projects = this.options.projects || this.defaultProjects;
        this.themes = { ...this.defaultThemes, ...this.options.customThemes };
        this.themeKeys = Object.keys(this.themes);
        this.currentTheme = this.options.defaultTheme || 'mocha';

        const safeCustomCommands = { ...this.options.customCommands };
        if (safeCustomCommands.help) delete safeCustomCommands.help;
        if (safeCustomCommands.clear) delete safeCustomCommands.clear;
        this.commands = { ...this.defaultCommands, ...safeCustomCommands };

        this.modal = this.createTerminalElement();
        if (this.options.width) this.modal.style.width = this.options.width;
        if (this.options.height) this.modal.style.height = this.options.height;

        this.body = this.modal.querySelector('.icv-body')!;
        this.input = this.modal.querySelector('.icv-input')!;

        this.attachEventListeners();
        this.setTheme(this.currentTheme);
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
        <div class="icv-theme-switcher" title="Theme wechseln"></div>
      </div>
      <div class="icv-body"></div>
      <div class="icv-input-line">
        <span class="icv-prompt">${this.options.prompt || '>'}</span>
        <input type="text" class="icv-input" autofocus />
      </div>
    `;
        return modal;
    }

    private attachEventListeners() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const command = this.input.value.trim();
                if (command) this.executeCommand(command);
                this.input.value = '';
            }
        });

        this.modal.querySelector('.icv-btn.close')?.addEventListener('click', () => this.close());
        this.modal.querySelector('.icv-theme-switcher')?.addEventListener('click', () => this.cycleTheme());
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

    public setTheme(themeName: string) {
        if (!this.themes[themeName]) {
            console.error(`Theme "${themeName}" nicht gefunden.`);
            return;
        }
        this.themeKeys.forEach(key => this.modal.classList.remove(`theme-${key}`));
        this.modal.classList.add(`theme-${themeName}`);
        this.currentTheme = themeName;
    }

    private cycleTheme() {
        const currentIndex = this.themeKeys.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themeKeys.length;
        this.setTheme(this.themeKeys[nextIndex]!);
    }
}