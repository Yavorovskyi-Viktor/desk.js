// Internal imports
import DeskConfig from "../types/DeskConfig";
import PageData from "../types/PageData";
import Page from './Page';

const defaultConfig: DeskConfig = {
    holder: "desk-editor",
    height: "1056px",
    width: "815px",
    pages: [],
    onPage: 1,
    onChange: (() => {}),
    margins: {
        "left": "15px",
        "right": "15px",
        "top": "15px",
        "bottom": "15px"
    }
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
            this.newPage();
        }

        // Render the editor
        this.render();
    }

    private render(){
        for (const page of this.pages){
            this.editorHolder.appendChild(page.render());
        }
    }

    public newPage(){
        this.pages.push(new Page(this.config));
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
    private editorHolder: HTMLElement;
    private config: DeskConfig;

}
