// Internal imports
import EditorAction, { Action } from "./EditorAction";

// Keys for which the browser will append their state to another keydown event
export enum SpecialKey {
    control,
    alt,
    shift,
    meta,
}

interface KeyboardShortcut{
    special: SpecialKey[],

    // An integer code, e.g. 'q' = "KeyQ". Note that these are case insensitive
    standard: string;
}

interface Shortcut {
    name: string,
    label: string,
    shortcut: KeyboardShortcut,
    action: Action
}

export { KeyboardShortcut, Shortcut };