//general code that is needed for every window we create
const fs = require('fs');
const { ipcRenderer } = require('electron');
var theme_style = document.getElementById("theme_style");

ipcRenderer.on('recvChannel', (_event, arg) => {
    switch (arg.cmd) {
        case "setTheme": {
            theme_style.href = arg.theme;
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
ipcRenderer.send('recvMain', { id: 0, cmd: "getTheme", requester: 1 });
ipcRenderer.send('recvMain', { id: 0, cmd: "getLang", requester: 1 });

/*Start of specific implementation */


const sequence_file_path = "./sequence.json";

var deleted_packets = [];
var sequence = { count: 0, continuous: false, packets: [] };
var packets_div = document.getElementById("packets_div");
const continuous_sequence = document.getElementById("continuous_sequence");
fs.readFile(sequence_file_path, 'utf8', (err, data) => {
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
    ipcRenderer.send('recvMain', { id: 0, cmd: "sendSequence", sequence: sequence_file_path });
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
            sequence.packets.push({
                data: newParserData.value.trim(),
                delay: newParserDelay.value.trim()
            });
        }
    }
    sequence.continuous = continuous_sequence.checked;
    updateSequence();
    try {
        fs.unlinkSync(sequence_file_path);
    }
    catch (err) {
        // needs to be a separate try catch because it will fail on the first time configuring
        console.log(err);
    }
    try {
        fs.writeFileSync(sequence_file_path, JSON.stringify(sequence));
    }
    catch (err) {
        console.log(err);
        ipcRenderer.send("openAlert", current_language["writing_error"]);
    }
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
    newPacketData.setAttribute("placeholder", current_language["packet_data_placeholder"]);
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
    newPacketExclude.setAttribute("class", "sequencer_button");
    newPacketExclude.setAttribute("style", "position: absolute;right:5px;");

    var newPacketExclude = document.createElement("img");
    newPacketExclude.setAttribute("width", "16");
    newPacketExclude.setAttribute("height", "16");
    newPacketExclude.setAttribute("src", "../images/trash-2-16.png");
    newPacketExclude.setAttribute("onclick", `deletePacketField(${sequence.count})`);

    var line = document.createElement("div");
    line.setAttribute("class", "line");
    var label = document.createElement("label");
    label.setAttribute("data-i18n", "packet");
    label.innerText = current_language["packet"];
    label.setAttribute("style", "min-width: 5%;");
    line.appendChild(label);
    line.appendChild(newPacketData);
    line.setAttribute("style", "width:100%");
    newPacketField.appendChild(line);

    line = document.createElement("div");
    line.setAttribute("class", "line");
    label = document.createElement("label");
    label.setAttribute("data-i18n", "delay");
    label.innerText = current_language["delay"];
    line.appendChild(label);
    line.appendChild(newPacketDelay);
    newPacketField.appendChild(line);

    newPacketField.appendChild(newPacketExclude);
    packets_div.appendChild(newPacketField);
    sequence.count++;
}