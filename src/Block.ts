// Internal imports
import BlockData, {BlockType} from "../types/BlockData";
import DeskConfig from "../types/DeskConfig";

// External imports
import { v4 } from 'uuid';

// A blocks class in the DOM
const blockClass = "desk-block";

// The default height of a line in Desk
const lineHeight = '20px';
// The blank element that will be used to represent a blank line
const whitespace = `<div class="desk-line desk-blank" style="height: ${lineHeight}"></div>`;

class Block {
    constructor(config: DeskConfig, data?: BlockData){
        this.config = config;
        // Generate a unique ID for the block if not specified
        this.uid = data.uid || v4();
        // The default block type will be a paragraph
        this.type = data.type || BlockType.Paragraph;
        // The default content is an empty string
        this.content = data.content || '';
        // If no extra data was passed in, set an empty object
        this.data = data.data || {};
    }

    /**
     * Serialize all the block data into the BlockData format
     */
    public serialize(): BlockData {
        return {
            uid: this.uid,
            type: this.type,
            content: this.content
        };
    }

    /**
     * Render the block into HTML, and attach listeners
     */
    public get element(): string {
        // The actual HTML. Have a switch case for each type of block
        let blockElement;
        switch (this.type){
            case BlockType.Paragraph:
                blockElement = `<p>${this.content}</p>`;
                break;
            case BlockType.Heading:
                // If the block data defines an attribute 'level', use that as the leader of the header. E.g.
                // { "data" : { "level": 5 } } = h5
                let level;
                if (this.data.hasOwnProperty("level")){
                    level = this.data["level "];
                }
                else{
                    // Default header is h2
                    level = 2;
                }
                blockElement = `<h${level}>${this.content}</h${level}>`;
                break;
            case BlockType.Whitespace:
                blockElement = whitespace;
                break;
        }
        return `<div id="${this.domID}" class="${blockClass}">${blockElement}</div>`;
    }

    /**
     * Get the HTML ID that's rendered in the DOM. Of the format block-{UID}
     */
    public get domID(): string {
        return `block-${this.uid}`;
    }

    private config: DeskConfig;
    private content: string;
    private data: object;
    public uid: string;
    public type: BlockType;
}

export default Block;