// Internal imports
import EditorAction, {Action} from "../types/EditorAction";
import {KeyboardShortcut, Shortcut, SpecialKey} from "../types/KeyboardShortcut";
import DeskConfig from "../types/DeskConfig";
import Page from "./Page";
import DeskSnapshot from "../types/DeskSnapshot";

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
                Engine.incompatibleBrowser(p);
                this.markedIncompatible = true;
            }
            return;
        }
        // Determine if a keyboard shortcut has been activated
        const shortcut = this.matchShortcut(e);
        if (shortcut){
            console.log(`Triggering shortcut ${shortcut.name}`);
            this.executeAction({action: shortcut.action, detail: {}});
            e.preventDefault();
            return;
        }
        // Prevent the user from deleting the initial block
        if (e.key == "Backspace" && p.contentWrapper.childNodes.length == 1){
            const firstChild = p.contentWrapper.firstChild as HTMLElement;
            if (firstChild.innerText.length == 0 || (firstChild.innerText.length == 1 &&
                    firstChild.innerText == "&#8203;")){
                e.preventDefault();
            }
        }
    }

    /**
     * Walk the DOM tree to recursively find out if child is an ancestor of parent
     * @param child The child element
     * @param parent The parent element in question
     */
    public static isParent(child: HTMLElement, parent: HTMLElement): boolean{
        // Stop when we hit the page wrapper
        if (child.parentElement.classList.contains("page-wrapper")){
            return false;
        }
        else {
            if (child.parentElement == parent){
                return true;
            }
            else {
                return this.isParent(child, parent);
            }
        }
    }

    public handleMutation(mutationsList: MutationRecord[], p: Page){
        // Determine if the page is overflowing
        if (p.isOverflowing){
            const nextPageItems = [];
            const pageBottom  = p.pageBottom;
            console.log(`Overflowing, page bottom is ${pageBottom} nodes:`);
            for (let childIdx in p.contentWrapper.children) {
                const child = p.contentWrapper.children.item((+childIdx));
                const rects = child.getBoundingClientRect();
                // Check to see if the element is fully under the page
                if (rects.bottom >= pageBottom){
                    if (rects.top >= pageBottom){
                        console.log("Overflow type: full");
                        let newChild = document.removeChild(child);
                        nextPageItems.push(newChild);
                    }
                    else{
                        console.log("Overflow type: partial");
                        const collectedMutationText = [];
                        mutationsList.forEach(function(mutation){
                           if (mutation.type == "characterData"){
                               if (Engine.isParent(mutation.target as HTMLElement, child as HTMLElement)) {
                                   // Collect the previous value for character data. If there was an old value, we need to
                                   // compute what to put on the new page. Otherwise, we can just put the entire paragraph
                                   // on the new page
                                   if (mutation.oldValue) {
                                       // Figure out where the text broke
                                       const oldLength = mutation.oldValue.length;
                                       const splitIndex = oldLength - 1;
                                       // Extract the contents of the text past where it broke
                                       const range = document.createRange();
                                       range.setStart(mutation.target, splitIndex);
                                       range.setEndAfter(mutation.target);
                                       collectedMutationText.push(range.extractContents());
                                   } else {
                                       let newChild = document.removeChild(child);
                                       nextPageItems.push(newChild);
                                   }
                               }
                            }
                        });
                        console.log(collectedMutationText);
                    }
                }
            }
        }
    }


    /**
     * (This function is a modified version of the one used for this same purpose by the excellent project editor.js
     * in caret.ts, https://github.com/codex-team/editor.js/blob/master/src/components/modules/caret.ts). Thank you
     * editor.js! This saved me a lot of pain
     *
     * Creates Document Range and sets caret to the element with offset
     *
     * @param {HTMLElement} element - target node.
     * @param {Number} offset - offset
     */
    public static set(element: HTMLElement, offset: number = 0): void {
        const range = document.createRange(),
            selection = window.getSelection();

        range.setStart(element, offset);
        range.setEnd(element, offset);

        selection.removeAllRanges();
        selection.addRange(range);

        /** If new cursor position is not visible, scroll to it */
        const {top, bottom} = element.nodeType === Node.ELEMENT_NODE
            ? element.getBoundingClientRect()
            : range.getBoundingClientRect();
        const {innerHeight} = window;

        if (top < 0) { window.scrollBy(0, top); }
        if (bottom > innerHeight) { window.scrollBy(0, bottom - innerHeight); }
    }

    private static incompatibleBrowser(p: Page){
        console.error("This browser is not compatible with the desk editor. Please update to a newer browser");

    }

    private markedIncompatible: boolean = false;
    private shortcuts: Shortcut[];
    private config: DeskConfig;
}



export { defaultShortcuts };

