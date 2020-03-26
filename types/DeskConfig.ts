// Internal imports
import PageData from "./PageData";

type Margin = "top" | "bottom" | "left" | "right"

interface DeskConfig{
    // The ID of the class that will hold the editor. Defaults to "desk-editor"
    holder?: string;

    // The height of a page in the editor, as a CSS property string. Defaults to 1056px
    height?: string;

    // The width of a page in the editor, as a CSS property string. Defaults to 815px
    width?: string;

    // The data to load the editor with. An ordered list of pages
    pages?: PageData[];

    // The page that the user is currently on. Defaults to 1
    onPage?: number;

    // The margins of the page. Automatically configured to 15px each. Please note that this are locked
    // to PX values, and not full CSS strings, because of the way that margin overflows need to be calculated.
    margins: { [side in Margin]: number }

    // The spacing beneath each page. Defaults to 20px
    spacing: string;

    // Called whenever a block is modified, created, or destroyed in the document
    onChange?(e: Event): void;
}

export default DeskConfig;