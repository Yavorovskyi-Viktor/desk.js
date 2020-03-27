An open source word processor meant to match the basic featureset of word processors like Word and Google Docs. Most important are the following features:

- **Good** pagination
    - Overflowing the configured document height should start a new page
    - Pages should respect their existing whitespace
    - Each page should be queryable and independently rendered via an API
    - Performance should be fine with 1000+ pages (size of a large book)
- Beneath the surface block management
    - While the user just sees the document, internal document structure should allow for each block of text, and word in that block of text, to be independently styled.
    - Each block of text should have a UUID so that they can be referenced easily within a database
- API driven editing
    - There's a lot I could say about this, but it breaks down to the desire for the following pseudocodey API interaction
    - `editor.save(pageNum) -> {"page": 1, "blocks": {1: {...}}}` 
    

### Compatibility
Desk uses [KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key), which some older browsers don't support,  in it's event loop to trigger keyboard shortcuts and create blocks in the editor. [Check CanIUse](https://caniuse.com/#feat=keyboardevent-key) to see what browsers are compatible with Desk.