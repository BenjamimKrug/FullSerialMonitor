//general code that is needed for every window we create
const fs = require('fs');
const { ipcRenderer } = require('electron');
var theme_style = document.getElementById("theme_style");
var data = [];
var dataSet;
var dataLength = -1;
var chart;

ipcRenderer.on('recvChannel', (_event, arg) => {
    switch (arg.cmd) {
        case "setTheme": {
            theme_style.href = arg.theme;
            break;
        }
        case "createGraph": {
            createGraph(arg.name, arg.position + 1);
        }
        case "newGraphData": {
            newData(arg.time, arg.value, arg.position + 1);
        }
    }
});
ipcRenderer.send('recvMain', { id: 0, cmd: "getTheme", requester: 2 });
ipcRenderer.send('recvMain', { id: 0, cmd: "graphOpened", requester: 2 });


function createGraph(line_name, position) {
    // map the data for all series
    var newSeriesData = dataSet.mapAs({ x: 0, value: position });

    // create the series and name them
    var newSeries = chart.line(newSeriesData);
    newSeries.name(line_name);
}

anychart.onDocumentReady(function () {
    // create a data set
    dataSet = anychart.data.set(data);

    // create a line chart
    chart = anychart.line();
    // add a legend
    chart.legend().enabled(true);

    // specify where to display the chart
    chart.container("container");
    chart.draw();
});

function newData(time, value, position) {
    var createNewLine = false;
    try {
        if (dataSet.oc[dataLength][0] == time) {
            dataSet.oc[dataLength][position] = value;
        }
        else
            createNewLine = true;
    }
    catch (e) {
        createNewLine = true;
    }
    if (createNewLine) {
        var newDataArray = [time];
        newDataArray[position] = value;
        dataSet.append(newDataArray);
        dataLength++;
    }
    chart.draw();
}