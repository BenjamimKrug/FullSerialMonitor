//general code that is needed for every window we create
const fs = require('fs');
const { ipcRenderer } = require('electron');
var theme_style = document.getElementById("theme_style");
var data = [];
var dataSet;
var chart;

ipcRenderer.on('recvChannel', (_event, arg) => {
    switch (arg.cmd) {
        case "setTheme": {
            theme_style.href = arg.theme;
            break;
        }
        case "newGraph": {
            arg.name;
        }
        case "newGraphData":{
            newData(arg.time, arg.value, arg.position);
        }
    }
});
ipcRenderer.send('recvMain', { id: 0, cmd: "getTheme", requester: 2 });


function createGraph() {
    // create a data set
    dataSet = anychart.data.set(data);

    // create a line chart
    chart = anychart.line();

    // map the data for all series
    var firstSeriesData = dataSet.mapAs({ x: 0, value: 1 });


    // create the series and name them
    var firstSeries = chart.line(firstSeriesData);
    firstSeries.name("Roger Federer");

    // add a legend
    chart.legend().enabled(true);

    // specify where to display the chart
    chart.container("container");
    chart.draw();
}

/*Start of specific implementation */

anychart.onDocumentReady(createGraph);

function newData(time, value, position) {
    dataSet.append([time, value]);
    chart.draw();
}