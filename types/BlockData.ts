// A string enum, the values of which are serializable IDs of each type
export enum BlockType{
    Paragraph = "paragraph",
    Heading = "heading",
    Whitespace = "whitespace",
}

interface BlockData{
    // A unique identifier for this block. Will stay with it regardless of what else
    uid: string;

    // What type of content the block contains
    type: BlockType

    // The content of the block, rendered into HTML
    content: string

    // Any other data that the block might want to track
    data?: Object;
}

export default BlockData;