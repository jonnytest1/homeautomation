import { SenderFe, TransformFe } from '../../interfaces';
import { SettingsService } from '../../settings.service';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-transformer-drop-down',
    templateUrl: './transformer-drop-down.component.html',
    styleUrls: ['./transformer-drop-down.component.scss']
})
export class TransformerDropDownComponent implements OnInit {

    @Input()
    public data: SenderFe;

    @Input()
    transformer: TransformFe = {};

    @Output()
    transformerChange: EventEmitter<TransformFe> = new EventEmitter<TransformFe>();

    missingKeys: Array<string>;


    changeFnc;

    constructor(private service: SettingsService,
        private cdr: ChangeDetectorRef, private router: Router, private activeRoute: ActivatedRoute) {
    }

    ngOnInit() {
        this.transformerChange.subscribe((event: TransformFe) => {
            this.router.navigate([], {
                queryParams: {
                    transformer: event.id
                },
                queryParamsHandling: 'merge'
            });
        });

        const params = this.activeRoute.snapshot.queryParams;
        if (params.transformer) {
            this.transformer = this.data.transformation.find(transofmrer => transofmrer.id === +params.transformer) || this.transformer;
        }
        this.transformerChange.emit(this.transformer);

        this.service.senders$.subscribe(() => {
            this.service.getMissingSenderKeys(this.data.id).toPromise().then(keys => {
                this.missingKeys = keys;
                this.cdr.detectChanges();
            });
        });

    }
    concat(ar1: Array<string>, ar2: Array<TransformFe>): Array<string | TransformFe> {
        return [...(ar1 || []), ...ar2];
    }

    async checkNew(el: TransformFe) {
        this.transformerChange.emit(el);
        if (el.id === undefined) {
            const response = await this.service.createTransformer(el, this.data.id).toPromise();
            el.id = response.id;
            this.data.transformation.push(el);
            this.missingKeys.splice(this.missingKeys.indexOf(el.transformationKey), 1);
        }
        this.cdr.markForCheck();
    }

    transformationLoeschen(evt: MouseEvent) {

        evt.stopPropagation();
        evt.preventDefault();
    }
}
