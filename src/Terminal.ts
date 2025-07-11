import type { TerminalOptions, Command, CommandMap, Theme, Project } from './types';

const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0m-5 0h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7l-.7.7m0 11.4l.7.7m-12.1-.7l-.7.7"/></svg>`;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 3h.393a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.992z"/></svg>`;

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
    private welcomeMessageElement: HTMLElement | null = null;
    private commandHistory: string[] = [];
    private commandHistoryIndex = -1;

    private readonly defaultProjects: Project[] = [
        {
            name: 'PortForge - Self-Hosted Docker Management',
            description: 'Eine moderne Portainer-Alternative zur einfachen Verwaltung von Docker-Containern.',
            technologies: ['Vue.js', 'Quasar', 'TypeScript', 'Node.js', 'Docker API'],
            url: 'https://www.portforge.dev',
            githubUrl: 'https://github.com/CodingRuo/PortForge'
        },
        {
            name: 'Interaktives CV (Dieses Package)',
            description: 'Eine wiederverwendbare, framework-unabhängige Bibliothek, die ein Terminal-Interface als NPM-Package bereitstellt.',
            technologies: ['TypeScript', 'Vanilla JS', 'Vite', 'NPM Publishing'],
            githubUrl: 'https://github.com/codingruo/r3ne-sch0b3r.io'
        },
        {
            name: 'Admin-Plattform & DevOps',
            description: 'Eigenverantwortliche Neuentwicklung einer Management-Plattform inklusive Aufbau der kompletten Server-Infrastruktur.',
            technologies: ['Linux', 'Docker', 'NGINX', 'Clean Architecture', 'Full-Stack'],
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
            output: `<strong class="highlight">🎨 Frontend:</strong>  Vue.js, Quasar Framework, TypeScript, HTML5, CSS3, React, Tailwind CSS, Next.js, Nuxt.js<br>` +
                `<strong class="highlight">⚙️ Backend:</strong>   Node.js, Fastify, REST APIs, Clean Architecture, Express.js<br>` +
                `<strong class="highlight">🗄️ Datenbank:</strong> MongoDB, Mongoose ODM, PostgreSQL, Supabase, Prisma<br>` +
                `<strong class="highlight">🐳 DevOps:</strong>    Docker, Linux Server Administration, NGINX, CI/CD, Git, GitHub Actions`
        },
        'rene.showprojects': {
            description: 'Zeigt eine Übersicht meiner Schlüsselprojekte.',
            output: () => {
                let projectOutput = 'Hier sind einige meiner wichtigsten Projekte:<br><br>';
                this.projects.forEach(p => {
                    projectOutput += `<strong>${p.name}</strong><br>`;
                    projectOutput += `<span class="highlight">${p.description}</span><br>`;
                    projectOutput += `<strong>  Tech:</strong> ${p.technologies.join(', ')}<br>`;
                    if (p.url) {
                        projectOutput += `<strong>  Live:</strong> <a href="${p.url}" target="_blank">${p.url}</a><br>`;
                    }
                    if (p.githubUrl) {
                        projectOutput += `<strong>  Code:</strong> <a href="${p.githubUrl}" target="_blank">${p.githubUrl}</a><br>`;
                    }
                    projectOutput += '<br>';
                });
                return projectOutput;
            }
        },
        'rene.contact': {
            description: 'Gibt meine Kontaktdaten aus.',
            output: `Du kannst mich gerne jederzeit erreichen:<br><br>` +
                `📧 <strong>E-Mail:</strong>   <a href="mailto:r.schober@outlook.com">r.schober@outlook.com</a><br>` +
                `💼 <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/ren%C3%A9-schober-3662aa36b/" target="_blank">LinkedIn</a>` +
                `💼 <strong>GitHub:</strong> <a href="https://github.com/codingruo" target="_blank">GitHub</a>`
        },
        'theme': {
            description: 'Ändert das Farbschema. Verfügbar: [themes]. Oder klicke das Symbol oben rechts.',
            output: (params?: string[]) => {
                const themeName = params?.[0]?.toLowerCase();
                if (themeName && this.themes[themeName]) {
                    this.setTheme(themeName);
                    return `<span class="success">Theme erfolgreich zu '${themeName}' geändert.</span>`;
                }
                return `Fehler: Unbekanntes Theme. Verfügbar sind: ${this.themeKeys.join(', ')}<br><br>💡 <strong>Tipp:</strong> Klicke das Symbol oben rechts für schnellen Wechsel!`;
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
        <div class="icv-theme-dropdown">
          <div class="icv-theme-indicator">
            ${this.currentTheme === 'latte' ? moonIcon : sunIcon}
          </div>
        </div>
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
            if (this.welcomeMessageElement) {
                this.welcomeMessageElement.style.display = 'none';
                this.welcomeMessageElement = null;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.commandHistoryIndex > 0) {
                    this.commandHistoryIndex--;
                    this.input.value = this.commandHistory[this.commandHistoryIndex] || '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.commandHistoryIndex < this.commandHistory.length - 1) {
                    this.commandHistoryIndex++;
                    this.input.value = this.commandHistory[this.commandHistoryIndex] || '';
                } else {
                    this.commandHistoryIndex = this.commandHistory.length;
                    this.input.value = '';
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const command = this.input.value.trim();
                if (command) this.executeCommand(command);
                this.input.value = '';
            }
        });

        this.modal.querySelector('.icv-btn.close')?.addEventListener('click', () => this.close());

        this.modal.querySelector('.icv-theme-indicator')?.addEventListener('click', () => this.cycleTheme());
    }

    private showWelcomeMessage() {
        this.welcomeMessageElement = document.createElement('div');
        this.welcomeMessageElement.className = 'icv-output icv-output-welcome';
        this.welcomeMessageElement.innerHTML = this.options.welcomeMessage || 'Willkommen! Tippe "help" für Befehle.';
        this.body.appendChild(this.welcomeMessageElement);
    }

    private executeCommand(commandStr: string) {
        if (commandStr) {
            if (this.commandHistory[this.commandHistory.length - 1] !== commandStr) {
                this.commandHistory.push(commandStr);
            }
        }
        this.commandHistoryIndex = this.commandHistory.length;

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

    public open() {
        this.modal.style.display = 'flex';
        this.input.focus();
    }

    public close() {
        // this.modal.classList.remove('open');
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

        const theme = this.themes[themeName];
        // @ts-ignore
        Object.entries(theme).forEach(([key, value]) => {
            this.modal.style.setProperty(key, value);
        });

        const indicator = this.modal.querySelector('.icv-theme-indicator');
        if (indicator) {
            indicator.innerHTML = themeName === 'latte' ? moonIcon : sunIcon;
        }
    }

    private cycleTheme() {
        const currentIndex = this.themeKeys.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themeKeys.length;
        this.setTheme(this.themeKeys[nextIndex]!);
    }
}