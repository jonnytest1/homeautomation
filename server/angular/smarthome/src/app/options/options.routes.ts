import { Route } from '@angular/router';
import { OptionsComponent } from './options.component';
import { OptionsModule } from './options.module';

export const routes: Array<Route> = [
    {
        path: '',
        component: OptionsComponent
    }
];
