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
    console.log(graphsArray);
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