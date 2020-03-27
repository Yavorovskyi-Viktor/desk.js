// Internal imports
import EditorAction, { Action } from "./EditorAction";

// Keys for which the browser will append their state to another keydown event
export enum SpecialKey {
    // Since OS X CMD is tied to Meta, make CTRL and Meta equivalent in shortcuts
    controlMeta,
    alt,
    shift
}

interface KeyboardShortcut{
    special: SpecialKey[],

    // An string code, e.g. 'q' = "KeyQ". Note that these are case insensitive. Corresponds to `KeyboardEvent.key`
    standard: string;
}

interface Shortcut {
    name: string,
    label: string,
    shortcut: KeyboardShortcut,
    action: Action
}

export { KeyboardShortcut, Shortcut };