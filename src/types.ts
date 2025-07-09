export interface Command {
    description: string;
    output: string | ((params?: string[]) => string);
}

export interface CommandMap {
    [key: string]: Command;
}

export interface Project {
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    githubUrl?: string;
}

export interface Theme {
    [key: string]: string;
}

export interface TerminalOptions {
    mountPoint: HTMLElement;
    customCommands?: CommandMap;
    projects?: Project[];
    customThemes?: { [key: string]: Theme };
    defaultTheme?: string;
    welcomeMessage?: string;
    prompt?: string;
    width?: string;
    height?: string;
}