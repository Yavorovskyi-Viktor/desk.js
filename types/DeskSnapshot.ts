import BlockData from "./BlockData";

interface PageSnapshot {
    blocks: { [blockNum: number]: BlockData }
}

interface DeskSnapshot {
    pages: { [pageNum: number]: PageSnapshot }
}

export { PageSnapshot, DeskSnapshot };