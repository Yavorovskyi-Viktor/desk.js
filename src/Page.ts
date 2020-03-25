// Internal imports
import Block from "./Block";
import PageData from "../types/PageData";
import BlockData from "../types/BlockData";
import DeskConfig from "../types/DeskConfig";
import * as Util from './Util';


// External imports
import { v4 } from 'uuid';


// The class name for a page in the DOM
const pageClass = "desk-page";

// The class name for a page wrapper in the DOM
const wrapperClass = "desk-page-wrapper";

class Page {

    constructor(config: DeskConfig, data?: PageData){
        this.config = config;
        // If the page wasn't passed a UID, generate a v4 UUID
        if (data == undefined){
            this.uid = v4();
        }
        else{
            this.uid = data.uid;
        }
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
        let styleString = `height: ${this.config.height}; width: ${this.config.width};`;
        // Assign a margin to each direction
        console.log("Have config", this.config);
        for (const dir of Object.keys(this.config.margins)){
            styleString += `padding-${dir}: ${this.config.margins[dir]};`;
        }
        return styleString;
    }

    public get domID(): string{
        return `desk-page-${this.uid}`;
    }

    public get wrapperID(): string{
        return `desk-wrapper-${this.uid};`
    }

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
            const onInput = this.onInput.bind(this);
            // Add an event listener to check if the content wrapper height ever exceeds the height of the page holder
            this.contentWrapper.addEventListener("input", onInput);
        }
        if (!this.pageHolder.hasChildNodes()){
            // Put the wrapper into the pageholder
            this.pageHolder.appendChild(this.contentWrapper);
        }
        // TODO: render blocks here
        return this.pageHolder;
    }


    private renderBlocks(){

    }

    private onInput(){
        console.log(`Got input for page ${this.uid}`);
    }

    private pageHolder: HTMLElement;
    private contentWrapper: HTMLElement;
    private blocks: Block[];
    private renderedBlocks: { [index: number]: HTMLElement };
    private config: DeskConfig;
    private uid: string;
}

export default Page;