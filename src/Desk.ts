// Internal imports
import DeskConfig from "../types/DeskConfig";
import PageData from "../types/PageData";
import Page from './Page';

class Desk{
    constructor(config: DeskConfig){
        // Set configuration defaults. The default values for these are detailed in DeskConfig.ts
        config.holder = config.holder || "desk-editor";
        config.height = config.height || "85vh";
        config.width = config.width || "66vh";
        config.pages = config.pages || [];
        config.onPage = config.onPage || 1;
        config.onChange = config.onChange || (() => {});
        this.config = config;

        // Make sure that the holder element exists on the page
        this.editorHolder = document.getElementById(this.config.holder);
        if (this.editorHolder == null){
            console.error(`Couldn't find holder: ${config.holder}`)
        }

        // Instantiate the provided pages
        for (const page of config.pages){
            this.pages.push(new Page(page));
        }

        // If there are no current pages, create the first page
        if (this.pages.length == 0){
            this.newPage();
        }
    }

    public newPage(){
        this.pages.push(new Page());
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

export default Desk;
