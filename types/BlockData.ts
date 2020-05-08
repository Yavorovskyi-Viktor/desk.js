interface BlockData{
    // The content of the block, rendered into HTML. Default is nothing
    content?: string

    // Any other data that the block might want to track
    data?: Object;
}

export default BlockData;