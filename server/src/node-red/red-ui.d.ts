

interface SubFlow {
    id: number
}

interface Workspace {
    id: string
}
interface FrontendNode {
    id: number
    z: number
    type: string
}
type TypeRegistration = {
    category: string;
    color?: string;
    defaults: Record<string, {
        value: unknown,
        required?: boolean,
        validate?: (v) => boolean,
        type?: "string" | "global" | "flow" | "msg"
    }>;
    inputs: number | boolean;
    outputs: number;
    icon?: string;
    label?: () => string;
    labelStyle?: () => string; //node_label_italic
    oneditsave?: (this: FrontendNode) => void
    oneditprepare?: (this: FrontendNode) => void;
};

interface Link {
    source: Node,
    sourcePort: number
    target: Node
}

export interface RedFrontend {

    sidebar: {
        addTab(options: {
            id: string,
            label: string,
            name: string,
            content: unknown,
            toolbar: unknown,
            enableOnEdit: true,
            pinned: true,
            iconClass: string,
            action: string
        })

        show(sideBarId: string)
    }

    nodes: {


        registerType(typeName: string, options: TypeRegistration): void

        filterNodes(options): Array<unknown>
        filterLinks(options): Array<Link>

        subflow(z: number): SubFlow

        dirty(unknow: boolean): void
        eachWorkspace(callback: (workspace: Workspace) => void)

        node(id: string): FrontendNode
    }

    workspaces: {
        active(): Workspace
    }

    history: {
        push(event): void
    }

    actions: {
        add(msgKeyOrSideBarAction: string, callback: () => void)
    }
    view: {
        redraw(): {

        }
        selectNodes()

        reveal(id: string): void
    }
    tray: {
        show(): void
    }
    editor: {
        validateNode(node: FrontendNode): void
    }
    settings: {
        get(key: string): unknown
    }

    events: {
        on(event: "workspace:change" | "project:change" | "nodes:add" | "nodes:remove" | "runtime-state" | "links:add", callback: (unknown) => void)
    }
    notify(message: string, level: "warning"): void

    _(msgKey: string, params: string): string

    utils: {
        sanitize(input: string): string
    }

    validators: {
        typedInput(type: "date" | "flow" | "num"): (v) => boolean
        number(): () => boolean
    }
}