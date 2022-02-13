
import { Wiring } from '../wirings/wiring.a';

export abstract class UINode<T extends Wiring = Wiring> {


    constructor(public node: T) {

    }

    abstract getIcon(): string

}