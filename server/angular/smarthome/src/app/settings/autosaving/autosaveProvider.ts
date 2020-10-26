import { Directive, Input } from '@angular/core';

@Directive({
    selector: '[autosaving-provider]',
})
export class AutosavingDirectiveProvider {

    @Input()
    public dataRef: string | number;

    @Input()
    public dataRefName = 'dataRef';

    @Input()
    public resource: string;

    constructor() { }
}
