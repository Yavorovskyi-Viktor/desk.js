// Internal imports
import DeskConfig from "../types/DeskConfig";

class Desk{
    constructor(config: DeskConfig){
        // Set configuration defaults. The default values for these are detailed in DeskConfig.ts
        config.holder = config.holder || "desk-editor";
        config.height = config.height || "85vh";
        config.width = config.width || "66vh";
    }
}

export default Desk;
