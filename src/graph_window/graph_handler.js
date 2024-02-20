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
var graph_legend = document.getElementById("graph_legend");

var graph_config = { range: [null, null], data_per_screen: 0, array: [] };
var prev_graph_config = graph_config;
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
    prev_graph_config = graph_config;
    updateGraphConfig();
});

ipcRenderer.send('recvMain', { id: 0, cmd: "getTheme", requester: 2 });
ipcRenderer.send('recvMain', { id: 0, cmd: "graphOpened", requester: 2 });
ipcRenderer.send('recvMain', { id: 0, cmd: "getLang", requester: 2 });


window.addEventListener('load', () => {
    chart = new Dygraph(graph_container, data, {
        showLabelsOnHighlight: true,
        connectSeparatedPoints: true,
        legendFormatter: legendFormatter,
        labelsDiv: graph_legend,
        legend: "follow",
        legendFollowOffsetX: 0,
        legendFollowOffsetY: 0
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
    for (var i = 0; i < graphTriggerSize; i++) {
        createGraphField(graph_config.array[i].name, graph_config.array[i].color, graph_config.array[i].trigger);
        lastKnownValues[i] = [0, 0];
        if (dataArraySize < i)
            dataArraySize = i;

        labels_array.push(graph_config.array[i].name);
        colors.push(graph_config.array[i].color);
    }
    chart.updateOptions({ labels: labels_array, colors: colors, valueRange: graph_config.range });
}

function newData(time, value, position) {
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
        for (var i = 0; i <= dataArraySize; i++)
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
        }
    }
    updateGraphConfig();
    fs.unlink(graph_config_file_path, (e) => { if (e) console.log(e) });
    fs.writeFile(graph_config_file_path, JSON.stringify(graph_config), (err) => {
        if (err)
            ipcRenderer.send("openAlert", current_language["writing_error"]);
    });

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

function legendFormatter(data) {
    if (data.x == null) {
        // This happens when there's no selection and {legend: 'always'} is set.
        return '<br>' + data.series.map(function (series) { return series.dashHTML + ' ' + series.labelHTML }).join('<br>');
    }

    var html = this.getLabels()[0] + ': ' + data.xHTML;
    data.series.forEach(function (series) {
        if (typeof series.yHTML == "undefined")
            return;
        if (!series.isVisible) return;
        var labeledData = `<label style='color:${series.color}'>${series.labelHTML}</label> : ${series.yHTML}`;
        if (series.isHighlighted) {
            labeledData = '<b>' + labeledData + '</b>';
        }
        html += '<br>' + series.dashHTML + ' ' + labeledData;
    });
    return html;
}

document.getElementById("open_config_menu").onclick = function () {
    if (config_menu.style.display != "none")
        config_menu.style.display = "none";
    else
        config_menu.style.display = "block";
};