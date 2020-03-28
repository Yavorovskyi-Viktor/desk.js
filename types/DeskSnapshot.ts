import PageData from "./PageData";

interface DeskSnapshot {
    pages: { [pageNum: number]: PageData}
}

export default DeskSnapshot;