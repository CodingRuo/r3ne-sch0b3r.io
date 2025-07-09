export interface Command {
    description: string;
    output: string | ((params?: string[]) => string);
}

export interface CommandMap {
    [key: string]: Command;
}

export interface TerminalOptions {
    mountPoint: HTMLElement;
    commands: CommandMap;
    welcomeMessage?: string;
    prompt?: string;
}