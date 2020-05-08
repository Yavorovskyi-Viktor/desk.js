// External imports
import Delta from 'quill-delta';

interface PageData{
    // A unique identifier for a page. This stays the same regardless of where the page is moved in the document.
    // Can be useful for features like bookmarking, or anything anchored to content and not a page number
    uid?: string;

    // A delta object representing the content on the page
    delta?: Delta;
}

export default PageData;