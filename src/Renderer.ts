import {createElement} from "./Util";
import Op from "quill-delta/dist/Op";

type attributeRenderer = (attrValue) => HTMLElement;
type attributeParser = (elem: HTMLElement) => Object;

const renderMap: { [attrName: string]: attributeRenderer } = {
    "bold": () => createElement("b"),
    "italic": () => createElement("i"),
    "underline": () => createElement("u"),
    "strikethrough": () => createElement("strike"),
    "font": (v) => createElement("font", {style: `font-family: ${v};`}),
    "header": (v) => createElement(`h${v}`),
    "blockquote": () => createElement("blockquote")
};

const parseMap: { [tagName: string]: attributeParser } = {
    "b": () => ({bold: true}),
    "i": () => ({italic :true}),
    "u": () => ({underline: true}),
    "strike": () => ({strikethrough: true}),
    "font": (e) => ({font: e.style.fontFamily}),
    "blockquote": () => ({blockquote: true})
};

function dedupeTraverse(root: HTMLElement) {

}

function renderDocument(ops: Op[]): HTMLElement {
    /**
     * Render a document, e.g a list of only insert operations
     */
    const root = createElement("div");
    // Render pass
    for (let op of ops){
        if (op.insert != undefined){
            const opRoot = createElement("span", {"data-type": "marker"});
            let elemRoot = opRoot;
            // Iterate through the attributes, merging them as child elements into opRoot
            for (const attrName of Object.keys(op.attributes)) {
                const renderer = renderMap[attrName];
                if (renderer == undefined){
                    throw new Error(`Can't render unsupported attribute ${attrName}`);
                }
                else {
                    // Actually render the element, and set it as the new head
                    const rendered = renderer(op.attributes[attrName]);
                    elemRoot.appendChild(rendered);
                    elemRoot = rendered;
                }
            }
            root.appendChild(opRoot);
        }
        else {
            const errorMsg = "Non insert operation found in document render, document malformed";
            console.error(errorMsg, op);
            throw new Error(errorMsg);
        }
    }
    // Deduplication pass
    return root;
}