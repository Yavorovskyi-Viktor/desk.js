// Internal imports
import DeskConfig from "../types/DeskConfig";
import PageData from "../types/PageData";
import Page from './Page';
import Engine, { defaultShortcuts } from "./Engine";
import DeskSnapshot from "../types/DeskSnapshot";
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
        for (let pageIdx in this.pages){
            let pageNum = (+pageIdx)+1;
            const page = this.pages[pageIdx];
            // Check if the page is already rendered
            if (!document.getElementById(page.domID)){
                const renderedPage: HTMLElement = page.render();
                // Pass all keydown and input events on the page to the text formatting engine
                page.contentWrapper.addEventListener('keydown', (e: KeyboardEvent) =>
                                                                                this.engine.onKeydown(e, page));
                // Pass overflow events back to the page manager so we can break the page
                page.contentWrapper.addEventListener('overflow', (e: CustomEvent) =>
                                                                        this.breakPage(pageNum, e.detail));
                // Listen to mutations and pass them as well to the formatting engine
                const observer = new MutationObserver((mutations) =>
                    this.engine.handleMutation(mutations, page));
                observer.observe(page.contentWrapper, {
                    characterData: true,
                    childList: true,
                });

                this.editorHolder.appendChild(renderedPage);
                // If this is the page that the user is currently on, and it hasn't been rendered yet, focus on it
                if (pageNum == this.onPage){
                    page.focus();
                }
            }
        }
        // Set the cursor on the current onPage
        const currentBlock = this.currentPage.currentBlock;
        Engine.set(currentBlock);
    }

    public newPage(){
        this.pages.push(new Page(this.config));
        this.render();
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

    private static serializeBlock(blockElem: HTMLElement): BlockData{
        let blockInner = blockElem.innerHTML;
        // Remove zero width characters
        if (blockInner === "&#8203;"){
            blockInner = "";
        }
        return {
            content: blockInner
        };
    }

    /**
     * Build a snapshot of a given page. If blockNumbers or blockUIDs is defined, return just those blocks. From
     * the page snapshot. Otherwise, return all pages
     *
     * @param page The page to build a snapshot of. Either a page number >= 1, a string page UID, or a page object
     * @param blockNumbers: A set of block indexes
     */
    private buildSnapshot(page: number | string | Page, blockNumbers?: number[]):
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
        const blocks = {};
        if (blockNumbers != undefined && blockNumbers.length > 0){
            blockNumbers.forEach(function(i: number){
               blocks[i] = Desk.serializeBlock(pageObj.getBlock(i));
            });
        }
        else{
            pageObj.blocks.forEach(function(b: HTMLElement, i: number){
               blocks[i] = Desk.serializeBlock(b);
            });
        }
        const snapshot: PageData = {uid: pageObj.uid, blocks: blocks};
        // Return the resulting snapshot
        return snapshot;
    }

    private breakPage(pageNum: number, nextPageContent){

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
