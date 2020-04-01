// Internal imports
import PageData from "../types/PageData";
import DeskConfig from "../types/DeskConfig";
import * as Util from './Util';
// External imports
import Engine from "./Engine";
import BlockData from "../types/BlockData";
import {uuid} from "./Util";


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
            this.uid = uuid();
            this.initialBlocks = [];
        }
        else{
            this.uid = data.uid;
            this.initialBlocks = data.blocks || {};
        }

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
                    this.setBlock((+blockIdx), this.initialBlocks[blockIdx])
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

    private renderBlock(block?: BlockData): HTMLElement {
        // If there are ever any custom block data elements, handle those here
        const elem = Util.createElement('div', {
            "class": this.config.blockClass
        });
        if (block != undefined){
            elem.innerHTML = block.content;
        }
        return elem;
    }


    /**
     * Set the block at a particular index to the given data
     *
     * @param index The index that the block exists at
     * @param data The data
     */
    private setBlock(index: number, data?: BlockData){
        let content;
        if (data == undefined){
            content = '';
        }
        else {
            content = data.content || '';
        }
        this.contentWrapper.children[index].innerHTML = content;
    }

    /**
     * Insert a block as the next child onto the page
     *
     * @param data the block data to render
     */
    private newBlock(data?: BlockData){
        // If there's no content in the data, insert a zero width character, because otherwise Chrome won't put the
        // cursor into it. This will be removed by the formatting engine as soon as there are characters in the block
        if (data == undefined){
            data = {content: "&#8203;"};
        }
        else {
            data.content = data.content || "&#8203;";
        }
        this.contentWrapper.appendChild(this.renderBlock(data));
    }

    /**
     * Insert a block at a given place in the page
     *
     * @param index The index to insert the block at
     * @param data The block data
     */
    private insertBlock(index: number, data?: BlockData){
        // Render the block into an HTML element
        const block = this.renderBlock(data);
        // Get the current number of children on the page. Note that this is a length, so 1 more than the index
        const numChildren = this.contentWrapper.children.length;
        // If the index is one more than the current number of block children, insert it as the next item onto the page
        if (index === numChildren){
            this.newBlock(data);
        }
        // If the index is less than or equal to the current number of block children, modify an existing block
        else if (index < numChildren){
            this.setBlock(index, data);
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
        if (this.currentBlockIdx != undefined){
            Engine.set(this.currentBlock);
        }
        this.contentWrapper.focus();
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
        return lastElem.getBoundingClientRect().bottom >= bottom;
    }

    public get currentBlock(): HTMLElement {
        if (this.currentBlockIdx == undefined){
            this.currentBlockIdx = 0;
        }
        if (this.contentWrapper.children.length > 0){
            return this.contentWrapper.children[this.currentBlockIdx] as HTMLElement;
        }
        else{
            console.error(`Error: content wrapper for page ${this.uid} has no child nodes. This isn't supposed to happen`);
            return undefined;
        }
    }

    public get pageBottom(): number {
        return this.pageHolder.getBoundingClientRect().bottom - this.config.margins.bottom;
    }

    private pageHolder: HTMLElement;
    public contentWrapper: HTMLElement;
    public currentBlockIdx: number;
    public uid: string;
    private config: DeskConfig;
    private initialBlocks: { [index: number]: BlockData };
}

export default Page;