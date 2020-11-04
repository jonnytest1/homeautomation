import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { GoogleCharts } from 'google-charts';
import { Sender } from '../../interfaces';
@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit, AfterViewInit {

  @ViewChild('chartRef')
  chartRef: ElementRef<HTMLDivElement>;
  chart: any;



  constructor(@Inject(MAT_DIALOG_DATA) public sender: Sender) { }

  ngOnInit() {
  }
  ngAfterViewInit(): void {
    GoogleCharts.load(() => {

      this.chart = new GoogleCharts.api.visualization.ComboChart(this.chartRef.nativeElement);

      let _props = this.sender.events;
      Object.defineProperty(this.sender, "events", {
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
    const dataTable: Array<Array<any>> = [['day', 'mins']];
    var data = new GoogleCharts.api.visualization.DataTable();
    data.addColumn('date', 'Emails Received');
    data.addColumn('timeofday', 'Time of Day');
    data.addColumn({ type: 'string', role: 'tooltip' });
    this.sender.events
      .filter(ev => ev.type == "trigger" && ev.timestamp > (Date.now() - (1000 * 60 * 60 * 24 * 7)))
      .filter(ev => {
        try {
          const dt = JSON.parse(ev.data)
          return !dt.test;
        } catch (e) {
          return true
        }
      })
      .forEach(ev => {
        let msg = '';
        try {
          const dt = JSON.parse(ev.data)
          msg = dt.message;

          if (msg) {
            const tr = this.sender.transformation.find(tr => tr.transformationKey == msg);
            if (tr) {
              msg += " " + tr.name;
            }
          }
        } catch (e) {

        }
        const date = new Date(ev.timestamp);
        // const mins = new Date();
        const day = new Date();
        day.setFullYear(date.getFullYear(), date.getUTCMonth(), date.getUTCDate());
        day.setHours(0)
        day.setMinutes(0)
        day.setSeconds(0)
        day.setUTCMilliseconds(0)
        // mins.setHours(date.getHours())
        /// mins.setMinutes(date.getMinutes())
        // mins.setSeconds(date.getSeconds())
        const mins = [date.getHours(), date.getMinutes(), date.getSeconds()]
        data.addRow([day, mins, `${msg}`])
        //dataTable.push([day, mins])
      })
    return data;//GoogleCharts.api.visualization.arrayToDataTable(dataTable);
  }
  drawChart(data) {
    this.chart.draw(data, {
      vAxis: { title: 'Time of Day' },
      hAxis: {
        title: "Day of Week"
      },
      seriesType: 'scatter',
      series: {
        1: { type: 'line', color: 'green' },
        2: { type: 'line', color: 'red' }
      }
    });
  }
}
