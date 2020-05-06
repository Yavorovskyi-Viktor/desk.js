enum InputTypeGroup {
    Insert,
    Delete,
    DeleteSelection,
    Replace,
    Format,
    Unknown,
}

type InputTypeMapping = {
    [group in InputTypeGroup]: string[];
};

const typeGroupMappings: InputTypeMapping = {
    [InputTypeGroup.Insert]: [
        "insertText",
        "insertLineBreak",
        "insertParagraph",
        "insertOrderedList",
        "insertUnorderedList",
        "insertHorizontalRule",
        "insertFromDrop",
        "insertFromPaste",
        "insertFromPasteAsQuotation",
        "insertTranspose",
        "insertLink",
    ],
    [InputTypeGroup.Replace]: [
        "insertReplacementText",
        "insertFrom",
        "insertCompositionText"
    ],
    [InputTypeGroup.Delete]: [
        "deleteWordBackward",
        "deleteWordForward",
        "deleteSoftLineBackward",
        "deleteSoftLineForward",
        "deleteHardLineBackward",
        "deleteHardLineForward",
        "deleteByDrag",
    ],
    [InputTypeGroup.DeleteSelection]: [
        "deleteByCut",
        "deleteContent"
    ],
    [InputTypeGroup.Format]: [
        "formatBold",
        "formatUnderline",
        "formatStrikeThrough",
        "formatSuperscript",
        "formatSubscript",
        "formatJustifyFull",
        "formatJustifyCenter",
        "formatJustifyRight",
        "formatJustifyLeft",
        "formatIndent",
        "formatOutdent",
        "formatRemove",
        "formatSetBlockTextDirection",
        "formatSetInlineTextDirection",
        "formatBackColor",
        "formatFontColor",
        "formatFontName"
    ],
    [InputTypeGroup.Unknown]: [
        "historyUndo",
        "historyRedo"
    ]
};

const caseGroupMapping: { [caseName: string]: InputTypeGroup } = {};

// Create a mapping going the other way that will be used in the to determine the group of input events
for (let group of Object.keys(typeGroupMappings)){
    for (let caseString of typeGroupMappings[group]){
        caseGroupMapping[caseString] = Number(group);
    }
}

function classifyInput(i: InputEvent): InputTypeGroup {
    if (i.inputType in caseGroupMapping){
        return caseGroupMapping[i.inputType];
    }
    else {
        return InputTypeGroup.Unknown;
    }
}

export default classifyInput;