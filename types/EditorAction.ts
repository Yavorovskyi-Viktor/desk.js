// Things that the desk editor knows how to do

export enum Action {
    // Text formatting
    makeBold,
    makeItalic,
    makeStyle,
    makeUnderline,
    makeStrikethrough,
    makeHighlight,

    // Font change
    makeFontFamily,
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
    makeLetterList,

    // Styles
    makeHeading,
    makeSubheading,
    makeSubscript,
    makeSuperscript,

    // Editing actions
    undo,
    redo,

    // Copy and paste
    copy,
    copyWithFormatting,
    copyWithoutFormatting,
    paste,
    pasteWithFormatting,
    pasteWithoutFormatting,

    // Print
    doPrint
}

interface EditorAction {
    action: Action,
    detail: Object
}

export default EditorAction;