// Things that the desk editor knows how to do

export enum Action {
    // Text formatting
    makeBold,
    makeItalic,
    makeUnderline,
    makeStrikethrough,
    makeHighlight,
    makeColor,

    // Font change
    makeFontName,
    makeFontSize,

    // Text alignment
    alignLeft,
    alignCenter,
    alignRight,
    alignJustify,

    // Indentation
    indent,
    unindent,

    // Lists
    makeNumberList,
    makeBulletList,

    // Styles
    makeHeading,
    makeSubscript,
    makeSuperscript,

    // Editing actions
    undo,
    redo,

    // Copy and paste
    pasteWithFormatting,
    pasteWithoutFormatting,

    // Print
    doPrint,

    // Save
    save
}

interface EditorAction {
    action: Action,
    detail: Object
}

export default EditorAction;