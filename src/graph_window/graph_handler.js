//general code that is needed for every window we create
const fs = require('fs');
const { ipcRenderer } = require('electron');
var theme_style = document.getElementById("theme_style");
var data = [];
var dataArraySize = 0;
var dataSet;
var dataLength = -1;
var lastKnownValues = [];
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
    lastKnownValues[position] = 0;
    if (dataArraySize < position)
        dataArraySize = position;
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

function fillEmptyValues(position) {
    if (dataLength < 2)
        return;
    if (typeof (dataSet.oc[dataLength - 1][position]) == "undefined")
        dataSet.oc[dataLength - 1][position] = NaN;

    if (isNaN(dataSet.oc[dataLength - 1][position])) {
        var lastKnownValue = lastKnownValues[position];
        if (typeof (lastKnownValue) == "undefined" || isNaN(lastKnownValue))
            lastKnownValue = 0;
        dataSet.oc[dataLength - 1][position] = (dataSet.oc[dataLength][position] + lastKnownValue) / 2;
    }
}

function newData(time, value, position) {
    console.time("newGraphData");
    value = parseFloat(value);
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
        for (var i = 0; i < dataArraySize; i++)
            newDataArray.push(NaN);
        newDataArray[position] = value;
        dataSet.append(newDataArray);
        lastKnownValues[position] = value;
        dataLength++;
        fillEmptyValues(position);
        if (dataLength >= 50) {
            dataSet.oc.shift();
            dataLength--;
        }

    }
    chart.draw();
    console.timeEnd("newGraphData");
}