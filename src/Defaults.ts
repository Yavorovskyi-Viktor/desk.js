import DeskConfig from "../types/DeskConfig";
import {defaultShortcuts} from "./Engine";
import {uuid} from "./Util";

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
    pageClass: "desk-page",
    pageWrapperClass: "desk-page-wrapper",
    saveOnChange: false,
    genUID: uuid,
    debounceChanges: 500,
    sessionKey: false
};

export { defaultConfig };