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

    public serialize(): PageData{
        // Serialize all the page blocks
        let serializedBlocks = [];
        this.blocks.forEach(function(block: Block){
           serializedBlocks.push(block.serialize());
        });
        return {
            uid: this.uid,
            blocks: serializedBlocks
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
            // Add an event listener to check if the content wrapper height ever exceeds the height of the page holder
            this.lastValidCharIdx = 0;
            // Add a click listener so that when anywhere on the page is clicked it can be focused on
            this.pageHolder.addEventListener('click', onClick);
        }
        if (!this.pageHolder.hasChildNodes()){
            // Put the wrapper into the pageholder
            this.pageHolder.appendChild(this.contentWrapper);
        }
        // TODO: render blocks here
        return this.pageHolder;
    }

    public focus(){
        this.contentWrapper.focus();
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

    /**
     * Set the text of the page to a string
     * @param s: string
     */
    public setText(s: string){
        this.contentWrapper.innerText = s;
        this.doOverflowCheck();
    }

    public truncateText(i: number): string {
        const initialText = this.contentWrapper.innerText;
        const sliced = initialText.slice(i+1);
        this.contentWrapper.innerText = initialText.slice(0, i + 1);
        return sliced;
    }

    public newBlock(data?: BlockData): Block{
        const newBlock = new Block(this.config, data);
        this.blocks.push(newBlock);
        return newBlock;
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
    private blocks: Block[];
    private config: DeskConfig;

    // A class variable to keep track of the index of the last character typed on the page. Will be useful for
    // page breaks
    private lastValidCharIdx: number;
}

export default Page;