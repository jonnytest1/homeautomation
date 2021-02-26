import { ChangeDetectorRef, Component, Host, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { SenderFe, TransformFe } from '../interfaces';
import { SettingsComponent } from '../settings.component';
import { SettingsService } from '../settings.service';
import { BatteryComponent } from './battery/battery.component';
import { EventsComponent } from './events/events.component';
import { TimersComponent } from './timers/timers.component';

@Component({
	selector: 'app-sender-bottom-sheet',
	templateUrl: './sender-bottom-sheet.component.html',
	styleUrls: ['./sender-bottom-sheet.component.less']
})
export class SenderBottomSheetComponent implements OnInit {


	public transformer: TransformFe = {}
	title$: Observable<string>;
	constructor(@Inject(MAT_SNACK_BAR_DATA) public data: SenderFe,
		private service: SettingsService,
		private snackbarRef: MatSnackBarRef<any>, private dialog: MatDialog,
		private cdr: ChangeDetectorRef) {


		this.transformer = this.sort(this.data.transformation)[0] || {}

		this.title$ = this.service.getSenderTitleKeys(this.data.id);
	}

	isManual() {
		return this.data.type == "manual"
	}

	ngOnInit() {
	}


	displayTimers() {
		this.dialog.open(TimersComponent, {
			data: this.data,
			panelClass: 'unlimitedsnackbar',
		});
	}
	displayBattery() {
		this.dialog.open(BatteryComponent, {
			data: this.data,
			panelClass: 'unlimitedsnackbar',
		});
	}

	displayEvents() {
		this.dialog.open(EventsComponent, {
			data: this.data,
			panelClass: 'unlimitedsnackbar',
		});
	}

	async deleteSender() {
		await this.service.deleteSender(this.data.id).toPromise();
		this.snackbarRef.dismissWithAction()
	}
	async send() {
		const dataObj: { [key: string]: any } = {
			deviceKey: this.data.deviceKey
		};
		if (!this.isManual()) {
			//dataObj.testsend = true
		}
		if (this.data.transformationAttribute && this.transformer) {
			dataObj[this.data.transformationAttribute] = this.transformer.transformationKey
		}

		await this.service.send(dataObj).toPromise();
		if (this.transformer && this.transformer.tsTransformation.includes("delay")
			&& this.transformer.tsTransformation.includes("promise")) {
			this.displayTimers();
		}
	}

	sort(array: Array<TransformFe>): Array<TransformFe> {
		array.sort((tr1, tr2) => {
			return this.getHistoryCount(tr2) - this.getHistoryCount(tr1);
		})
		return array;
	}

	getHistoryCount(transformer: TransformFe) {
		if (transformer.historyCount === undefined) {
			transformer.historyCount = this.data.events.filter(event => {
				if (!event.parsedData) {
					event.parsedData = JSON.parse(event.data);
				}
				return event.parsedData.message == transformer.transformationKey
			}).length
		}
		return transformer.historyCount;
	}
}
