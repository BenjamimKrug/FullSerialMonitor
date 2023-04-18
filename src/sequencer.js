const fs = require('fs');
const { ipcRenderer } = require('electron')

var deleted_packets = [];
var sequence = { count: 0, continuous: false, packets: [] };
var packets_div = document.getElementById("packets_div");

const continuous_sequence = document.getElementById("continuous_sequence");

ipcRenderer.on('recvChannel', (_event, arg) => {
    console.log(arg) // prints "pong" in the DevTools console
})


fs.readFile("./sequence.json", 'utf8', (err, data) => {
    if (err) {
        return;
    }
    sequence = JSON.parse(data);
    continuous_sequence.checked = sequence.continuous;
    updateSequence();
});

function stopSequence() {
    ipcRenderer.send('recvMain', { id: 0, cmd: "stopSequence" });
}

function sendSequence() {
    ipcRenderer.send('recvMain', { id: 0, cmd: "sendSequence", sequence: "./sequence.json" });
}

function updateSequence() {
    sequence.count = 0;
    packets_div.innerHTML = "";
    for (var i = 0; i < sequence.packets.length; i++) {
        createPacketField(sequence.packets[i].data, sequence.packets[i].delay);
    }
}

function saveSequence() {
    sequence.packets = [];
    for (var i = 0; i < sequence.count; i++) {
        if (!deleted_packets.includes(i)) {
            var newParserData = document.getElementById("cpData" + i);
            var newParserDelay = document.getElementById("cpDelay" + i);
            console.log("data: ", newParserData);
            sequence.packets.push({
                data: newParserData.value.trim(),
                delay: newParserDelay.value.trim()
            });
        }
    }
    sequence.continuous = continuous_sequence.checked;
    updateSequence();
    fs.writeFile("./sequence.json", JSON.stringify(sequence), (err) => {
        if (err)
            window.alert("Error on writing sequence file:", err);
    });
}

function deletePacketField(id) {
    targetPacketField = document.getElementById(`cpDiv${id}`);
    packets_div.removeChild(targetPacketField);
    deleted_packets.push(id);
}

function createPacketField(data_packet, delay) {
    var newPacketField = document.createElement("div");
    newPacketField.setAttribute("id", "cpDiv" + sequence.count);
    newPacketField.setAttribute("class", "custom_parser_entry");

    var newPacketData = document.createElement("input");
    newPacketData.setAttribute("type", "text");
    newPacketData.setAttribute("placeholder", "packet data");
    newPacketData.setAttribute("id", "cpData" + sequence.count);
    newPacketData.setAttribute("class", "custom_parser_input");
    if (typeof (data_packet) !== 'undefined')
        newPacketData.setAttribute("value", data_packet);

    var newPacketDelay = document.createElement("input");
    newPacketDelay.setAttribute("type", "text");
    newPacketDelay.setAttribute("placeholder", "500");
    newPacketDelay.setAttribute("id", "cpDelay" + sequence.count);
    newPacketDelay.setAttribute("class", "custom_parser_input");
    if (typeof (delay) !== 'undefined')
        newPacketDelay.setAttribute("value", delay);

    var newPacketExclude = document.createElement("button");
    newPacketExclude.setAttribute("style", "position: absolute;right:5px");
    newPacketExclude.innerHTML = "Delete";
    newPacketExclude.setAttribute("onclick", `deletePacketField(${sequence.count})`);

    newPacketField.innerHTML = "Packet ";
    newPacketField.appendChild(newPacketData);
    newPacketField.appendChild(document.createElement("br"));
    newPacketField.innerHTML += "Delay";
    newPacketField.appendChild(newPacketDelay);
    newPacketField.appendChild(newPacketExclude);
    packets_div.appendChild(newPacketField);
    sequence.count++;
}