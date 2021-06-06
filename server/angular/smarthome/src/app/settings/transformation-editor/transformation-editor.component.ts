import { TransformFe } from '../interfaces';
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';

@Component({
    selector: 'app-transformation-editor',
    templateUrl: './transformation-editor.component.html',
    styleUrls: ['./transformation-editor.component.scss']
})
export class TransformationEditorComponent implements OnInit, AfterViewInit {

    @Input()
    title: string;

    @Input()
    transformer: TransformFe;

    @ViewChild('jsTransform', { read: NgModel })
    jsTransform: NgModel;

    constructor(private cdr: ChangeDetectorRef) {
        //
    }
    ngAfterViewInit(): void {
        this.jsTransform.control.markAsTouched();
        this.jsTransform.control.markAsDirty();
        this.cdr.detectChanges();
    }

    ngOnInit() {
        //
    }

}
