// Internal imports
import Block from "./Block";
import PageData from "../types/PageData";

// External imports
import { v4 } from 'uuid';
import BlockData from "../types/BlockData";

class Page {
    constructor(data?: PageData){
        // If the page wasn't passed a UID, generate a v4 UUID
        this.uid = data.uid || v4();
    }

    public serialize(): PageData{
        // Serialize all the page blocks
        let serializedBlocks = [];
        this.blocks.forEach(function(block: Block){
           serializedBlocks.push(block.serialize());
        });
        return {
            uid: this.uid,
            blocks: serializedBlocks
        }
    }

    private blocks: Block[];
    private uid: string;
}

export default Page;