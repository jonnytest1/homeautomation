import { ChangeDetectorRef, Component, ComponentRef, Input, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
    selector: 'app-view-template',
    templateUrl: './view-template.component.html',
    styleUrls: ['./view-template.component.less']
})
export class ViewTemplateComponent implements OnInit {

    @ViewChild('dynamic', {
        read: ViewContainerRef
    }) viewContainerRef: ViewContainerRef

    @ViewChild('dynamic') templateRef: TemplateRef<any>

    @Input()
    addingData: ComponentRef<any>

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.viewContainerRef.insert(this.addingData.hostView)
        this.addingData.hostView.markForCheck()
        this.cdr.markForCheck()
    }

}
