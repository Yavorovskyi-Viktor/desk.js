// Internal imports
import PageData from "./PageData";
import {Shortcut} from "./KeyboardShortcut";
import DeskSnapshot from "./DeskSnapshot";

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
    onChange?(snapshot: DeskSnapshot): void;

    // Optionally supply a custom function to generate page UIDs
    genUID(): string;

    // Do you want to receive the entire document on change, or just the pages and blocks that have changed? Default is false
    saveOnChange?: boolean;

    // The included Desk editing shortcuts. Override this to eliminate common shortcut
    baseShortcuts: Shortcut[]

    // Extra shortcuts that you want to include in the editor. Defaults to none
    extraShortcuts: Shortcut[]

    // The classname of editor blocks
    blockClass: string;

    // Whether or not to debounce type events. Set to a number if they should be debounced, or false if not. Default
    // is 500 ms
    debounceChanges: number | false;

    // The class name of a page in the document. Default is "desk-page"
    pageClass: string;

    // The class name of a page content wrapper in the document. Default is "desk-page-wrapper"
    pageWrapperClass: string;

    // Optionally provide a static session key. Otherwise, it will be automatically generated as a UUID
    sessionKey?: string | false;

}

export default DeskConfig;