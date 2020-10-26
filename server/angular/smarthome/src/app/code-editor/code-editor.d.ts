export interface CodeEditor {
    setValue: (data: string) => void

    setOption(optino, value)

    eachLine(callback: (lineelement: LineElement) => void)

    markText(pos: MArkerPos, pos2: MArkerPos, options: MArkOptions)

    getValue(): string

    on(type: "change" | "cursorActivity", callback: (...args) => void)
    getMode(): string
    getAllMarks(): Array<{ clear: () => void }>
    setSelection(pos: SelecitonPos, pos2: SelecitonPos, options: {
        scroll?: boolean
    })
    getCursor(): MArkerPos

    getTokenAt(p: MArkerPos)
    registerHelper(type: string, name: string, value)
    setCursor(pos: SelecitonPos, opts?)

    firstLine(): number

    lastLine(): number

    indentSelection(method: "smart")
}

interface SelecitonPos extends MArkerPos {
    sticky?
}

interface MArkOptions {
    attributes: any
    css: string
}
interface MArkerPos {

    line: number
    ch: number
}

interface LineElement {
    text: String,
    lineNo(): number
}