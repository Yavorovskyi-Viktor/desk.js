// Internal imports
import EditorAction, {Action} from "../types/EditorAction";
import {KeyboardShortcut, Shortcut, SpecialKey} from "../types/KeyboardShortcut";
import DeskConfig from "../types/DeskConfig";
import Page from "./Page";
import { createElement } from './Util';
import DeskSnapshot from "../types/DeskSnapshot";
import BlockData from "../types/BlockData";

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

class Change {
    constructor(page: Page, blocks: Set<number>){
        this.page = page;
        this.blocks = blocks;
    }

    public fireChange(){
        this.page.contentWrapper.dispatchEvent(new CustomEvent('change', {
            detail: {
                page: this.page,
                blocks: Array.from(this.blocks)
            }
        }));
    }

    public page: Page;
    public blocks: Set<number>
}

class TransitNode {
    constructor(e: Element){
        this.tagName = e.tagName;
        this.attributes = e.attributes;
    }

    public createNode(){
        return createElement(this.tagName, this.attributes);
    }
    public createWithChild(child: Element){
        const nodeElem = this.createNode();
        nodeElem.appendChild(child);
        return nodeElem;
    }


    private readonly tagName: string;
    private readonly attributes: Object;
}

export default class Engine {
    constructor(config: DeskConfig){
        this.config = config;
        this.pendingBlockChanges = {};
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
    public static executeAction(action: EditorAction){
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
            Engine.executeAction({action: shortcut.action, detail: {}});
            e.preventDefault();
            return;
        }
    }

    /**
     * Walk the DOM tree to recursively find out if child is an ancestor of parent
     * @param child The child element
     * @param parent The parent element in question
     */
    public static isParent(child: HTMLElement, parent: HTMLElement): boolean{
        if (child.parentElement == undefined){
            return false;
        }
        // Stop when we hit the page wrapper
        else if (child.parentElement.classList != undefined && child.parentElement.classList.contains("page-wrapper")){
            return false;
        }
        else {
            if (child.parentElement == parent){
                return true;
            }
            else {
                return this.isParent(child.parentElement, parent);
            }
        }
    }

    public getTags(e): TransitNode[]{
        const parent = e.parentElement;
        if (parent == undefined){
            return [];
        }
        else {
            if (parent.classList.contains(this.config.blockClass)){
                return [];
            }
            else {
                return [...this.getTags(parent), new TransitNode(parent)];
            }
        }
    }

    public wrapTags(tags: TransitNode[]): Element{
        if (tags.length == 0){
            return null;
        }
        else {
            const currentTag: TransitNode = tags.pop();
            if (tags.length == 0){
                return currentTag.createNode();
            }
            else {
                return currentTag.createWithChild(this.wrapTags(tags))
            }
        }
    }

    public findBlock(e: HTMLElement){
        if (e.classList != undefined && e.classList.contains(this.config.blockClass)) {
            return e;
        }
        else if (e.classList != undefined && e.classList.contains("page-wrapper") || (e.id == this.config.holder)){
            // If we've hit the wrapper or the holder, this isn't a block level element
            return false;
        }
        else if (e.parentElement == undefined) {
            console.error("Couldn't find a parent element for block, malformed document", e);
            return false;
        }
        else {
            return this.findBlock(e.parentElement);
        }
    }

    private doOverflowCheck(mutationsList: MutationRecord[], p: Page){
        const nextPageItems: BlockData[] = [];
        const pageBottom  = p.pageBottom;
        console.log(`Overflowing, page bottom is ${pageBottom} nodes:`);
        for (let childIdx in p.contentWrapper.children) {
            const child = p.contentWrapper.children.item((+childIdx));
            const rects = child.getBoundingClientRect();
            // Check to see if the element is fully under the page
            if (rects.bottom >= pageBottom){
                if (rects.top >= pageBottom){
                    let newChild = p.contentWrapper.removeChild(child);
                    nextPageItems.push({content: newChild.innerHTML});
                }
                else{
                    const collectedMutationText = [];
                    const getTags = this.getTags.bind(this);
                    const wrapTags = this.wrapTags.bind(this);
                    mutationsList.forEach(function(mutation){
                        if (mutation.type == "characterData"){
                            if (Engine.isParent(mutation.target as HTMLElement, child as HTMLElement)) {
                                // Collect the previous value for character data. If there was an old value, we need to
                                // compute what to put on the new page. Otherwise, we can just put the entire paragraph
                                // on the new page
                                if (mutation.oldValue) {
                                    // Figure out where the text broke
                                    const oldLength = mutation.oldValue.length;
                                    let splitIndex = oldLength - 1;
                                    // Keep going back until we hit the beginning of the page and
                                    while (splitIndex > 0 && mutation.target.textContent[splitIndex] != " "){
                                        splitIndex--;
                                    }
                                    const range = document.createRange();
                                    range.setStart(mutation.target, splitIndex);
                                    range.setEndAfter(mutation.target);
                                    // Get the plain text that needs to go onto the next page
                                    const plainText = range.extractContents().textContent;
                                    // Get the tags and attributes that the text needs to be wrapped in
                                    const nodeTags = getTags(mutation.target);
                                    let textElem;
                                    if (nodeTags.length > 0){
                                        // Wrap the text in those tags
                                        textElem = wrapTags(nodeTags);
                                        textElem.innerText = plainText;
                                    }
                                    else {
                                        textElem = plainText;
                                    }
                                    collectedMutationText.push(textElem);
                                } else {
                                    let newChild = document.removeChild(child);
                                    nextPageItems.push({content: newChild.innerHTML});
                                }
                            }
                        }
                    });
                    if (collectedMutationText.length > 0){
                        const mutationElement = createElement('div', {
                            "class": this.config.blockClass
                        });
                        collectedMutationText.forEach(function(f){
                            if (typeof(f) == "string"){
                                mutationElement.innerText += f;
                            }
                            else {
                                mutationElement.appendChild(f);
                            }
                        });
                        mutationElement.normalize();
                        nextPageItems.push({content: mutationElement.innerHTML});
                    }
                    else {
                        // If we can't get the text mutation, just push the whole block onto the next page
                        let newChild = p.contentWrapper.removeChild(child);
                        nextPageItems.push({content: newChild.innerHTML});
                    }
                }
            }
        }
        const event = new CustomEvent('overflow', {detail: nextPageItems});
        p.contentWrapper.dispatchEvent(event);
    }

    public onPaste(e: ClipboardEvent, p: Page){
        // A modified answer of Nico Burns's excellent SO answer on the subject,
        // https://stackoverflow.com/a/6804718
        const types = e.clipboardData.types;
        // Rewrite HTML pastes
        if (((types instanceof DOMStringList) && types.contains("text/html")) || (types.indexOf && types.indexOf('text/html') !== -1)) {

            // Extract data and pass it to callback
            const pastedData = e.clipboardData.getData('text/html');
            console.log("Got paste", pastedData);

            // Stop the data from actually being pasted
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
    }

    private debounceChange(ch: Change){
        // Determine whether debounce is configured
        if (this.config.debounceChanges){
            // Append pending block changes and debounce the event
            const pendingKeys = Object.keys(this.pendingBlockChanges);
            if (pendingKeys.includes(ch.page.uid)){
                for (let block of ch.blocks) {
                    this.pendingBlockChanges[ch.page.uid].blocks.add(block);
                }
            }
            else {
                this.pendingBlockChanges[ch.page.uid] = ch;
            }
            // Do the debounce
            clearTimeout(this.debounceTimeout);
            const after = () => {
                // Build a snapshot for each page that has pending changes
                for (let page of Object.keys(this.pendingBlockChanges)){
                    this.pendingBlockChanges[page].fireChange();
                    delete this.pendingBlockChanges[page];
                }
            };
            this.debounceTimeout = setTimeout(after, this.config.debounceChanges);
        }
        else {
            // If it's not, fire the change immediately
            ch.fireChange();
        }
    }

    public handleMutation(mutationsList: MutationRecord[], p: Page){
        // Determine if the page is overflowing
        if (p.isOverflowing){
            this.doOverflowCheck(mutationsList, p);
            return;
        }
        // Dispatch change events
        const foundBlocks = new Set<number>();
        const children = Array.from(p.contentWrapper.children);
        for (let mutation of mutationsList){
            const target = mutation.target as HTMLElement;
            const blockParent = this.findBlock(target);
            if (blockParent){
                foundBlocks.add(children.indexOf(blockParent));
            }
        }
        if (foundBlocks.size != 0){
            this.debounceChange(new Change(p, foundBlocks));
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

    private pendingBlockChanges: { [uid: string]: Change };
    private debounceTimeout: number;
    private markedIncompatible: boolean = false;
    private shortcuts: Shortcut[];
    private config: DeskConfig;
}



export { defaultShortcuts };

