import {createElement} from "./Util";

type attributeRenderer = (attrValue) => HTMLElement;
type attributeParser = (elem: HTMLElement) => [ ];

const renderMap: { [attrName: string]: attributeRenderer } = {
    "bold": () => createElement("b"),
    "italic": () => createElement("i"),
    "underline": () => createElement("u"),
    "strikethrough": () => createElement("strike"),
    "font": (v) => createElement()
};

const parseMap: { [tagName: string]: attributeParser } = {
    "b": () => ()
};
