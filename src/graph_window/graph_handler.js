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
const LIMIT = 100;

ipcRenderer.on('recvChannel', (_event, arg) => {
    switch (arg.cmd) {
        case "setTheme": {
            theme_style.href = arg.theme;
            if (arg.theme.includes("dark"))
                chart.background().fill("rgb(25, 25, 25)");
            else
                chart.background().fill("white");
            break;
        }
        case "createGraph": {
            createGraph(arg.name, arg.position + 1, arg.color);
        }
        case "newGraphData": {
            newData(arg.time, arg.value, arg.position + 1);
        }
    }
});

setInterval(function () { ipcRenderer.send('recvMain', { id: 0, cmd: "getTheme", requester: 2 }); }, 1000);
ipcRenderer.send('recvMain', { id: 0, cmd: "graphOpened", requester: 2 });


function createGraph(line_name, position, color) {
    // map the data for all series
    var newSeriesData = dataSet.mapAs({ x: 0, value: position });

    // create the series and name them
    var newSeries = chart.line(newSeriesData);
    newSeries.name(line_name);
    newSeries.normal().stroke(color);
    newSeries.hovered().stroke(color);
    newSeries.selected().stroke(color);
    lastKnownValues[position] = [0, 0];
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

    var lastKnownValue;
    var lkv_pos = dataLength - 1;
    for (; lkv_pos > 0; lkv_pos--) {
        lastKnownValue = data[lkv_pos][position];
        if (typeof (lastKnownValue) == "undefined")
            lastKnownValue = 0;
        if (!isNaN(lastKnownValue))
            break;
    }

    var difference = dataLength - lkv_pos;
    var step = (data[dataLength][position] - lastKnownValue) / difference;
    for (var i = lkv_pos; i < dataLength; i++) {
        if (isNaN(data[i][position]))
            data[i][position] = lastKnownValue + step;
        lastKnownValue = data[i][position];
    }
}

function newData(time, value, position) {
    value = parseFloat(value);
    var createNewLine = false;
    try {
        if (data[dataLength][0] == time) {
            data[dataLength][position] = value;
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
        data.push(newDataArray);
        dataLength++;
        if (dataLength > LIMIT) {
            data.shift();
            dataLength--;
        }
        fillEmptyValues(position);
    }
}

function drawGraph() {
    dataSet.data(data);
}

setInterval(drawGraph, 100);