// Internal imports
import BlockData from "./BlockData";

interface PageData{
    // A unique identifier for a page. This stays the same regardless of where the page is moved in the document.
    // Can be useful for features like bookmarking, or anything anchored to content and not a page number
    id?: string;

    // An enumerated object of the blocks that a page is made up of
    blocks: { [blockNum: number]: BlockData };
}

export default PageData;