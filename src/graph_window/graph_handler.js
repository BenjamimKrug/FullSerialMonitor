//general code that is needed for every window we create
const fs = require('fs');
const { ipcRenderer } = require('electron');
const Dygraph = require('dygraphs');
const theme_style = document.getElementById("theme_style");
const graph_container = document.getElementById("graph_container");
const config_menu = document.getElementById("config_menu");
const graphs_list_div = document.getElementById("graphs_list_div");
var dataArraySize = 0;
var data = [];
var dataLength = -1;
var lastKnownValues = [];
var chart;
var LIMIT = 100;

var prev_graphsArray = null;
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
            createGraph(arg.name, arg.position, arg.color);
            break;
        }
        case "newGraphData": {
            newData(arg.time, arg.value, arg.position + 1);
            break;
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
    prev_graphsArray = graphsArray;
    updateGraphsArray();
});

ipcRenderer.send('recvMain', { id: 0, cmd: "getTheme", requester: 2 });
ipcRenderer.send('recvMain', { id: 0, cmd: "graphOpened", requester: 2 });
ipcRenderer.send('recvMain', { id: 0, cmd: "getLang", requester: 2 });


window.addEventListener('load', () => {
    chart = new Dygraph(graph_container, data, {
        drawPoints: true,
        showRoller: true,
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
    deleted_graphs = [];
    graphs_list_div.innerHTML = "";
    graph_count = 0;
    ipcRenderer.send('recvMain', { id: 0, cmd: "setGraphsArray", requester: 2, graphsArray: graphsArray });
    var graphTriggerSize = graphsArray.length;
    var labels_array = ['Time'];
    for (var i = 0; i < graphTriggerSize; i++) {
        createGraphField(graphsArray[i].name, graphsArray[i].color, graphsArray[i].trigger);
        createGraph(graphsArray[i].name, i, graphsArray[i].color);
        labels_array.push(graphsArray[i].name);
    }
    chart.updateOptions({ labels: labels_array});
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
    console.log(time);
    time = time.split(':');
    let now = new Date();
    time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ...time);
    console.log(time);
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
        fillEmptyValues(position);
    }
    chart.updateOptions({ 'file': data });
}

function saveGraphsArray() {
    graphsArray = [];
    for (var i = 0; i < graph_count; i++) {
        if (!deleted_graphs.includes(i)) {
            var newGraphName = document.getElementById("cgName" + i);
            var newGraphColor = document.getElementById("cgColor" + i);
            var newGraphTrigger = document.getElementById("cgTrigger" + i);
            graphsArray.push({
                name: newGraphName.value.trim(),
                color: newGraphColor.value.trim(),
                trigger: newGraphTrigger.value.trim()
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
    updateGraphsArray();
}

function deleteGraphField(id) {
    targetGraphField = document.getElementById(`cgDiv${id}`);
    graphs_list_div.removeChild(targetGraphField);
    deleted_graphs.push(id);
}

function createGraphField(name, color, trigger) {
    var newGraphField = document.createElement("div");
    newGraphField.setAttribute("id", "cgDiv" + graph_count);
    newGraphField.setAttribute("class", "custom_parser_entry");

    var newGraphName = document.createElement("input");
    newGraphName.setAttribute("type", "text");
    newGraphName.setAttribute("placeholder", current_language["graph_name_placeholder"]);
    newGraphName.setAttribute("id", "cgName" + graph_count);
    newGraphName.setAttribute("class", "custom_parser_input");
    if (typeof (name) !== 'undefined')
        newGraphName.setAttribute("value", name);

    var newGraphColor = document.createElement("input");
    newGraphColor.setAttribute("type", "color");
    newGraphColor.setAttribute("placeholder", current_language["graph_color_placeholder"]);
    newGraphColor.setAttribute("id", "cgColor" + graph_count);
    newGraphColor.setAttribute("class", "custom_parser_input");
    if (typeof (color) !== 'undefined')
        newGraphColor.setAttribute("value", color);

    var newGraphTrigger = document.createElement("input");
    newGraphTrigger.setAttribute("type", "text");
    newGraphTrigger.setAttribute("placeholder", current_language["graph_trigger_placeholder"]);
    newGraphTrigger.setAttribute("id", "cgTrigger" + graph_count);
    newGraphTrigger.setAttribute("class", "custom_parser_input");
    if (typeof (trigger) !== 'undefined')
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
    newGraphField.innerHTML += "&nbsp&nbsp&nbsp";
    newGraphField.appendChild(newGraphColor);
    newGraphField.appendChild(document.createElement("br"));
    newGraphField.innerHTML += current_language["trigger"];
    newGraphField.appendChild(newGraphTrigger);
    newGraphField.appendChild(newGraphExclude);
    graphs_list_div.appendChild(newGraphField);
    graph_count++;
}

document.getElementById("open_config_menu").onclick = function () {
    if (config_menu.style.display != "none")
        config_menu.style.display = "none";
    else
        config_menu.style.display = "block";
};