/**
 * A helper function to programatically create an HTML element
 * @param tag The tag name, ex. 'div'
 * @param attrs The attributes to assign to the element, ex. {"id": "desk-page-id"}
 */
function createElement(tag: string, attrs: Object): HTMLElement{
    const elem = document.createElement(tag);
    for (const attr of Object.keys(attrs)){
        elem.setAttribute(attr, attrs[attr]);
    }
    return elem;
}

export { createElement };