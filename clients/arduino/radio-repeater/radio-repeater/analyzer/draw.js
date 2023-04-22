import * as data from "./data.json"
google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(() => {


    const chart = new google.visualization.BarChart(container);

    const ar = [["time", "high"]]

    let t = 0;

    for(const el of data) {
        ar.push([t + el.duration, el.toHight]);
    }

    const dataT = google.visualization.arrayToDataTable(ar);

    chart.draw(data, options);
});

