import type { OnDestroy, OnInit } from '@angular/core';
import { Component, ViewChild, ElementRef, Input } from '@angular/core';

import { BaseComponent } from '../base/base.component';
import type { DataTable, LineChartInstance } from '../../../type/google-charts-types';
import { GoogleChartImport } from '../../../type/google-charts-types';
import { DiagramConfig } from '../shortcut-config';
import { SettingsService } from '../../settings.service';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject, combineLatest, interval } from 'rxjs';
import type { NumberSymbol } from '@angular/common';


@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css'], standalone: true
})
export class DiagramComponent extends BaseComponent implements OnInit, OnDestroy {
  @ViewChild('chartRef')
  chartRef: ElementRef<HTMLDivElement>;


  @Input()
  config: DiagramConfig

  @Input()
  backgroundMode = false

  chart: LineChartInstance;

  destroyed = new Subject()

  constructor(private settings: SettingsService) {
    super()
  }


  ngOnInit() {
    GoogleChartImport.load(() => {

      this.chart = new GoogleChartImport.api.visualization.LineChart(this.chartRef.nativeElement);

      combineLatest([
        this.settings.receivers$.pipe(
          map(receivers => receivers[this.config.receiver]),
          filter(rec => !!rec?.events?.length)
        ),
        interval(1000)
      ])
        .pipe(
          map(([rec]) => {
            const dataTable: Array<Array<any>> = [['time', 'level']];

            let lastEvent: {
              timestamp: number,
              state: number
            }
            for (const event of rec.events ?? []) {
              const evtDAta = JSON.parse(event.data)
              const ts = new Date(event.timestamp)

              if (+ts > (Date.now() - (1000 * 60 * 60 * 24 * 1))) {



                if ("state" in evtDAta) {
                  if (lastEvent) {
                    const squareTs = new Date(lastEvent.timestamp - 10)
                    dataTable.push([squareTs, 1 - lastEvent.state])

                  }
                  lastEvent = {
                    timestamp: +ts,
                    state: evtDAta.state ? 1 : 0
                  }

                  dataTable.push([ts, evtDAta.state ? 1 : 0])
                } else {
                  lastEvent = {
                    timestamp: +ts,
                    state: 1
                  }

                  const squareTs = new Date(+ts - 10)
                  dataTable.push([squareTs, 0])
                  dataTable.push([ts, 1])


                  const squareTsAfter = new Date(lastEvent.timestamp + 10)
                  dataTable.push([squareTsAfter, 0])

                }
              }
            }
            if (lastEvent && lastEvent.state == 1) {
              const squareTs = new Date(Date.now() + (1000 * 60 * 60))

              dataTable.push([squareTs, 1 - lastEvent.state])
            } else {
              const squareTs = new Date(Date.now() + (1000 * 60 * 60))

              const lastEvtDAta = JSON.parse(rec.events[rec.events.length - 1].data)
              dataTable.push([squareTs, lastEvtDAta.state ? 1 : 0])

            }
            return dataTable
          }),
          filter(dataTable => dataTable.length > 1),
          map(dataAr => GoogleChartImport.api.visualization.arrayToDataTable(dataAr)),
          takeUntil(this.destroyed))
        .subscribe(rec => {
          this.drawChart(rec);
        })
    });
  }




  drawChart(data: DataTable) {
    this.chart.draw(data, {
      // curveType: "function",
      title: `${this.config.receiver} - ${this.config.actionName}`,
      animation: {
        easing: "out"
      }
      /*series: {
        1: {
          type: 'line',
          color: 'green',
          pointSize: 1,
        },
        2: {
          type: 'line',
          color: 'red',
          pointSize: 1,
        }
      }*/
    });
  }

  ngOnDestroy(): void {
    this.destroyed.next(true)
  }
}
