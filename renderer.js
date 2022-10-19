const fs = require('fs');
const { ipcRenderer } = require('electron')
const { SerialPort } = require("serialport");
const remote = require('@electron/remote');
const { FindInPage } = require('electron-find');

const terminal = document.getElementById("terminal");
const output = document.getElementById("output");

//options menu elements
const auto_scroll = document.getElementById("auto_scroll");
const com_ports = document.getElementById("com_ports");
const com_ports_input = document.getElementById("com_ports_input");
const baudrate_input = document.getElementById("baudrate_input");
const add_timestamp = document.getElementById("add_timestamp");

//send data elements and variables
const send_input = document.getElementById("send_input");
const send_button = document.getElementById("send_button");
const line_ending = document.getElementById("line_ending");
var ctrl_enter = document.getElementById("ctrl_enter");
var pos = 0;
var input_history = [];
var prev_send_input = "";

var serialport = null;
var lineStart = false;
var first_line = true;
var current_line_index = 0;
var current_line = null;
var prev_line = null;
var start_line_index = 0;

// config UI of find interface
let findInPage = new FindInPage(remote.getCurrentWebContents(), {
    boxBgColor: '#333',
    boxShadowColor: '#467196',
    inputColor: '#aaa',
    inputBgColor: '#222',
    inputFocusColor: '#555',
    textColor: '#aaa',
    textHoverBgColor: '#555',
    caseSelectedColor: '#555',
    offsetRight: 202,
    offsetTop: 32,
    borderColor: '#467196',
    parent: terminal
});

ipcRenderer.on('find_request', () => {
    findInPage.openFindWindow();
});


//options menu handlers start
function changeTimestamp() {
    for (var i = start_line_index; i < current_line_index; i++) {
        if (document.getElementById(i) != null)
            document.getElementById(i).style.display = add_timestamp.checked ? "inline" : "none";
    }
}

function getPorts() {
    var returnList = "";
    SerialPort.list().then(function (ports) {
        ports.forEach(function (port) {
            returnList += "<option>" + port.path + "</option>";
        });
        com_ports.innerHTML = returnList;
    });
}

function connect() {
    var data = {comPort: com_ports.value, baudrate: baudrate_input.value }
    if (data.comPort != undefined && data.baudrate != undefined) {
        if (serialport != null && serialport.isOpen) {
            serialport.port.close().then((err) => {
                connectSerialPort(data);
            });
        }
        else
            connectSerialPort(data);
    }
    else
        window.alert("error: undefined value");
}


function disconnect() {
    if (serialport != null && serialport.isOpen) {
        serialport.port.close().then((err) => {
            sendButton.disabled = true;
            sendInput.disabled = true;
            lineEnding.disabled = true;
            if (log_file_writer != null)
                log_file_writer.close();
        });
    }
}

function cleanTerminal() {
    terminal.innerHTML = "";
    first_line = true;
    start_line_index = current_line_index;
}

function connectSerialPort(data) {
    updatePreferences();
    serialport = new SerialPort({ path: data.comPort, baudRate: parseInt(data.baudrate), hupcl: false });
    serialport.on('error', function (err) {
        window.alert("Error trying to open Port: " + err);
    });
    serialport.on("open", function (err) {
        if (err) {
            window.alert("Error on opening port:", err);
            return;
        }
        send_button.disabled = false;
        send_input.disabled = false;
        line_ending.disabled = false;
        if (log_type.value != 'none' && fs.existsSync(log_folder_input.value)) {
            log_file_writer = fs.createWriteStream(log_folder_input.value + "log.txt", {
                flags: log_type.value
            });
        }
        else
            window.alert("Folder for the Log file does not exist");
    });
    serialport.on("close", function (err) {
        send_button.disabled = true;
        send_input.disabled = true;
        line_ending.disabled = true;
        if (err) {
            window.alert("Port disconnected: " + err);
            return;
        }
    });
    serialport.on("readable", function () {
        recvData(serialport.read().toString());
    });
}
//options menu handlers end


//data receive handlers start
function recvData(payload) {
    var message = payload;
    let date = new Date();
    var tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    var dateISO = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
    var current_datetime = dateISO.match(/\d\d:\d\d:\d\d.\d\d\d/);
    if (first_line == true) {
        first_line = false;
        if (log_add_timestamp.checked)
            payload = current_datetime + "->" + payload;

        var message_new_line = document.createElement("a");
        message_new_line.setAttribute("id", 'l' + current_line_index);
        var timestamp = document.createElement("a");
        timestamp.innerHTML = current_datetime + "->";
        if (add_timestamp.checked == false)
            timestamp.setAttribute("style", "display:none");
        timestamp.setAttribute("id", current_line_index);
        message_new_line.innerHTML += message;
        terminal.appendChild(timestamp);
        terminal.appendChild(message_new_line);
        current_line_index++;
        current_line = message_new_line;
    }
    else {
        var index = message.indexOf("\n");
        var lastIndex = 0;
        var m_length = message.length;
        if (index > -1) {
            while (index > -1) {
                var chunk = message.substring(lastIndex, index);
                var payload_new_line = "";
                current_line.innerHTML += chunk;
                terminal.appendChild(document.createElement("br"));
                var message_new_line = document.createElement("a");
                message_new_line.setAttribute("id", 'l' + current_line_index);
                var timestamp = document.createElement("a");
                timestamp.innerHTML = current_datetime + "->";
                if (add_timestamp.checked == false)
                    timestamp.setAttribute("style", "display:none");
                timestamp.setAttribute("id", current_line_index);
                terminal.appendChild(timestamp);
                terminal.appendChild(message_new_line);

                if (log_add_timestamp.checked)
                    payload_new_line = "\r\n" + current_datetime + "->";

                if (index == m_length)
                    lineStart = true;

                payload = payload.replace(/(?:\r\n|\n)/g, payload_new_line);
                lastIndex = index + 1;
                index = message.indexOf("\n", lastIndex);
                prev_line = current_line;
                current_line = message_new_line;
                current_line_index++;
            }
            if (index < m_length) {
                var chunk = message.substring(lastIndex, m_length);
                current_line.innerHTML += chunk;
            }
        }
        else 
            current_line.innerHTML += message;
    }
    runParsers();

    if (log_file_writer != null)
        log_file_writer.write(payload);
    //terminal.innerHTML += message;
    if (auto_scroll.checked == true)
        terminal.scrollTop = terminal.scrollHeight;
}
//data receive handlers end

//Data sending handles start
send_input.addEventListener("keydown", (event) => {
    switch (event.code) { //
        case 'ArrowUp':
            if (pos == input_history.length)
                prev_send_input = send_input.value;
            if (pos > 0)
                pos--;
            if (input_history[pos] != undefined)
                send_input.value = input_history[pos];
            break;
        case 'ArrowDown':
            if (pos <= input_history.length)
                pos++;
            if (input_history[pos] != undefined)
                send_input.value = input_history[pos];
            else
                send_input.value = prev_send_input;
            break;
        case "Enter":
            if (event.ctrlKey == preferences.ctrlEnter)
                sendData();
            break;
    }
});

function sendData() {
    var line_end = "";
    if (line_ending.value == "\\n")
        line_end = "\n";
    if (line_ending.value == "\\r")
        line_end = "\r";
    if (line_ending.value == "\\r\\n")
        line_end = "\r\n";
    var data = Buffer.from(send_input.value + line_end, "utf-8");
    serialport.write(data, function (err) {
        if (err) {
            window.alert('Error on write: ', err.message);
            return;
        }
    });
    input_history.push(send_input.value);
    pos++;
    send_input.value = "";
}
//Data send handles end
getPorts();

