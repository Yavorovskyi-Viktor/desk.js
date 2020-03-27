// Internal imports
import EditorAction, {Action} from "../types/EditorAction";
import {KeyboardShortcut, Shortcut, SpecialKey} from "../types/KeyboardShortcut";
import DeskConfig from "../types/DeskConfig";
import Page from "./Page";
import {BlockType} from "../types/BlockData";

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

export default class Engine {
    constructor(config: DeskConfig){
        this.config = config;
        this.compileShortcuts();
    }

    compileShortcuts(){
        // If the special key arrays in the keyboard shortcuts are pre-sorted, sort time can be saved on every keypress
        this.shortcuts = this.config.baseShortcuts.concat(this.config.extraShortcuts);
        for (let shortcut of this.shortcuts){
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
        // of special keys. Additionally, treat "TAB" as a special key
        if ((e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) || (e.code == "Tab")){
            // Check to see which special keys are pressed
            let special: SpecialKey[] = [];
            if (e.ctrlKey || e.metaKey){
                special.push(SpecialKey.controlMeta);
            }
            if (e.shiftKey){
                special.push(SpecialKey.shift);
            }
            if (e.altKey){
                special.push(SpecialKey.alt);
            }
            special = special.sort();
            // Compare each stored shortcut against the configuration shortcuts
            for (let shortcut of this.shortcuts){
                // Check to see if the length of the shortcut special keys matches the found special keys
                if (shortcut.shortcut.special.length == special.length){
                    // Before doing a potentially somewhat expensive list comparison, check to see if the standard
                    // key property is the same
                    if (shortcut.shortcut.standard == e.code){
                        // Compare the special key lists
                        if (special.every((value, index) => value === shortcut.shortcut.special[index])){
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

    /**
     * Apply an editor action to an HTML target
     *
     * @param action the action to apply
     */
    public executeAction(action: EditorAction){
        switch(action.action) {
            case (Action.makeBold):
                document.execCommand('bold');
                break;
            case (Action.makeItalic):
                document.execCommand('italic');
                break;
            case (Action.makeUnderline):
                document.execCommand('underline');
                break;
            case (Action.makeStrikethrough):
                document.execCommand('strikeThrough');
                break;
            case (Action.makeHighlight):
                document.execCommand('hilitecolor', false, action.detail["color"]);
                break;
            case (Action.makeColor):
                document.execCommand('forecolor', false, action.detail["color"]);
                break;
            case (Action.makeFontName):
                document.execCommand('fontName', false, action.detail["font"]);
                break;
            case (Action.makeFontSize):
                document.execCommand('fontSize', false, action.detail["size"]);
                break;
            case (Action.alignLeft):
                document.execCommand('justifyLeft');
                break;
            case (Action.alignCenter):
                document.execCommand('justifyCenter');
                break;
            case (Action.alignRight):
                document.execCommand('justifyRight');
                break;
            case (Action.alignJustify):
                document.execCommand('justifyFull');
                break;
            case (Action.indent):
                document.execCommand('indent');
                break;
            case (Action.unindent):
                document.execCommand('outdent');
                break;
            case (Action.makeNumberList):
                document.execCommand('insertOrderedList');
                break;
            case (Action.makeBulletList):
                document.execCommand('insertUnorderedList');
                break;
            case (Action.makeHeading):
                document.execCommand('heading', false, `h${action.detail["level"]}`);
                break;
            case (Action.makeSubscript):
                document.execCommand('subscript');
                break;
            case (Action.makeSuperscript):
                document.execCommand('superscript');
                break;
            case (Action.undo):
                document.execCommand('undo');
                break;
            case (Action.redo):
                document.execCommand('redo');
                break;
            case (Action.pasteWithFormatting):
                break;
            case (Action.pasteWithoutFormatting):
                break;
            case (Action.doPrint):
                break;
            case (Action.save):
                break;
        }
    }

    /**
     * Handle a keydown event from any page in the document. Check relevant keyboard shortcuts, manage block
     * positioning, and trigger actions
     *
     * @param e: The event caused by the keydown
     * @param p: The page that the keydown happened on
     */
    public onKeydown(e: KeyboardEvent, p: Page){

        // In older browsers where the e.key property isn't defined, show an incompatible message in the editor
        if (e.key === undefined){
            if (!this.markedIncompatible){
                this.incompatibleBrowser(p);
                this.markedIncompatible = true;
            }
            return;
        }

        // Determine if a keyboard shortcut has been activated
        const shortcut = this.matchShortcut(e);
        const target = e.target as HTMLElement;
        if (shortcut){
            console.log(`Triggering shortcut ${shortcut.name}`);
            this.executeAction({action: shortcut.action, detail: {}});
            e.preventDefault();
            return;
        }
        // Check for Enter, on which a new blank space should be created
        else if (e.key == "Enter"){
            const blankLine = p.newBlock({type: BlockType.Whitespace}).render();
            document.execCommand('insertHTML', false, blankLine.outerHTML);
            e.preventDefault();
            return;
        }
        // Check if the key target is a block. If not, create a new block, and set the target to it.
        else if (!target.lastElementChild || target.lastElementChild.className != this.config.blockClass){
            // Determine if the key is printable
            if (e.key.length === 1){
                const newTarget = p.newBlock({type: BlockType.Paragraph, content: e.key}).render();
                document.execCommand('insertHTML', false, newTarget.outerHTML);
                e.preventDefault();

            }
            return;
        }
    }

    private incompatibleBrowser(p: Page){
        document.execCommand('insertHTML', false,
                            '<div>Incompatible Browser</h2><p>Please upgrade to a newer version of your ' +
                                        'browser</p></div>');
    }

    private markedIncompatible: boolean = false;
    private shortcuts: Shortcut[];
    private config: DeskConfig;
}



export { defaultShortcuts };

