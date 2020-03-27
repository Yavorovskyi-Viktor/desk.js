// Internal imports
import BlockData, {BlockType} from "../types/BlockData";
import DeskConfig from "../types/DeskConfig";
import * as Util from './Util';

// External imports
import { v4 } from 'uuid';


class Block {
    constructor(config: DeskConfig, data?: BlockData){
        this.config = config;
        if (data == undefined){
            this.uid = v4();
            this.type = BlockType.Paragraph;
            this.content = '';
            this.data = {};
        }
        else{
            // Generate a unique ID for the block if not specified
            this.uid = data.uid || v4();
            // The default block type will be a paragraph
            this.type = data.type || BlockType.Paragraph;
            // The default content is an empty string
            this.content = data.content || '';
            // If no extra data was passed in, set an empty object
            this.data = data.data || {};
        }

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

    private renderContent(){
        if (this.elem != undefined){
            switch (this.type){
                case (BlockType.Paragraph):
                    if (this.content != undefined){
                        this.elem.innerHTML = this.content;
                    }
                    break;
                case (BlockType.Whitespace):
                    // A blank line equivalent to the spacing layed out in the config
                    this.elem.innerHTML = `<div style="height: ${this.config.lineHeight}"></div>"`;
                    break;
            }
        }
        if (this.elem != undefined && this.content != undefined){
            this.elem.innerHTML = this.content;
        }
    }

    public setContent(content: string){
        this.content = content;
        this.renderContent();
    }

    public render(){
        if (this.elem == undefined){
            // Render a new block into the DOM
            this.elem = Util.createElement('div', {
                'class': this.config.blockClass,
                'id': this.domID
            });
            this.renderContent();
        }
        return this.elem;
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
    private elem: HTMLElement;
}

export default Block;