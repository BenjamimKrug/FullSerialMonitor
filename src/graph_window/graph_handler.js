//general code that is needed for every window we create
const fs = require('fs');
const { ipcRenderer } = require('electron');
const Dygraph = require('dygraphs');
const theme_style = document.getElementById("theme_style");
const graph_container = document.getElementById("graph_container");
const config_menu = document.getElementById("config_menu");
const graphs_list_div = document.getElementById("graphs_list_div");
const data_per_screen_input = document.getElementById("data_per_screen");
const range_inputs = [
    {
        value: document.getElementById("min_value"),
        auto: document.getElementById("min_auto")
    },
    {
        value: document.getElementById("max_value"),
        auto: document.getElementById("max_auto")
    }
];
for (var i = 0; i < 2; i++) {
    range_inputs[i].auto.addEventListener("change", (e) => {
        var value_input = document.getElementById(e.target.id.replace("_auto", "_value"));
        if (e.target.checked)
            value_input.disabled = true;
        else
            value_input.disabled = false;
    });
}

var dataArraySize = 0;
var data = [];
var dataLength = -1;
var lastKnownValues = [];
var chart;
var graph_inspector = document.getElementById("graph_inspector");
var graph_legend = document.getElementById("graph_legend");

var graph_config = { range: [null, null], data_per_screen: 0, array: [] };
var prev_graph_config = { ...graph_config };
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

const graph_config_file_path = "graph_config.json"

fs.readFile(graph_config_file_path, 'utf8', (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    graph_config = JSON.parse(data);
    prev_graph_config = { ...graph_config };
    updateGraphConfig();
});

ipcRenderer.send('recvMain', { id: 0, cmd: "getTheme", requester: 2 });
ipcRenderer.send('recvMain', { id: 0, cmd: "graphOpened", requester: 2 });
ipcRenderer.send('recvMain', { id: 0, cmd: "getLang", requester: 2 });


window.addEventListener('load', () => {
    chart = new Dygraph(graph_container, data, {
        showLabelsOnHighlight: true,
        connectSeparatedPoints: true,
        legend: "never",
        highlightCallback: inspectorFormatter,
        unhighlightCallback: hideInspector,
        highlightSeriesBackgroundAlpha: 1,
        highlightSeriesOpts: true
    });
});

function updateGraphConfig() {
    data_per_screen_input.value = graph_config.data_per_screen;
    for (var i = 0; i < 2; i++) {
        if (graph_config.range[i] != null) {
            range_inputs[i].value.disabled = false;
            range_inputs[i].value.value = graph_config.range[i];
            range_inputs[i].auto.checked = false;
        }
        else {
            range_inputs[i].value.disabled = true;
            range_inputs[i].value.value = 0;
            range_inputs[i].auto.checked = true;
        }
    }
    deleted_graphs = [];
    graphs_list_div.innerHTML = "";
    graph_count = 0;
    ipcRenderer.send('recvMain', { id: 0, cmd: "setGraphsArray", requester: 2, graphsArray: graph_config.array });
    var graphTriggerSize = graph_config.array.length;
    var labels_array = ['Time'];
    var colors = [];
    graph_legend.innerHTML = "";
    dataArraySize = graphTriggerSize;
    for (var i = 0; i < graphTriggerSize; i++) {
        var cur = graph_config.array[i];
        createGraphField(cur.name, cur.color, cur.trigger);
        lastKnownValues[i] = [0, 0];

        var color_label = document.createElement("div");
        color_label.setAttribute("class", "color_label");
        color_label.style["background-color"] = cur.color;
        var text_label = document.createElement("label");
        text_label.innerText = cur.name;
        graph_legend.appendChild(color_label);
        graph_legend.appendChild(text_label);

        labels_array.push(cur.name);
        colors.push(cur.color);
    }
    
    for (var l = 0; l < dataLength; l++) {
      var cur = data[l];
      while (cur.length <= dataArraySize) {
        cur.push(null);
      }
    }
    chart.updateOptions({ labels: labels_array, colors: colors, valueRange: graph_config.range, file: data });
}

function newData(time, value, position) {
    if (position == 0)
        return;
    time = time.split(':');
    time.push(time[2].split('.')[1]);
    let now = new Date();
    time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ...time);
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
            newDataArray.push(null);
        newDataArray[position] = value;
        data.push(newDataArray);
        dataLength++;
        if (graph_config.data_per_screen > 0) {
            while (dataLength > graph_config.data_per_screen) {
                data.shift();
                dataLength--;
            }
        }
    }
    chart.updateOptions({ 'file': data });
}

function saveGraphsConfig() {
    for (var i = 0; i < 2; i++) {
        if (range_inputs[i].auto.checked)
            graph_config.range[i] = null;
        else
            graph_config.range[i] = parseFloat(range_inputs[i].value.value.trim());
    }
    graph_config.data_per_screen = parseFloat(data_per_screen_input.value.trim());
    graph_config.array = [];
    for (var i = 0; i < graph_count; i++) {
        if (!deleted_graphs.includes(i)) {
            var newGraphName = document.getElementById("cgName" + i);
            var newGraphColor = document.getElementById("cgColor" + i);
            var newGraphTrigger = document.getElementById("cgTrigger" + i);
            graph_config.array.push({
                name: newGraphName.value.trim(),
                color: newGraphColor.value.trim(),
                trigger: newGraphTrigger.value.trim()
            });
            if (prev_graph_config.array[i] != undefined) {
                if (prev_graph_config.array[i].trigger != graph_config.array[i].trigger) {
                    // if the trigger changed we discard the last data, as we cannot keep it
                    for (var l = 0; l <= dataLength; l++) {
                        data[l][i + 1] = null;
                    }
                }
            }
            if (dataArraySize <= i) {
                for (var l = 0; l < dataLength; l++) {
                    data[l].push(null);
                }
            }
        }
        else {
            for (var l = 0; l < dataLength; l++) {
                data[l].splice(i + 1, 1);
            }
        }
    }
    updateGraphConfig(true);
    fs.unlink(graph_config_file_path, (e) => { if (e) console.log(e) });
    fs.writeFile(graph_config_file_path, JSON.stringify(graph_config), (err) => {
        if (err)
            ipcRenderer.send("openAlert", current_language["writing_error"]);
    });
    prev_graph_config = { ...graph_config };
}

function setGraphsConfig(newGraphsConfig) {
    if (typeof newGraphsConfig != "undefined")
        graph_config = newGraphsConfig;
    updateGraphConfig();
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

function inspectorFormatter(event, x, points, row, seriesName) {
    if (event.constructor.name != "MouseEvent") {
        graph_inspector.style.display = "none";
        return;
    }
    graph_inspector.style.display = "block";
    graph_inspector.innerHTML = "";
    var time_label = document.createElement("label");
    var date_x = new Date(x);
    time_label.innerText = date_x.toISOString().replace("T", " ").replace("Z", " ");
    graph_inspector.appendChild(time_label);
    for (var i = 0; i < points.length; i++) {
        var cur = points[i];
        var value = document.createElement("label");
        value.innerText = cur.name + ": " + cur.yval;
        graph_inspector.appendChild(document.createElement("br"));
        graph_inspector.appendChild(value);
    }
    var style = getComputedStyle(graph_inspector);
    var horizontal_compensantion = window.innerWidth - (event.screenX + parseFloat(style.width) + 15);
    if (horizontal_compensantion > 0)
        horizontal_compensantion = 0;

    var vertical_compensantion = window.innerHeight - (event.screenY + parseFloat(style.height) + 15);
    if (vertical_compensantion > 0)
        vertical_compensantion = 0;
    graph_inspector.style.left = event.screenX + horizontal_compensantion;
    graph_inspector.style.top = event.screenY + vertical_compensantion;
}

function hideInspector(event) {
    graph_inspector.style.display = "none";
}

document.getElementById("open_config_menu").onclick = function () {
    if (config_menu.style.display != "none")
        config_menu.style.display = "none";
    else
        config_menu.style.display = "block";
};