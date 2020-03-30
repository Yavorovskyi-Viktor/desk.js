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

/**
 * Create a (not cryptographically secure), but good enough for unique page numbers, UUID.
 *
 * Found at https://codepen.io/Jvsierra/pen/BNbEjW
 */
function uuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

export { createElement, uuid };