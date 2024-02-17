var graphsArray = "";
var graphTriggerSize = 2;
var graphWindow = false;

const graph_tracker_file_path = "graph_tracker.json"

fs.readFile(graph_tracker_file_path, 'utf8', (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    graphsArray = JSON.parse(data);
});

function updateGraphTriggers() {
    if (!graphWindow)
        return;
    for (var i = 0; i < graphTriggerSize; i++) {
        if (graphsArray[i].created)
            continue;
        try {
            ipcRenderer.send('recvMain', { id: 2, cmd: "createGraph", name: graphsArray[i].name, position: i, color: graphsArray[i].color });
            graphsArray[i].created = true;
        } catch (e) {
            graphWindow = false;
        }

    }

}

function checkGraphTriggers(timestamp, target_line) {
    if (!graphWindow)
        return;
    for (var i = 0; i < graphTriggerSize; i++) {
        if (target_line.indexOf(graphsArray[i].trigger) == -1)
            continue;
        try {
            ipcRenderer.send('recvMain', { id: 2, cmd: "newGraphData", time: timestamp, value: target_line.replace(graphsArray[i].trigger, ""), position: i });
        } catch (e) {
            graphWindow = false;
        }

    }
}