##⚠ Work in progress! This project is currently in initial development. Features enumerated here may not be finished yet!
 
## Concept
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

## Installation
- `npm install desk-editor.js`

## Usage   


### Get up and running
```html
<div id="my-editor">
</div>

<script src="desk.js"></script>
<script>
    const desk = new Desk({holder: "my-editor"});
</script>
```

### Configuration options
Configuration is passed in an object that corresponds to the interface `types/DeskConfig.ts`. The available properties and their usage are as follows:

| Property | Type | Default | Explanation |
| --- | --- | --- | --- 
| `holder` | `string` | `"desk-editor"` | The ID of the element in the DOM that the editor should go into. Must exist on the page already when you create the editor |
| `height` | `string` | `"1056px"` | The height of the document, as a valid CSS height string. Note that the defaults are chosen so that a desk document is automatically 815px x 1056px, which corresponds to an 8.5" x 11" document, the default document size in most word processors, like Microsoft Word and Google Docs |
| `width` | `string` | `"815px"` | The width of the document, as a valid CSS width string. |
| `pages` | `PageData[]` | `[]` | A list of pages to start with. This can be loaded in from an editor snapshot previously saved |
| `onPage` | `number` | `1` | The page number that the editor should be on when the document loads. Note that this is a page number as in a book or a word processor, not an index, which is to say it starts from 1. |
| `onChange` | `function` | N/A | A callback for when a change happens on the document |
| `spacing` | `string` | `"20px"` | The space between pages, as a valid CSS string |
| `margins` | Object where keys are "left", "right", "top", or "bottom", and values are numbers | `{"left": 15, "right": 15, "top": 15, "bottom": 15}` | The margins of a page in the editor, with numbers corresponding to pixels. Note that this must be numeric pixels, not any CSS property, because of the way overflow calculations are handled |
| `baseShortcuts` | List of shortcut objects | * | These are the default shortcuts of the editor. I recommend not changing this unless you specifically want to disable a common shortcut, such as bold. The defaults for this can be found in `src/Engine.ts` |
| `extraShortcuts` | List of shortcut objects | `[]` | This is where you should provide any extra or custom shortcuts you'd like to implement in the editor |
| `blockClass` | `string` | `"desk-block"` | The classname of a block in the editor | 
 
 \* The default shortcuts were too large to fit in the table. They're listed in `src/Engine.ts`
## Using the source

### Building
The build process should be very straightforward, just clone the repo, install dependencies from package.json, and use the provided webpack config to build.


## Compatibility
Desk uses [KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key), which some older browsers don't support,  in it's event loop to trigger keyboard shortcuts and create blocks in the editor. [Check CanIUse](https://caniuse.com/#feat=keyboardevent-key) to see what browsers are compatible with Desk.