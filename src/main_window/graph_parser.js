var graphsArray = [{ trigger: "valor", created: false, name: "VALOR" },{ trigger: "teste", created: false, name: "TESTE" }];
var graphTriggerSize = 2;
var graphWindow = false;

function updateGraphTriggers() {
    if (graphWindow) {
        for (var i = 0; i < graphTriggerSize; i++) {
            if (graphsArray[i].created == false) {
                try {
                    ipcRenderer.send('recvMain', { id: 2, cmd: "createGraph", name: graphsArray[i].name, position: i});
                    graphsArray[i].created = true;
                } catch (e) {
                    graphWindow = false;
                }
            }
        }
    }
}

function checkGraphTriggers(timestamp, target_line) {
    if (graphWindow) {
        for (var i = 0; i < graphTriggerSize; i++) {
            if (target_line.indexOf(graphsArray[i].trigger) > -1) {
                try {
                    ipcRenderer.send('recvMain', { id: 2, cmd: "newGraphData", time: timestamp, value: target_line.replace(graphsArray[i].trigger, ""), position: i });
                } catch (e) {
                    console.log("acabou");
                    graphWindow = false;
                }
            }
        }
    }
}