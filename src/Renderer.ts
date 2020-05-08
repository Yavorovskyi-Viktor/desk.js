import {createElement} from "./Util";
import Op from "quill-delta/dist/Op";
import DeskConfig from "../types/DeskConfig";

type attributeRenderer = (attrValue) => HTMLElement;
type attributeParser = (elem: HTMLElement) => Object;

const renderMap: { [attrName: string]: attributeRenderer } = {
    "bold": () => createElement("b"),
    "italic": () => createElement("i"),
    "underline": () => createElement("u"),
    "strikethrough": () => createElement("strike"),
    "font": (v) => createElement("span", {style: `font-family: ${v};`}),
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


class RenderTree {
    constructor(elem: Node){
        this.head = elem;
        this.children = [];
        this.sealed = false;
    }

    public insert(elems: Node[]) {
        if (elems.length != 0){
            let firstElem = elems.shift();
            for (let child of this.children) {
                if (!child.sealed){
                    if (child.head.isEqualNode(firstElem)) {
                        return child.insert(elems);
                    }
                    else {
                        child.sealed = true;
                    }
                }
            }
            let newTree = new RenderTree(firstElem);
            newTree.insert(elems);
            this.children.push(newTree);
        }
    }

    public combineChildren() {
        while (this.children.length > 0){
            let child = this.children.shift();
            child.combineChildren();
            this.head.appendChild(child.head);
        }
    }

    public sealed: boolean;
    public head: Node;
    public children: RenderTree[];
}

class RenderNode {
    constructor(text: string, attributes?: Object) {
        this.text = text;
        this.elements = [];
        this.attributes = attributes;
    }

    public render(){
        if (this.attributes != undefined) {
            // Iterate through the attributes, merging them as child elements into opRoot. Sort the keys
            // so that the deduplication pass can match more efficiently
            const sortedKeys = Object.keys(this.attributes).sort();
            for (const attrName of sortedKeys) {
                const renderer = renderMap[attrName];
                if (renderer == undefined) {
                    throw new Error(`Can't render unsupported attribute ${attrName}`);
                } else {
                    // Actually render the element
                    const rendered = renderer(this.attributes[attrName]);
                    this.elements.push(rendered);
                }
            }
        }
        this.elements.push(document.createTextNode(this.text));
    }

    public text: string;
    public elements: Node[];
    private readonly attributes: Object;
}

class Renderer {
    constructor(ops){
        this.nodes = ops.map((op) => {
            if (op.insert != undefined) {
                return new RenderNode(op.insert, op.attributes);
            }
            else {
                const errorMsg = "Non insert operation found in document render, document malformed";
                console.error(errorMsg, op);
                throw new Error(errorMsg);
            }
        });
    }

    public render(): Node {
        let root = createElement('div');
        let tree = new RenderTree(root);
        this.nodes.forEach((node) => {
            node.render();
            tree.insert(node.elements);
        });
        tree.combineChildren();
        return tree.head;
    }

    private nodes: RenderNode[];
}

class Parser {
    constructor(target: HTMLElement, config: DeskConfig) {
        this.target = target;
        this.config = config;
    }

    /**
     * Find the parents of the target that are relevant
     */
    private findFormattingParents(elem?: HTMLElement){
        // Start from this.target
        if (elem == undefined) {
            elem = this.target;
        }
        if (elem.tagName in parseMap) {
            this.formattingParents.push(elem);
        }
        // Stop when the wrapper is hit or the parent element is null
        const parent = elem.parentElement;
        if (parent && !parent.classList.contains(this.config.pageWrapperClass)){
            this.findFormattingParents(elem.parentElement);
        }
    }

    public parse(): Object {
        this.findFormattingParents();
        let attributes = {};
        // Now that the different elements that will contribute to the objects attributes have been found
        for (let parent of this.formattingParents) {
            const parsed = parseMap[parent.tagName](parent);
            Object.assign(attributes, parsed);
        }
        return attributes;
    }

    private formattingParents: HTMLElement[];
    private config: DeskConfig;
    private target: HTMLElement;
}

export { Renderer, Parser };