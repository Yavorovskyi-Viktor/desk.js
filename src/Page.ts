// Internal imports
import Block from "./Block";
import PageData from "../types/PageData";
import DeskConfig from "../types/DeskConfig";
import * as Util from './Util';
// External imports
import {v4} from 'uuid';
import Engine from "./Engine";
import BlockData from "../types/BlockData";


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
            this.uid = v4();
        }
        else{
            this.uid = data.uid;
        }
        // TODO: add a method to get these from serialized data
        this.blocks = [];
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
        return `desk-page-${this.uid}`;
    }

    public get wrapperID(): string{
        return `desk-wrapper-${this.uid}`;
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
            // Add an event listener to check if the content wrapper height ever exceeds the height of the page holder
            this.lastValidCharIdx = 0;
            // Add a click listener so that when anywhere on the page is clicked it can be focused on
            this.pageHolder.addEventListener('click', onClick);
        }
        if (!this.pageHolder.hasChildNodes()){
            // Put the wrapper into the pageholder
            this.pageHolder.appendChild(this.contentWrapper);
        }
        if (!this.contentWrapper.hasChildNodes()){
            // Render the initial blocks
            const initialBlockElements: HTMLElement[] = [];
            if (this.blocks != undefined && this.blocks.length != 0){
                for (let block of this.blocks){
                    initialBlockElements.push(block.render());
                }
            }
            else{
                // If there are no initial blocks specified, create an empty one. Note: this needs to have a zero-width
                // character in it, or else the cursor won't display in Chrome, **because the way chrome treats
                // contenteditable documents is broken!!**
                initialBlockElements.push(this.newBlock({content: "&#8203;"}).render());
            }
            // Set the current block
            this.currentBlockIdx = this.blocks.length - 1;
            // Put the initial blocks on the page
            for (let blockElem of initialBlockElements){
                this.contentWrapper.appendChild(blockElem);
            }
        }
        return this.pageHolder;
    }

    public focus(){
        this.contentWrapper.focus();
    }

    public setCursor(block?: Block){
        const range = document.createRange();
        const sel = window.getSelection();
        let useBlock: Block;
        if (block == undefined){
            const currentBlock = this.currentBlock;
            if (currentBlock instanceof Block){
                console.log("Using current block", currentBlock);
                useBlock = currentBlock;
            }
            else{
                console.error("setCursor called without block and with uninitialized currentBlock");
                return;
            }
        }
        else{
            console.log("Using passed block");
            useBlock = block;
        }
        // This call to render should be fine, since blocks internally cache their render state
        const lastNode = useBlock.render();
        range.setStart(lastNode, lastNode.innerText.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        this.focus();
    }

    private onPageClick(e){
        this.focus();
    }


    /**
     * Check the height of the wrapper and the main page, and see if the content needs to break into a new page
     */
    private get isOverflowing(): boolean {
        return (this.contentWrapper.offsetHeight >= (this.pageHolder.offsetHeight - this.config.margins.bottom));
    }

    private onInput(e){
        if (this.doOverflowCheck()){
            e.preventDefault();
        }
        else{
            this.lastValidCharIdx = this.contentWrapper.innerText.length;
        }
    }


    private doOverflowCheck(): boolean{
        if (this.isOverflowing){
            console.log("Overflow! Need to do page break", this.lastValidCharIdx);
            const overflow = new CustomEvent('overflow', { detail: this.lastValidCharIdx });
            this.pageHolder.dispatchEvent(overflow);
        }
        else{
            return false;
        }
    }

    public truncateText(i: number): string {
        const initialText = this.contentWrapper.innerText;
        const sliced = initialText.slice(i+1);
        this.contentWrapper.innerText = initialText.slice(0, i + 1);
        return sliced;
    }

    public newBlock(data?: BlockData): Block{
        console.log("Creating block");
        const newBlock = new Block(this.config, data);
        this.blocks.push(newBlock);
        this.currentBlockIdx = this.blocks.length - 1;
        return newBlock;
    }

    /**
     * Insert a block onto the page
     *
     * @param position the **index** (not block number!) to insert the block at
     * @param block the block to insert
     */
    public insertBlock(position: number, block: Block){
        if (position === this.blocks.length){
            this.blocks.push(block);
        }
        else{
             this.blocks.splice(position, 0, block);
        }
        // Actually add the block onto the page
        const previousBlock: Block = this.blocks[position-1];
        // Use the render cache to find the element of the previous block, and insert the block after it in the DOM
        previousBlock.render().insertAdjacentElement('afterend', block.render());
    }

    /**
     * Create a new block, insert it into the page, and set it as the current block
     */
    public newLine(data?: BlockData){
        // Figure out where to put the block
        let insertIdx;
        if (this.currentBlockIdx == undefined){
            insertIdx = this.blocks.length;
        }
        else{
            insertIdx = this.currentBlockIdx + 1;
        }
        // If the block doesn't already have content, put a zero width character in it, because **Chrome is broken!**
        if (data == undefined){
            data = {content: "&#8203;"}
        }
        else{
            data.content =data.content || "&#8203;";
        }
        // Create the new block
        const lineBlock = new Block(this.config, data);
        // Push it onto the page
        this.insertBlock(insertIdx, lineBlock);
        // Set the current block
        this.currentBlockIdx = insertIdx;
        // Set the cursor to the block
        Engine.set(lineBlock.render());
    }

    public deleteBlock(block: Block | number | string){
        let filterPred;
        const blockType = typeof(block);
        if (block instanceof Block){
            filterPred = (b: Block) => b !== block;
        }
        else if (blockType == "number"){
            // Don't bother filtering if we're passed an index
            this.blocks.splice(block as number - 1, 1);
            return;
        }
        else if (blockType == "string"){
            filterPred = (b: Block) => b.uid !== block;
        }
        else{
            console.error(`Unsupported block type ${blockType} for deleteBlock call`, block);
            return;
        }
        this.blocks = this.blocks.filter(filterPred);
    }

    public get currentBlock(): Block | false {
        if (this.currentBlockIdx == undefined){
            this.currentBlockIdx = 0;
        }
        if (this.blocks.length > this.currentBlockIdx){
            return this.blocks[this.currentBlockIdx];
        }
        else{
            return false;
        }
    }

    private pageHolder: HTMLElement;
    public contentWrapper: HTMLElement;
    public currentBlockIdx: number;
    public uid: string;
    public blocks: Block[];
    private config: DeskConfig;

    // A class variable to keep track of the index of the last character typed on the page. Will be useful for
    // page breaks
    private lastValidCharIdx: number;
}

export default Page;