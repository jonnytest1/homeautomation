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

    getTokenAt(p: MArkerPos): Token
    registerHelper(type: string, name: string, value)
    setCursor(pos: SelecitonPos, opts?)

    firstLine(): number

    lastLine(): number

    indentSelection(method: "smart")
}

type languageType = "property" | "variable"

interface Token {

    state: {
        cc: Array<Function>
        context,
        /**
         * offset from left
         */
        indented: number

        lastType: languageType
    }
    end: number
    start: number,
    string: string
    type: languageType
}

interface SelecitonPos extends MArkerPos {
    sticky?
}

interface MArkOptions {
    attributes
    css: string
}
interface MArkerPos {

    line: number
    ch: number
}

interface LineElement {
    text: string,
    lineNo(): number
}