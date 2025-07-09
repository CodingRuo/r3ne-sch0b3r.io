import { Terminal } from './Terminal';
import type { TerminalOptions, CommandMap, Command } from './types';
import './styles.css';

/**
 * Erstellt und initialisiert ein neues interaktives CV-Terminal.
 * @param mountPointId - Die ID des HTML-Elements, an das das Terminal angehängt werden soll.
 * @param commands - Ein Objekt, das die verfügbaren Befehle definiert.
 * @param welcomeMessage - Eine optionale Willkommensnachricht.
 * @returns Eine Instanz der Terminal-Klasse.
 */
export function createInteractiveCV(
    mountPointId: string,
    commands: CommandMap,
    welcomeMessage?: string
): Terminal {
    const mountPoint = document.getElementById(mountPointId);
    if (!mountPoint) {
        throw new Error(`[InteractiveCV] Mount-Point mit der ID "${mountPointId}" wurde nicht gefunden.`);
    }

    const options: TerminalOptions = {
        mountPoint,
        commands,
        welcomeMessage,
        prompt: '>',
    };

    return new Terminal(options);
}

export type { Command, CommandMap, TerminalOptions };