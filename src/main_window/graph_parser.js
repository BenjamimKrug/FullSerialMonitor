var graphsArray = [];
var graphWindow = false;

function setGraphsArray(newGraphsArray) {
    if (typeof newGraphsArray != "undefined")
        graphsArray = newGraphsArray;
}

function checkGraphTriggers(timestamp, target_line) {
    if (!graphWindow)
        return;
    var graphTriggerSize = graphsArray.length;
    for (var i = 0; i < graphTriggerSize; i++) {
        if (target_line.startsWith(graphsArray[i].trigger) == false)
            continue;
        try {
            ipcRenderer.send('recvMain', { id: 2, cmd: "newGraphData", time: timestamp.toString().slice(0,-1), value: target_line.replace(graphsArray[i].trigger, ""), position: i });
        } catch (e) {
            graphWindow = false;
        }

    }
}