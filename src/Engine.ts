// Internal imports
import EditorAction, { Action } from "../types/EditorAction";
import { KeyboardShortcut, Shortcut, SpecialKey } from "../types/KeyboardShortcut";
import DeskConfig from "../types/DeskConfig";

const defaultShortcuts: Shortcut[] = [
    {
        name: "Bold",
        action: Action.makeBold,
        label: "CTRL + B",
        shortcut: {
            special: [SpecialKey.control],
            standard: "KeyB"
        }
    },
    {
        name: "Italic",
        action: Action.makeItalic,
        label: "CTRL + I",
        shortcut: {
            special: [SpecialKey.control],
            standard:  "KeyI"
        }
    }
];

const specialKeyMappings = {
    "ctrlKey": SpecialKey.control,
    "shiftKey": SpecialKey.shift,
    "altKey": SpecialKey.alt,
    "metaKey": SpecialKey.meta
};

const sKeys = Object.keys(specialKeyMappings);

export default class Engine {
    constructor(config: DeskConfig){
        this.config = config;
        this.compileShortcuts();
    }

    compileShortcuts(){
        // If the special key arrays in the keyboard shortcuts are pre-sorted, sort time can be saved on every keypress
        for (let shortcut of this.config.shortcuts){
            shortcut.shortcut.special = shortcut.shortcut.special.sort();
        }
    }

    /**
     * Check if the current keypress triggered a keyboard shortcut
     *
     * @param e: The event for the key that was pressed
     */
    matchShortcut(e: KeyboardEvent): Shortcut | false {
        // Since this loop has to run on every 'keydown' event, try to short circuit it before getting the enum values
        // of special keys
        if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey){
            // Check to see which special keys are pressed
            const special: SpecialKey[] = [];
            for (let s of sKeys){
                if (e[s]){
                    special.push(specialKeyMappings[s]);
                }
            }
            // Compare each stored shortcut against the configuration shortcuts
            for (let shortcut of this.config.shortcuts){
                // Check to see if the length of the shortcut special keys matches the found special keys
                if (shortcut.shortcut.special.length == special.length){
                    // Before doing a potentially somewhat expensive list comparison, check to see if the standard
                    // key property is the same
                    if (shortcut.shortcut.standard == e.code){
                        // Compare the special key lists
                        if (special.sort() == shortcut.shortcut.special){
                            return shortcut;
                        }
                    }
                }
            }
            // No shortcut was found
            return false;
        }
        else {
            return false;
        }
    }

    public onKeydown(e: KeyboardEvent){
        // Determine if a keyboard shortcut has been activated
        const shortcut = this.matchShortcut(e);
    }

    private config: DeskConfig;
}



export { defaultShortcuts };

