// Internal imports
import PageData from "./PageData";

interface DeskConfig{
    // The ID of the class that will hold the editor. Defaults to "desk-editor"
    holder?: string;

    // The height of a page in the editor, as a CSS property string. Defaults to 85vh, 85% of the screen
    height?: string;

    // The width of a page in the editor, as a CSS property string. Defaults to 66vh
    width?: string;

    // The data to load the editor with. An ordered list of pages
    pages?: PageData[];

    // Called whenever a block is modified, created, or destroyed in the document
    onChange?(e: Event): void;
}

export default DeskConfig;