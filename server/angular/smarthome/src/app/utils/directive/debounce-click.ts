import {
    Directive,
    EventEmitter,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, throttleTime } from 'rxjs/operators';

@Directive({
    selector: '[debouncedClick]'
})
export class DebounceClickDirective implements OnInit, OnDestroy {
    @Input()
    throttleTime = 500;

    @Output()
    debouncedClick = new EventEmitter();

    private clicks = new Subject();
    private subscription: Subscription;

    constructor() { }

    ngOnInit() {
        this.subscription = this.clicks.pipe(
            throttleTime(this.throttleTime)
        ).subscribe(e => {
            return this.debouncedClick.emit(e);
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    @HostListener('click', ['$event'])
    clickEvent(event) {
        event.preventDefault();
        event.stopPropagation();
        this.clicks.next(event);
    }
}