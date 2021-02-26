import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { GoogleCharts } from 'google-charts';
import { EventHistoryFe, SenderFe } from '../../interfaces';
@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit, AfterViewInit {

  @ViewChild('chartRef')
  chartRef: ElementRef<HTMLDivElement>;
  chart: any;



  constructor(@Inject(MAT_DIALOG_DATA) public sender: SenderFe) { }

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
    data.addColumn({
      type: 'string',
      role: 'tooltip',
      'p': { html: true }
    });

    const events = this.sender.events.filter(ev => {
      try {
        const dt = JSON.parse(ev.data)
        return !dt.test;
      } catch (e) {
        return true
      }
    });

    const one_week = 1000 * 60 * 60 * 24 * 7;
    const two_months = one_week * 8;

    let timedEvents = events
      .filter(ev => ev.type == "trigger" && ev.timestamp > (Date.now() - one_week))
    if (timedEvents.length < 3) {
      timedEvents = events
        .filter(ev => ev.type == "trigger" && ev.timestamp > (Date.now() - two_months))
    }

    timedEvents.forEach(ev => {

      const date = new Date(ev.timestamp);
      // const mins = new Date();
      const day = new Date();
      day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      day.setHours(0)
      day.setMinutes(0)
      day.setSeconds(0)
      day.setUTCMilliseconds(0)
      // mins.setHours(date.getHours())
      /// mins.setMinutes(date.getMinutes())
      // mins.setSeconds(date.getSeconds())
      const mins = [date.getHours(), date.getMinutes(), date.getSeconds()]
      let messgageEl = this.getMessageElement(ev);

      let msg = `
        <ul class="google-visualization-tooltip-item-list">
          <li class="google-visualization-tooltip-item">
            <span style="font-family:Arial;font-size:15px;color:#000000;opacity:1;margin:0;font-style:none;text-decoration:none;font-weight:none;">
              Time of Day
            </span>
          </li>
          <li class="google-visualization-tooltip-item">
            <span style="font-family:Arial;font-size:15px;color:#000000;opacity:1;margin:0;font-style:none;text-decoration:none;font-weight:bold;">
              ${date.toLocaleDateString()}, ${date.toLocaleTimeString()}
            </span>
          </li>
          ${messgageEl}
        </ul>`;

      //
      data.addRow([day, mins, msg])
      //dataTable.push([day, mins])
    })
    return data;//GoogleCharts.api.visualization.arrayToDataTable(dataTable);
  }
  private getMessageElement(ev: EventHistoryFe) {
    try {
      const dt = JSON.parse(ev.data);
      const msg = dt.message;
      if (!msg) {
        return ''
      }


      let messgageEl = `
        <li class="google-visualization-tooltip-item">
          <table style="margin-left: -4px;">
            <tr>
              <td>
                <span style="font-family:Arial;font-size:15px;color:#000000;opacity:1;margin:0;font-style:none;text-decoration:none;font-weight:none;">
                  message
                </span>
              </td>
              <td>
                <span style="font-family:Arial;font-size:15px;color:#000000;opacity:1;margin:0;font-style:none;text-decoration:none;font-weight:bold;">
                  ${msg}
                </span>
              </td>
            </tr>
            ${this.getTransformerElement(msg)}
          </table>
        </li>
      `;
      return messgageEl;
    } catch (e) {
      return ''
    }
  }

  getTransformerElement(trKey) {
    try {
      const tr = this.sender.transformation.find(tr => tr.transformationKey == trKey);
      if (tr) {
        return `
          <tr>
            <td style="padding-top:8px;padding-right: 8px;">
              <span style="font-family:Arial;font-size:15px;color:#000000;opacity:1;margin:0;font-style:none;text-decoration:none;font-weight:none;">
                transformer
              </span>
            </td>
            <td style="padding-top:8px;padding-right: 8px;">
              <span style="font-family:Arial;font-size:15px;color:#000000;opacity:1;margin:0;font-style:none;text-decoration:none;font-weight:bold;">
              ${tr.name}
              </span>
            </td>
          </tr>`;
      }
      return ''
    } catch (e) {
      return '';
    }
  }

  drawChart(data) {
    this.chart.draw(data, {
      vAxis: { title: 'Time of Day', gridlines: { count: 12 } },
      hAxis: {
        title: "Day of Week"
      },
      tooltip: { isHtml: true },
      seriesType: 'scatter',
      series: {
        1: { type: 'line', color: 'green' },
        2: { type: 'line', color: 'red' }
      }
    });
  }
}
