//general code that is needed for every window we create
const fs = require('fs');
const { ipcRenderer } = require('electron');
const Dygraph = require('dygraphs');
var theme_style = document.getElementById("theme_style");
var graph_container = document.getElementById("graph_container");
var config_menu = document.getElementById("config_menu");
var dataArraySize = 0;
var data = [[0, 0]];
var dataLength = -1;
var lastKnownValues = [];
var chart;

var graphsArray = [];
var deleted_graphs = [];
var graph_count = 0;

ipcRenderer.on('recvChannel', (_event, arg) => {
    switch (arg.cmd) {
        case "setTheme": {
            theme_style.href = arg.theme;
            break;
        }
        case "createGraph": {
            createGraph(arg.name, arg.position + 1, arg.color);
        }
        case "newGraphData": {
            newData(arg.time, arg.value, arg.position + 1);
        }
        case "setLang": {
            current_language = arg.lang;
            updateContentLang();
            break;
        }
        default:
            break;
    }
});

const graph_tracker_file_path = "graph_tracker.json"

fs.readFile(graph_tracker_file_path, 'utf8', (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    graphsArray = JSON.parse(data);
    updateGraphsArray();
});

ipcRenderer.send('recvMain', { id: 0, cmd: "getTheme", requester: 2 });
ipcRenderer.send('recvMain', { id: 0, cmd: "graphOpened", requester: 2 });
ipcRenderer.send('recvMain', { id: 0, cmd: "getLang", requester: 2 });


window.addEventListener('load', () => {
    chart = new Dygraph(graph_container, data, {
        drawPoints: true,
        showRoller: true,
        valueRange: [0.0, 1.2],
        labels: ['Time', 'Random']
    });
    /*// create a data set
    // create a line chart
    chart = anychart.line();
    // add a legend
    chart.legend().enabled(true);

    // specify where to display the chart
    chart.container("container");
    chart.background().fill("rgb(25, 25, 25)");
    chart.draw();*/
});

function updateGraphsArray() {
    ipcRenderer.send('recvMain', { id: 0, cmd: "setGraphsArray", requester: 2, graphsArray: graphsArray });
    var graphTriggerSize = graphsArray.length;
    for (var i = 0; i < graphTriggerSize; i++) {
        if (graphsArray[i].created)
            continue;
        createGraph(graphsArray[i].name, i, graphsArray[i].color);
        graphsArray[i].created = true;
    }
}

function createGraph(line_name, position, color) {
    /*// map the data for all series
    var newSeriesData = dataSet.mapAs({ x: 0, value: position });

    // create the series and name them
    var newSeries = chart.line(newSeriesData);
    newSeries.name(line_name);
    newSeries.normal().stroke(color);
    newSeries.hovered().stroke(color);
    newSeries.selected().stroke(color);*/
    lastKnownValues[position] = [0, 0];
    if (dataArraySize < position)
        dataArraySize = position;
}

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
    console.log(time, value, position);
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
    chart.setOptions({ 'file': data });
}

function saveGraphsArray() {
    graphsArray = [];
    for (var i = 0; i < graph_count; i++) {
        if (!deleted_graphs.includes(i)) {
            var newGraphName = document.getElementById("cgName" + i);
            var newGraphTrigger = document.getElementById("cgTrigger" + i);
            graphsArray.push({
                data: newGraphName.value.trim(),
                delay: newGraphTrigger.value.trim()
            });
        }
    }
    updateGraphsArray();
    fs.writeFile(graph_tracker_file_path, JSON.stringify(graphsArray), (err) => {
        if (err)
            ipcRenderer.send("openAlert", current_language["writing_error"]);
    });

}

function setGraphsArray(newGraphsArray) {
    if (typeof newGraphsArray != "undefined")
        graphsArray = newGraphsArray;
}


function deleteGraphField(id) {
    targetGraphField = document.getElementById(`cpDiv${id}`);
    Graphs_div.removeChild(targetGraphField);
    deleted_Graphs.push(id);
}

function createGraphField(name, trigger) {
    var newGraphField = document.createElement("div");
    newGraphField.setAttribute("id", "cpDiv" + graph_count);
    newGraphField.setAttribute("class", "custom_parser_entry");

    var newGraphData = document.createElement("input");
    newGraphData.setAttribute("type", "text");
    newGraphData.setAttribute("placeholder", "Graph data");
    newGraphData.setAttribute("id", "cgName" + graph_count);
    newGraphData.setAttribute("class", "custom_parser_input");
    if (typeof (name) !== 'undefined')
        newGraphData.setAttribute("value", name);

    var newGraphTrigger = document.createElement("input");
    newGraphTrigger.setAttribute("type", "text");
    newGraphTrigger.setAttribute("placeholder", "500");
    newGraphTrigger.setAttribute("id", "cgTrigger" + graph_count);
    newGraphTrigger.setAttribute("class", "custom_parser_input");
    if (typeof (Trigger) !== 'undefined')
        newGraphTrigger.setAttribute("value", trigger);



    var newGraphExclude = document.createElement("button");
    newGraphExclude.setAttribute("class", "sequencer_button");
    newGraphExclude.setAttribute("style", "position: absolute;right:5px;");

    var newGraphExclude_icon = document.createElement("img");
    newGraphExclude_icon.setAttribute("width", "16");
    newGraphExclude_icon.setAttribute("height", "16");
    newGraphExclude_icon.setAttribute("src", "../images/trash-2-16.png");
    newGraphExclude.appendChild(newGraphExclude_icon);
    newGraphExclude.innerHTML += current_language["delete"];
    newGraphExclude.setAttribute("onclick", `deleteGraphField(${graph_count})`);

    newGraphField.innerHTML = current_language["name"] + "&nbsp";
    newGraphField.appendChild(newGraphName);
    newGraphField.appendChild(document.createElement("br"));
    newGraphField.innerHTML += current_language["trigger"];
    newGraphField.appendChild(newGraphTrigger);
    newGraphField.appendChild(newGraphExclude);
    Graphs_div.appendChild(newGraphField);
    graph_count++;
}

document.getElementById("open_config_menu").onclick = function () {
    if (config_menu.style.display != "none")
        config_menu.style.display = "none";
    else
        config_menu.style.display = "block";
};