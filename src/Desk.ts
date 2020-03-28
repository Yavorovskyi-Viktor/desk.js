// Internal imports
import DeskConfig from "../types/DeskConfig";
import PageData from "../types/PageData";
import Page from './Page';
import Engine, { defaultShortcuts } from "./Engine";
import DeskSnapshot from "../types/DeskSnapshot";
import Block from "./Block";
import BlockData from "../types/BlockData";

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
    lineHeight: "20px"
};

export default class Desk{
    constructor(config: DeskConfig){
        if (config == undefined){
            config = defaultConfig
        }
        else{
            // Set configuration defaults. The default values for these are detailed in DeskConfig.ts
            config.holder = config.holder || defaultConfig.holder;
            config.height = config.height || defaultConfig.height;
            config.width = config.width || defaultConfig.width;
            config.pages = config.pages || defaultConfig.pages;
            config.onPage = config.onPage || defaultConfig.onPage;
            config.onChange = config.onChange || defaultConfig.onChange;
            config.margins = config.margins || defaultConfig.margins;
            config.spacing = config.spacing || defaultConfig.spacing;
            config.baseShortcuts = config.baseShortcuts || defaultConfig.baseShortcuts;
            config.extraShortcuts = config.extraShortcuts || defaultConfig.extraShortcuts;
            config.blockClass = config.blockClass || defaultConfig.blockClass;
            config.lineHeight = config.lineHeight || defaultConfig.lineHeight;
        }
        this.config = config;
        // Make sure that the holder element exists on the page
        this.editorHolder = document.getElementById(this.config.holder);
        if (this.editorHolder == null){
            console.error(`Couldn't find holder: ${config.holder}`)
        }

        this.pages = [];

        // Instantiate the provided pages
        for (const page of config.pages){
            this.pages.push(new Page(this.config, page));
        }

        // If there are no current pages, create the first page
        if (this.pages.length == 0){
            this.pages.push(new Page(this.config));
            this.onPage = 1;
        }
        //Instantiate the text formatting engine
        this.engine = new Engine(this.config);

        // Render the editor
        this.render();
    }

    private render(){
        const breakPage = this.breakPage.bind(this);
        for (let pageIdx in this.pages){
            let pageNum = (+pageIdx)+1;
            const page = this.pages[pageIdx];
            // Check if the page is already rendered
            if (!document.getElementById(page.domID)){
                const renderedPage: HTMLElement = page.render();
                // Attach an event listener to the rendered page for an overflow event
                renderedPage.addEventListener('overflow', (e: CustomEvent) =>
                                                                this.breakPage(page, e.detail));
                // Pass all keydown events on the page to the text formatting engine
                page.contentWrapper.addEventListener('keydown', (e: KeyboardEvent) =>
                                                                                this.engine.onKeydown(e, page));
                //
                page.contentWrapper.addEventListener('change', (e: Event) => this.onChange(e, page));
                // Listen to page change events to notify the configured onChange handler
                this.editorHolder.appendChild(renderedPage);
                // If this is the page that the user is currently on, and it hasn't been rendered yet, focus on it
                if (pageNum == this.onPage){
                    page.focus();
                }
            }
        }
    }

    public newPage(){
        this.pages.push(new Page(this.config));
        this.render();
    }

    /**
     * When a page overflows, break off the overflowing content into a new page
     *
     * @param page: The page that's overflowing
     * @param endIdx The index of the last valid char in the page text. If the content wrapper has 255 valid chars,
     * and 256 causes an overflow, this parameter will be 255
     */
    private breakPage(page: Page, endIdx: number){
        const pageIdx = this.pages.indexOf(page);
        console.log(`Breaking page ${pageIdx} from ${endIdx}`);
        // Cut off the overflowing text from the end of the page
        const newContent = page.truncateText(endIdx);
        // Check if there's a page that comes after pageIdx
        if (this.pages.length > pageIdx + 1){
            // If there is, append this text to the beginning of the following page
        }
        else{
            // Otherwise, create a new page with the text
            // TODO: create the blocks here
            const newPage = new Page(this.config)

        }
    }

    /**
     * Save the current state of the editor. If num is not specified, save all pages
     *
     * @param num: If provided, save just a given page instead of all pages.
     */
    public save(num?: number): DeskSnapshot {
        const currPageSnapshots = {};
        if (num === undefined) {
            for (let pageTrack in this.pages) {
                const pageNum = (+pageTrack) + 1;
                const page = this.pages[pageTrack];
                currPageSnapshots[pageNum] = this.buildSnapshot(page);
            }
        }
        else {
            if (this.validatePageNumber(num)){
                currPageSnapshots[num] = this.buildSnapshot(num);
            }
            else{
                return {pages: {}};
            }
        }
        return {pages: currPageSnapshots};
    }

    public get currentPage(): Page {
        return this.pages[this.onPage - 1];
    }

    /**
     * A function that validates that a page number is in the current pages.
     * Returns true if it is, throws a console error and returns false if not
     */
    private validatePageNumber(pageNum: number): boolean {
        if (pageNum > 0){
            if (pageNum <= this.pages.length){
                return true;
            }
        }
        console.error(`Invalid page number: ${pageNum}`);
        return false;
    }


    /**
     * Build a snapshot of a given page. If blockNumbers or blockUIDs is defined, return just those blocks. From
     * the page snapshot. Otherwise, return all pages
     *
     * @param page The page to build a snapshot of. Either a page number >= 1, a string page UID, or a page object
     * @param blockNumbers: A set of block numbers, where the first block in the page is 1.
     * @param blockUIDs: A set of block string UIDs
     */
    private buildSnapshot(page: number | string | Page, blockNumbers?: Set<number>, blockUIDs?: Set<string>):
        PageData {

        let pageObj;
        if (typeof(page) == "number"){
            if (this.validatePageNumber(page)){
                pageObj = this.pages[page-1];
            }
            else{
                return;
            }
        }
        else if (typeof(page) == "string"){
            pageObj = this.pages.find((value: Page) => value.uid === page);
            if (pageObj == undefined){
                console.error(`Couldn't find page with UID ${page}`);
                return;
            }
        }
        else if (page instanceof Page){
            pageObj = page;
        }
        else{
            console.error(`Unrecognized page type ${typeof(page)}`, page);
            return;
        }
        // This predicate will determine if a block should be included in the snapshot
        let blockComparator;
        const blockNumbersUsed = (blockNumbers != undefined && blockNumbers.size > 0);
        const blockUIDsUsed = (blockUIDs != undefined && blockUIDs.size > 0);
        // If no blocks were specified, resolve all blocks
        if (!blockNumbersUsed && !blockUIDsUsed){
            blockComparator = () => true;
        }
        else{
            // Build predicates
            if (blockNumbersUsed && blockUIDsUsed){
                blockComparator = (i: number, b: Block) => (blockNumbers.has(i) || blockUIDs.has(b.uid));
            }
            else if (blockNumbersUsed){
                blockComparator = (i: number) => (blockNumbers.has(i));
            }
            else if (blockUIDsUsed){
                blockComparator = (i: number, b: Block) => (blockUIDs.has(b.uid));
            }
        }
        const blocks = {};
        // Iterate through the blocks in the page
        console.log(pageObj);
        for (let blockTrack in pageObj.blocks) {
            console.log(`Checking block ${blockTrack}`);
            const block: Block = pageObj.blocks[blockTrack];
            console.log(`Got block ${block.uid}`);
            const blockIdx: number = (+blockTrack);
            const blockNum: number = blockIdx+1;
            // If a block matches our built comparator, push it onto the snapshot object
            if (blockComparator(blockNum, block)){
                console.log("Block resolved");
                blocks[blockNum] = block.serialize();
            }
        }
        const snapshot: PageData = {uid: pageObj.uid, blocks: blocks};
        // Return the resulting snapshot
        return snapshot;
    }

    private onChange(e: Event, p: Page){
        console.log("Firing change");
        const pageNum = this.pages.indexOf(p);
    }

    public onPage: number;
    public pages: Page[];
    private engine: Engine;
    private editorHolder: HTMLElement;
    private config: DeskConfig;

}
