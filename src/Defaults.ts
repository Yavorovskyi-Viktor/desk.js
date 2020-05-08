import DeskConfig from "../types/DeskConfig";
import {uuid} from "./Util";
import {Shortcut, SpecialKey} from "../types/KeyboardShortcut";
import {Action} from "../types/EditorAction";

const defaultShortcuts: Shortcut[] = [
    {
        name: "Bold",
        action: Action.makeBold,
        label: "CTRL + B",
        shortcut: {
            special: [SpecialKey.controlMeta],
            standard: "KeyB"
        }
    },
    {
        name: "Italic",
        action: Action.makeItalic,
        label: "CTRL + I",
        shortcut: {
            special: [SpecialKey.controlMeta],
            standard:  "KeyI"
        }
    },
    {
        name: "Underline",
        action: Action.makeUnderline,
        label: "CTRL + U",
        shortcut: {
            special: [SpecialKey.controlMeta],
            standard: "KeyU"
        }
    },
    {
        name: "Strikethrough",
        action: Action.makeStrikethrough,
        label: "CTRL + SHIFT + 5",
        shortcut: {
            special: [SpecialKey.controlMeta, SpecialKey.shift],
            standard: "Digit5"
        }
    },
    {
        name: "Indent",
        action: Action.indent,
        label: "TAB",
        shortcut: {
            special: [],
            standard: "Tab"
        }
    },
    {
        name: "Unindent",
        action: Action.unindent,
        label: "SHIFT + TAB",
        shortcut: {
            special: [SpecialKey.shift],
            standard: "Tab"
        }
    },
    {
        name: "Undo",
        action: Action.undo,
        label: "CTRL + Z",
        shortcut: {
            special: [SpecialKey.controlMeta],
            standard: "KeyZ"
        }
    },
    {
        name: "Redo",
        action: Action.redo,
        label: "CTRL + SHIFT + Z",
        shortcut: {
            special: [SpecialKey.controlMeta, SpecialKey.shift],
            standard: "KeyZ"
        }
    },
];

const defaultConfig: DeskConfig = {
    holder: "desk-editor",
    height: "1056px",
    width: "815px",
    pages: [],
    onPage: 1,
    onChange: (() => {}),
    spacing: "20px",
    margins: {
        "left": 15,
        "right": 15,
        "top": 15,
        "bottom": 15
    },
    baseShortcuts: defaultShortcuts,
    extraShortcuts: [],
    blockClass: "desk-block",
    pageClass: "desk-page",
    pageWrapperClass: "desk-page-wrapper",
    saveOnChange: false,
    genUID: uuid,
    debounceChanges: 500,
    sessionKey: false
};

export { defaultConfig, defaultShortcuts }