

export interface NodeRed {
    registerType: () => {

    }
}


export declare let log;

export declare let init: (server, config) => void;
export declare let httpAdmin: (req, res) => void;
export declare let httpNode: (req, res) => void;
export declare let start: () => Promise<any>;
export declare let stop: () => Promise<any>;
export declare let validators

export declare let nodes: {
    createNode: (nodeSet: string, config) => void
    registerType

    /**
     *  (nodeSet: string, type: {
        category: string,
        defaults, label
    } | ((config) => void), constructor?, opts?) => void
     */
}


