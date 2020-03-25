// Internal imports
import BlockData from "./BlockData";

interface PageData{
    // A unique identifier for a page. This stays the same regardless of where the page is moved in the document.
    // Can be useful for features like bookmarking, or anything anchored to content and not a page number
    uid: string;

    // An ordered list of the blocks that the page is made up of
    blocks: BlockData[];
}

export default PageData;