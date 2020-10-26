import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BatteryLevel } from '../../../../../../../models/battery';
import { GoogleCharts } from 'google-charts';
@Component({
  selector: 'app-battery',
  templateUrl: './battery.component.html',
  styleUrls: ['./battery.component.css']
})
export class BatteryComponent implements OnInit, AfterViewInit {

  @ViewChild('chartRef')
  chartRef: ElementRef<HTMLDivElement>;
  chart: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: Array<BatteryLevel>) { }

  ngOnInit() {

  }


  ngAfterViewInit() {

    GoogleCharts.load(() => {
      const dataTable: Array<Array<any>> = [['time', 'level', 'average', 'too low']];
      let smallest = Number.MAX_VALUE;
      const hasErrorDisplay = false;
      this.data
        .filter(b => b.level !== -1)
        .forEach(batteryLevel => {
          let below = true;
          const btls = [];
          JSON.parse(batteryLevel.amounts)
            .map(amt => +amt)
            .forEach(amt => {
              if (amt > 1900) {
                below = false;
              }
              const btAr = [new Date(batteryLevel.timestamp), amt, batteryLevel.level, null];
              btls.push(btAr);
              dataTable.push(btAr);
              if (amt < smallest) {
                smallest = amt;
              }
            });
          if (below) {
            btls.forEach(ar => {
              ar[3] = ar[2];
              ar[2] = null;
            });
          }
          if (!dataTable[dataTable.length - 4][2] !== !dataTable[dataTable.length - 3][2] && typeof dataTable[dataTable.length - 4][2] !== 'string') {
            dataTable[dataTable.length - 3][2] = dataTable[dataTable.length - 3][3];
          }
        });
      if (!hasErrorDisplay) {
        dataTable[1][3] = dataTable[1][1];
      }
      const data = GoogleCharts.api.visualization.arrayToDataTable(dataTable);
      this.chart = new GoogleCharts.api.visualization.ComboChart(this.chartRef.nativeElement);
      this.chart.draw(data, {
        vAxis: { title: 'level', minValue: smallest - 10 },
        seriesType: 'scatter',
        series: {
          1: { type: 'line', color: 'green' },
          2: { type: 'line', color: 'red' }
        }
      });
    });

  }

}
