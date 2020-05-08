// Internal imports
import DeskConfig from "../types/DeskConfig";
import PageData from "../types/PageData";
import Page from './Page';
import Engine from "./Engine";
import DeskSnapshot from "../types/DeskSnapshot";
import EditorAction from "../types/EditorAction";
import { uuid } from './Util';
import { defaultConfig } from './Defaults';

// External imports
import Delta from "quill-delta";

interface CursorPosition {
    start: number;
    end?: number;
}

export default class Desk{
    constructor(config?: DeskConfig){
        if (config == undefined){
            config = defaultConfig
        }
        else{
            // Set configuration defaults. The default values for these are detailed in DeskConfig.ts, and
            // set in Defaults.ts
            config = Object.assign(defaultConfig, config);
        }
        this.config = config;

        // Generate a session key if one wasn't provided
        this.sessionKey = config.sessionKey || uuid();

        // Make sure that the holder element exists on the page
        this.editorHolder = document.getElementById(this.config.holder);
        if (this.editorHolder == null){
            console.error(`Couldn't find holder: ${config.holder}`)
        }

        this.pages = [];

        // Instantiate the provided pages
        for (const page of config.pages){
            this.pushPage(new Page(this.config, page));
            this.onPage = this.config.onPage;
        }

        // If there are no current pages, create the first page
        if (this.pages.length == 0){
            this.pushPage(new Page(this.config));
            this.onPage = 1;
        }

        //Instantiate the text formatting engine
        this.engine = new Engine(this.config);

        // Render the editor
        this.render();
    }

    private deletePage(page: Page) {
        const pageIdx = this.pages.findIndex((p: Page) => p.uid === page.uid);
        console.log(`Deleting page ${pageIdx+1}`);
        if (pageIdx !== 0){
            // If the page isn't the last page in the document, remove it internally
            this.pages.splice(pageIdx, 1);
            delete this.pageIds[page.domID];
            // Remove the page from the DOM
            this.editorHolder.removeChild(page.pageHolder);
        }
    }

    private render(){
        // Debounce change events so they're not overwhelming a listener
        for (let pageIdx in this.pages){
            let pageNum = (+pageIdx)+1;
            const page = this.pages[pageIdx];
            // Check if the page is already rendered
            if (!document.getElementById(page.domID)){
                const renderedPage: HTMLElement = page.render();
                // Pass all keydown and input events on the page to the text formatting engine
                page.contentWrapper.addEventListener('keydown', (e: KeyboardEvent) =>
                                                                                this.engine.onKeydown(e, page));
                page.contentWrapper.addEventListener('input', (i: InputEvent) =>
                                                                                this.engine.onInput(i, page));
                // Pass overflow events back to the page manager so we can break the page
                page.contentWrapper.addEventListener('overflow', (e: CustomEvent) =>
                                                                        this.breakPage(page, e.detail));
                // Pass page deletion events to an event listener that will know if it's the first page or not
                page.contentWrapper.addEventListener('delete', (e: CustomEvent) => this.deletePage(page));
                // Pass paste events to the text formatting engine
                page.contentWrapper.addEventListener('paste', (e: ClipboardEvent) =>
                                                                                    this.engine.onPaste(e, page));
                this.editorHolder.appendChild(renderedPage);
                // If this is the page that the user is currently on, and it hasn't been rendered yet, focus on it
                if (pageNum == this.onPage){
                    page.focus();
                }
            }
        }
    }

    private findPage(element: HTMLElement): Page | null {
        if (element.id in this.pageIds) {
            return this.pageIds[element.id];
        }
        else {
            const parent = element.parentElement;
            if (parent && parent.id != this.config.holder){
                return this.findPage(parent);
            }
            else {
                return null;
            }
        }
    }

    private updateCursorPosition() {
        let selection = window.getSelection();
        // Is the cursor anywhere?
        if (selection.type) {
            // If so, figure out what page it's on
            let target = selection.anchorNode || selection.focusNode;
            if (target) {
                let relevantPage = this.findPage(target as HTMLElement);
                if (relevantPage) {
                    // If a page has been found, store the page ID
                    this.cursorPage = relevantPage.domID;
                    // Next figure out where the cursor actually is on the page, by getting the text content of the page
                    relevantPage.getText();
                    
                }
                else {
                    console.log("Cursor not on page");
                }
            }
            else {
                console.error("Couldn't get selection target", selection);
            }
        }
    }

    private pushPage(p: Page) {
        this.pages.push(p);
        this.pageIds[p.domID] = p;
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
     * Build a snapshot of a given page. If page is defined, just return that page. Otherwise, return all pages
     *
     * @param page The page to build a snapshot of. Either a page number >= 1, a string page UID, or a page object
     */
    private buildSnapshot(page: number | string | Page): PageData {
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
        pageObj.clean();
        // Get the delta from the page
        const snapshot: PageData = {uid: pageObj.uid, delta: pageObj.delta};
        // Return the resulting snapshot
        return snapshot;
    }


    private breakPage(page: Page, nextPageContent: Delta){
        const pageIdx: number = this.pages.findIndex((p: Page) => p.uid === page.uid);
        const pageNum = pageIdx + 1;
        const newPage = new Page(this.config, { delta: nextPageContent });
        this.onPage = pageNum + 1;
        // Check to see if a page already exists with the page number following pageNum
        if (this.pages.length > pageNum){
            // If it does, push the pending page content onto that page
            const nextPage = this.pages[pageNum];
            nextPage.setContents(nextPageContent);
        }
        else {
            // If not, create a new page
            this.insertPageAt(pageNum, newPage);
        }
        // Focus on the new page
        this.currentPage.focus();
    }

    public insertPageAt(pageIdx: number, page?: Page): boolean {
        if (this.pages.length < pageIdx || pageIdx <  0){
            return false;
        }
        else {
            if (this.pages.length == pageIdx){
                // Insert a page directly after the current page
                this.pushPage(page);
            }
            else {
                this.pages.splice(pageIdx, 0, page);
            }
            this.render();
        }
    }

    public findPageIdx(pageId: string): number | null {
        const foundIndex = this.pages.findIndex((p: Page) => p.uid === pageId);
        if (foundIndex >= 0){
            return foundIndex;
        }
        else {
            return null;
        }
    }

    public findPageNum(pageId: string): number | null {
        const foundPageIdx = this.findPageIdx(pageId);
        if (foundPageIdx){
            return foundPageIdx + 1;
        }
        else {
            return null;
        }
    }


    public insertNewPageAt(index: number, page: PageData){
        const newPage = new Page(this.config, page);
        this.insertPageAt(index, newPage);
    }

    public insertPageBefore(beforePageId: string, page: PageData){
        const beforePage = this.findPageIdx(beforePageId);
        this.insertNewPageAt(beforePage, page);

    }

    public insertPageAfter(afterPageId: string, page: PageData){
        const afterPage = this.findPageIdx(afterPageId);
        this.insertNewPageAt(afterPage+1, page);
    }


    /**
     * Return the word count of either a specific page, or the entire editor
     *
     * @param pageId Optionally supply the UID of a specific page to get the word count for
     * @param pageNum Optionally supply the number of a specific page to get the word count for
     */
    public wordCount(pageId?: string, pageNum?: number): number {
        if (pageId != undefined) {
            return this.pages[this.findPageIdx(pageId)].wordCount;
        }
        else if (pageNum != undefined) {
            return this.pages[pageNum - 1].wordCount;
        }
        else {
            let wordCount = 0;
            this.pages.map((p: Page) => wordCount+=p.wordCount);
            return wordCount;
        }
    }

    public get shortcuts(){
        return this.engine.shortcuts;
    }

    /**
     * Execute an action in the text formatting engine
     * @param action
     */
    public executeAction(action: EditorAction){
        Engine.executeAction(action);
    }

    public sessionKey: string;
    public onPage: number;
    public pages: Page[];
    private pageIds: { [id: string]: Page };
    private cursorPage: string;
    private cursorOffset: CursorPosition;
    private engine: Engine;
    private editorHolder: HTMLElement;
    private config: DeskConfig;
}
