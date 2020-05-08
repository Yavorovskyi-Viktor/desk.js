// Internal imports
import PageData from "../types/PageData";
import DeskConfig from "../types/DeskConfig";
import * as Util from './Util';
// External imports
import Engine from "./Engine";

// The class name for a page in the DOM
const pageClass = "desk-page";

// The class name for a page wrapper in the DOM
const wrapperClass = "desk-page-wrapper";


class Page {
    /**
     * Create a new page
     *
     * @param config: The configuration of the desk
     * @param data: Any data that the page is being instantiated with
     */
    constructor(config: DeskConfig, data?: PageData){
        this.config = config;
        // If the page wasn't passed a UID, generate a v4 UUID
        if (data == undefined){
            this.id = config.genUID();
            this.initialBlocks = [];
        }
        else{
            this.id = data.id || config.genUID();
            this.initialBlocks = data.blocks || {};
        }
        this.shouldOverflow = false;
    }

    /**
     * Use inline styling for a page
     */
    private get CSS(): string {
        // set the height and width that were passed in from the configuration
        let styleString = `height: ${this.config.height}; width: ${this.config.width}; margin-bottom: ${this.config.spacing};`;
        // Assign a margin to each direction
        for (const dir of Object.keys(this.config.margins)){
            styleString += `padding-${dir}: ${this.config.margins[dir]}px;`;
        }
        return styleString;
    }

    public get domID(): string{
        return `desk-page-${this.id}`;
    }

    public get wrapperID(): string{
        return `desk-wrapper-${this.id}`;
    }

    /**
     * Render the blocks in a page, and bind an abstract page to the DOM.
     * Should only be called once per page per document
     *
     */
    public render(): HTMLElement{
        /**
         * Render in the page ID and CSS styles given by document defaults. Create a wrapper inside the page
         * which will have contenteditable enabled. Overflow will be detected when a the wrapper is larger than
         * the containing page
         * ---------------
         * |   Page      |
         * | -------------
         * | | Wrapper   |
         * | | --------- |
         * | | | Block | |
         * | | --------- |
         * | |           |
         * | ------------|
         * --------------|
         */
        if (this.pageHolder == undefined){
            // Create the main page
            this.pageHolder = Util.createElement('div', {
                "id": this.domID,
                "style": this.CSS,
                "class": pageClass
            });
        }
        if (this.contentWrapper == undefined){
            // Create the contenteditable wrapper
            this.contentWrapper = Util.createElement('div', {
                "id": this.wrapperID,
                "contenteditable": "true",
                "class": wrapperClass,
                // Disable the default content editable outline
                "style": "outline: 0px solid transparent;"
            });
            // Bind the event listener to this instance
            const onClick = this.onPageClick.bind(this);
            // Add a click listener so that when anywhere on the page is clicked it can be focused on
            this.pageHolder.addEventListener('click', onClick);
        }
        if (!this.pageHolder.hasChildNodes()){
            // Put the wrapper into the pageholder
            this.pageHolder.appendChild(this.contentWrapper);
        }
        if (!this.contentWrapper.hasChildNodes()){
            // Render the initial blocks
            const initialKeys = Object.keys(this.initialBlocks);
            if (this.initialBlocks != undefined && initialKeys.length != 0){
                for (let blockIdx of initialKeys){
                    this.insertBlock((+blockIdx), this.initialBlocks[blockIdx])
                }
            }
            else{
                this.newBlock();
            }
            // Set the current block
            this.currentBlockIdx = this.contentWrapper.children.length - 1;
        }
        return this.pageHolder;
    }

    private renderBlock(block?: string): HTMLElement {
        // If there are ever any custom block data elements, handle those here
        const elem = Util.createElement('div', {
            "class": this.config.blockClass
        });
        if (block != undefined){
            elem.innerHTML = block;
        }
        return elem;
    }


    /**
     * Set the block at a particular index to the given data
     *
     * @param index The index that the block exists at
     * @param data The data
     */
    private setBlock(index: number, data?: string){
        let content;
        if (data == undefined){
            content = '';
        }
        else {
            content = data || '';
        }
        this.contentWrapper.children[index].innerHTML = content;
    }

    private dedupeTraverse(children: HTMLCollection){
       Array.from(children).forEach((c: Element) => {
           let child = c as HTMLElement;
           // Is this child a duplicate block?
           if (child.classList.contains(this.config.blockClass)){
               // Does it have child nodes?
               if (child.hasChildNodes()){
                   // If it does, start by deduping each of it's children, if it has children. The case where
                   // it has children by not child nodes is where it has only text elements, in which case we don't
                   // need to dedupe
                   if (child.children.length != 0){
                       this.dedupeTraverse(child.children);
                   }
                   // Replace it with its child nodes, which will be in a list, because Typescript doesn't know
                   // that childNodes are iterable
                   const childNodes = [];
                   child.childNodes.forEach((n)=> childNodes.push(n));
                   child.replaceWith(...childNodes);
               }
               else{
                   // If not, remove it from the document entirely
                   document.removeChild(child);
               }
           }
           else {
               // If the child (which is now guaranteed not to be a block), has children, dedupe them as well
               if (child.children.length != 0) {
                   this.dedupeTraverse(child.children);
               }
           }
        });
    }

    /**
     * Clean the blocks on the page by making sure that objects with a block class are a direct child of the
     * content wrapper, and that each child on the paeg is wrapped in a block class
     */
    public clean() {
        // Iterate through the current children on the page
        Array.from(this.contentWrapper.children).forEach((childAccess) => {
            let childElem = childAccess as HTMLElement;
            // Is the child a block?
            if (!childElem.classList || !childElem.classList.contains(this.config.blockClass)){
                // If not, wrap it in a block
                const newBlock = Util.createElement('div', {
                    "class": this.config.blockClass
                });
                childElem.parentNode.appendChild(newBlock);
                newBlock.appendChild(childElem);
                childElem = newBlock;
            }
            // Make sure that there are no duplicate block elements like contenteditable sometimes creates
            this.dedupeTraverse(childElem.children);
        });
    }

    /**
     * Insert a block as the next child onto the page
     *
     * @param data the block data to render
     */
    public newBlock(data?: string){
        // If there's no content in the data, insert a zero width character, because otherwise Chrome won't put the
        // cursor into it. This will be removed by the formatting engine as soon as there are characters in the block
        if (data == undefined){
            data = "&#8203;";
        }
        else {
            data = data || "&#8203;";
        }
        this.contentWrapper.appendChild(this.renderBlock(data));
    }

    /**
     * Insert a block at a given place in the page
     *
     * @param index The index to insert the block at
     * @param data The block data
     */
    public insertBlock(index: number, data?: string){
        this.countWords();
        // Get the current number of children on the page. Note that this is a length, so 1 more than the index
        const numChildren = this.contentWrapper.children.length;
        // If the index is one more than the current number of block children, insert it as the next item onto the page
        if (index === numChildren){
            this.newBlock(data);
        }
        // If the index is less than or equal to the current number of block children, shift blocks to create this new block
        else if (index < numChildren){
            const prevChild = this.contentWrapper.children[index];
            prevChild.insertAdjacentElement('beforebegin', this.renderBlock(data));
        }
        // Otherwise, if the index hasn't been reached yet, create empty new blocks until we've either
        // reached the end of the page (index was invalid), or until the index is the next child
        else {
            let causedOverflow = false;
            while (this.contentWrapper.children.length > index && !causedOverflow){
                // Check if the page is going to overflow
                if (this.isOverflowing){
                    console.error(`Caused page to overflow while expanding to index ${index}, stopping`);
                    causedOverflow = true;
                }
                else {
                    // Create a blank line
                    this.newBlock();
                }
            }
            if (!causedOverflow){
                // If we didn't cause an overflow, finally create the block that was passed in
                this.newBlock(data);
            }
        }
    }

    public focus(){
        this.contentWrapper.focus();
        if (this.currentBlockIdx != undefined){
            const currentBlock = this.currentBlock;
            if (currentBlock.children.length > 0){
                const setChild = this.currentBlock.children[this.currentBlock.children.length - 1] as HTMLElement;
                const range = document.createRange();
                range.selectNodeContents(setChild);
                range.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
            else {
                Engine.set(this.currentBlock);
            }
        }
    }

    public getBlock(i: number): HTMLElement{
        return this.contentWrapper.children[i] as HTMLElement;
    }

    public get blocks(){
        return this.contentWrapper.children;
    }

    private onPageClick(e){
        this.contentWrapper.focus();
    }

    /**
     * Check the height of the wrapper and the main page, and see if the content needs to break into a new page
     */
    public get isOverflowing(): boolean {
        const bottom = this.pageBottom;
        const lastElem = this.contentWrapper.children[this.contentWrapper.children.length - 1];
        if (lastElem == undefined){
            return false;
        }
        else {
            return lastElem.getBoundingClientRect().bottom >= bottom;
        }
    }


    public get currentBlock(): HTMLElement {
        if (this.currentBlockIdx == undefined){
            this.currentBlockIdx = 0;
        }
        if (this.contentWrapper.children.length > 0){
            return this.contentWrapper.children[this.currentBlockIdx] as HTMLElement;
        }
        else{
            console.error(`Error: content wrapper for page ${this.id} has no child nodes. This isn't supposed to happen`);
            return undefined;
        }
    }

    public get pageBottom(): number {
        return this.pageHolder.getBoundingClientRect().bottom - this.config.margins.bottom;
    }

    public countWords() {
        let wC = 0;
        for (let childG in this.contentWrapper.children){
            let child = this.contentWrapper.children[childG];
            if (child && child.textContent) {
                let words = this.contentWrapper.children[childG].textContent.split(" ");
                words.forEach((word) => {
                    // We don't want to count spaces or zero-width characters as words
                    if (word && word != " " && word.length > 0){
                        // Check for a zero width character
                        if (word.charCodeAt(0) != 8203){
                            wC++;
                        }
                    }
                })
            }
        }
        this.wordCount = wC;
    }

    public pageHolder: HTMLElement;
    public contentWrapper: HTMLElement;
    public currentBlockIdx: number;
    public id: string;
    public shouldOverflow: boolean;
    public wordCount: number;
    private config: DeskConfig;
    private initialBlocks: { [index: number]: string };
}

export default Page;

export { pageClass, wrapperClass };