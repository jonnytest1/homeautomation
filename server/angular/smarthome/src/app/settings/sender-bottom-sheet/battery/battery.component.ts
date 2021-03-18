import { SenderFe } from '../../interfaces';
import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GoogleCharts } from 'google-charts';
@Component({
  selector: 'app-battery',
  templateUrl: './battery.component.html',
  styleUrls: ['./battery.component.css']
})
export class BatteryComponent implements OnInit, AfterViewInit {

  @ViewChild('chartRef')
  chartRef: ElementRef<HTMLDivElement>;
  chart;

  smallest: number = Number.MAX_VALUE;

  constructor(@Inject(MAT_DIALOG_DATA) public sender: SenderFe) { }

  ngOnInit() {
    //
  }


  ngAfterViewInit() {

    GoogleCharts.load(() => {

      this.chart = new GoogleCharts.api.visualization.ComboChart(this.chartRef.nativeElement);

      let _props = this.sender.batteryEntries;
      Object.defineProperty(this.sender, "batteryEntries", {
        get: () => _props,
        set: (val) => {
          this.drawChart(this.prepareData());
          return _props = val;
        }
      })

      this.drawChart(this.prepareData());
    });
  }


  prepareData() {
    const dataTable: Array<Array<string>> = [['time', 'level', 'average', 'too low']];
    this.smallest = Number.MAX_VALUE;
    const hasErrorDisplay = false;
    this.sender.batteryEntries
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
            if (amt < this.smallest) {
              this.smallest = amt;
            }
          });
        if (below) {
          btls.forEach(ar => {
            ar[3] = ar[2];
            ar[2] = null;
          });
        }
        if (dataTable[dataTable.length - 4][2] !== 'string') {
          if (dataTable[dataTable.length - 4][2] == null && dataTable[dataTable.length - 3][2] != null) {
            dataTable[dataTable.length - 3][3] = dataTable[dataTable.length - 3][2]
          }
          if (dataTable[dataTable.length - 3][2] == null && dataTable[dataTable.length - 4][2] != null) {
            dataTable[dataTable.length - 3][2] = dataTable[dataTable.length - 3][3];
          }

        }


      });
    if (dataTable[1]) {
      if (!hasErrorDisplay) {
        dataTable[1][3] = dataTable[1][1];
      }
    } else {
      dataTable.shift()
    }

    return GoogleCharts.api.visualization.arrayToDataTable(dataTable);
  }



  drawChart(data) {
    this.chart.draw(data, {
      vAxis: { title: 'level', minValue: this.smallest - 10 },
      seriesType: 'scatter',
      pointSize: 3,
      series: {
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
      }
    });
  }
}
