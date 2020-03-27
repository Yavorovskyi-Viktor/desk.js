// Internal imports
import DeskConfig from "../types/DeskConfig";
import PageData from "../types/PageData";
import Page from './Page';
import Engine, { defaultShortcuts } from "./Engine";

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
     * Return an object mapping integer page numbers to serialized page data
     */
    public serialize(): PageData[] {
        const pages = [];
        this.pages.forEach(function(page: Page){
           pages.push(page.serialize());
        });
        return pages;
    }

    public get currentPage(): Page {
        return this.pages[this.onPage - 1];
    }

    public onPage: number;
    public pages: Page[];
    private engine: Engine;
    private editorHolder: HTMLElement;
    private config: DeskConfig;

}
