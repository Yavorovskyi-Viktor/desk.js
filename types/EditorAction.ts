// Things that the desk editor knows how to do

export enum Action {
    // Text formatting
    makeBold = 'makeBold',
    makeItalic = 'makeItalic',
    makeUnderline = 'makeUnderline',
    makeStrikethrough = 'makeStrikethrough',
    makeHighlight = 'makeHighlight',
    makeColor = 'makeColor',

    // Font change
    makeFontName = 'makeFontName',
    makeFontSize = 'makeFontSize',

    // Text alignment
    alignLeft = 'alignLeft',
    alignCenter = 'alignCenter',
    alignRight = 'alignRight',
    alignJustify = 'alignJustify',

    // Indentation
    indent = 'indent',
    unindent = 'unindent',

    // Lists
    makeNumberList = 'makeNumberList',
    makeBulletList = 'makeBulletList',

    // Styles
    makeHeading = 'makeHeading',
    makeSubscript = 'makeSubscript',
    makeSuperscript = 'makeSuperscript',

    // Editing actions
    undo = 'undo',
    redo = 'redo',

    // Copy and paste
    pasteWithFormatting = 'pasteWithFormatting',
    pasteWithoutFormatting = 'pasteWithoutFormatting',

    // Print
    doPrint = 'doPrint',

    // Save
    save = 'save'
}

interface EditorAction {
    action: Action,
    detail: Object
}

export default EditorAction;