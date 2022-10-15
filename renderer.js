const fs = require('fs');
const { ipcRenderer } = require('electron')
const { SerialPort } = require("serialport");
const { exec } = require("child_process");
const remote = require('@electron/remote');
const { FindInPage } = require('electron-find');
const { Console } = require('console');
const terminal = document.getElementById("terminal");
const sendInput = document.getElementById("sendInput");
const history = document.getElementById("history");
const autoScroll = document.getElementById("autoScroll");
const comPorts = document.getElementById("comPorts");
const comPorts_input = document.getElementById("comPorts_input");
const baudrate_input = document.getElementById("baudrate_input");
const lineEnding = document.getElementById("line_ending");
const addTimestamp = document.getElementById("addTimestamp");
const sendButton = document.getElementById("sendButton");
var log_addTimestamp = document.getElementById("log_addTimestamp");
var log_type = document.getElementById("log_type");
var log_folder = document.getElementById("log_folder");
var log_folder_input = document.getElementById("log_folder_input");
var decoder_folder = document.getElementById("decoder_folder");
var decoder_folder_input = document.getElementById("decoder_folder_input");
var config_menu = document.getElementById("config_menu");
var serialport = null;
var preferences = null;
var prev_preferences = null;
var lineStart = false;
var first_line = true;
let log_file_writer = null;
var pos = 0;
var input_history = [];
var prev_sendInput = "";
var current_line_index = 0;
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

function changeTimestamp() {
    for (var i = start_line_index; i < current_line_index; i++) {
        if (document.getElementById(i) != null)
            document.getElementById(i).style.display = addTimestamp.checked ? "inline" : "none";
    }
}

ipcRenderer.on('find_request', () => {
    findInPage.openFindWindow();
});

fs.readFile("./preferences.json", 'utf8', (err, data) => {
    if (err) {
        return;
    }
    preferences = JSON.parse(data);
    if (preferences != null) {
        if (typeof (preferences.comPort) !== 'undefined')
            comPorts.value = preferences.comPort;
        if (typeof (preferences.baudrate) !== 'undefined')
            baudrate_input.value = preferences.baudrate;
        if (typeof (preferences.autoScroll) !== 'undefined')
            autoScroll.checked = preferences.autoScroll;
        if (typeof (preferences.addTimestamp) !== 'undefined')
            addTimestamp.checked = preferences.addTimestamp;
        if (typeof (preferences.logFolder) !== 'undefined')
            log_folder_input.value = preferences.logFolder;
        if (typeof (preferences.decoderFolder) !== 'undefined')
            decoder_folder_input.value = preferences.decoderFolder;
        if (typeof (preferences.logType) !== 'undefined')
            log_type.value = preferences.logType;
        if (typeof (preferences.logAddTimestamp) !== 'undefined')
            log_addTimestamp.checked = preferences.logAddTimestamp;
    }
    prev_preferences = preferences;
});

function backupPreferences() {
    if (typeof (prev_preferences.comPort) !== 'undefined')
        comPorts.value = prev_preferences.comPort;
    if (typeof (prev_preferences.baudrate) !== 'undefined')
        baudrate_input.value = prev_preferences.baudrate;
    if (typeof (prev_preferences.autoScroll) !== 'undefined')
        autoScroll.checked = prev_preferences.autoScroll;
    if (typeof (prev_preferences.addTimestamp) !== 'undefined')
        addTimestamp.checked = prev_preferences.addTimestamp;
    if (typeof (prev_preferences.logFolder) !== 'undefined')
        log_folder_input.value = prev_preferences.logFolder;
    if (typeof (prev_preferences.decoderFolder) !== 'undefined')
        decoder_folder_input.value = prev_preferences.decoderFolder;
    if (typeof (prev_preferences.logType) !== 'undefined')
        log_type.value = prev_preferences.logType;
    if (typeof (prev_preferences.logAddTimestamp) !== 'undefined')
        log_addTimestamp.checked = prev_preferences.logAddTimestamp;
}

function readDirPaths(log, decoder) {
    if (log) {
        if (typeof (log_folder.files[0]) !== 'undefined') {
            var logFolderPath = log_folder.files[0].path;
            log_folder_input.value = logFolderPath.substring(0, logFolderPath.lastIndexOf('\\') + 1);
        }
        else
            window.alert("Folder completly empty, must have at least one file");
    }
    if (decoder) {
        if (typeof (decoder_folder.files[0]) !== 'undefined') {
            var decoderFolderPath = decoder_folder.files[0].path;
            decoder_folder_input.value = decoderFolderPath.substring(0, decoderFolderPath.lastIndexOf('\\') + 1);
        }
        else
            window.alert("Folder completly empty, must have at least one file");
    }
}

function updatePreferences() {
    preferences.logFolder = log_folder_input.value;
    preferences.decoderFolder = decoder_folder_input.value;
    preferences.logType = log_type.value;
    preferences.logAddTimestamp = log_addTimestamp.checked;
    preferences.autoScroll = autoScroll.checked;
    if (preferences.autoScroll == true)
        terminal.scrollTop = terminal.scrollHeight;
    preferences.addTimestamp = addTimestamp.checked;
    preferences.comPort = comPorts.value;
    preferences.baudrate = baudrate_input.value;
    fs.writeFile("./preferences.json", JSON.stringify(preferences), (err) => {
        if (err)
            window.alert("Error on writing preferences file:", err);
    });
    prev_preferences = preferences;
}

document.getElementById("open_config_menu").onclick = function () {
    prev_preferences = preferences;
    if (config_menu.style.display != "none")
        config_menu.style.display = "none";
    else
        config_menu.style.display = "block";
};

function getPorts() {
    var returnList = "";
    SerialPort.list().then(function (ports) {
        ports.forEach(function (port) {
            returnList += "<option>" + port.path + "</option>";
        });
        comPorts.innerHTML = returnList;
    });
}

function connect() {
    var data = { "comPort": comPorts.value, "baudrate": baudrate_input.value }
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
        sendButton.disabled = false;
        sendInput.disabled = false;
        lineEnding.disabled = false;
        if (log_type.value != 'none' && fs.existsSync(log_folder_input.value)) {
            log_file_writer = fs.createWriteStream(log_folder_input.value + "log.txt", {
                flags: log_type.value
            });
        }
        else
            window.alert("Folder for the Log file does not exist");
    });
    serialport.on("close", function (err) {
        sendButton.disabled = true;
        sendInput.disabled = true;
        lineEnding.disabled = true;
        if (err) {
            window.alert("Port disconnected: " + err);
            return;
        }
    });
    serialport.on("readable", function () {
        recvData(serialport.read().toString());
    });
}

function recvData(payload) {
    var message = payload;
    let date = new Date();
    var tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    var dateISO = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
    var current_datetime = dateISO.match(/\d\d:\d\d:\d\d.\d\d\d/);
    if (first_line == true) {
        var message_start = "<a id='" + current_line_index;
        current_line_index++;
        if (addTimestamp.checked == false)
            message_start += "' style='display:none";
        message_start += "'>" + current_datetime + "-> </a>" + message;
        message = message_start;
        if (log_addTimestamp.checked)
            payload = current_datetime + "->" + payload;
        first_line = false;
    }
    if (lineStart == true) {
        var message_new_line = "<br><a id='";
        message_new_line += current_line_index;
        current_line_index++;
        if (addTimestamp.checked == false)
            message_new_line += "' style='display:none";
        message_new_line += "'>" + current_datetime + "-> </a>" + message;

        if (log_addTimestamp.checked)
            payload = current_datetime + "->" + payload;
        lineStart = false;
    }
    var index = message.indexOf("\n");
    var m_length = message.length;
    while (index > -1) {
        var message_new_line = "<br>";
        var payload_new_line = "";
        let date = new Date();
        message_new_line = "<br><a id='";
        message_new_line += current_line_index;
        if (addTimestamp.checked == false)
            message_new_line += "' style='display:none";
        message_new_line += "'>" + current_datetime + "-> </a>";

        if (log_addTimestamp.checked)
            payload_new_line = "\r\n" + current_datetime + "->";
        if (index == m_length)
            lineStart = true;

        current_line_index++;
        message = message.replace('\n', message_new_line);
        payload = payload.replace(/(?:\r\n|\n)/g, payload_new_line);
        index = message.indexOf("\n");
    }

    if (log_file_writer != null)
        log_file_writer.write(payload);
    history.innerHTML += message;
    if (preferences.autoScroll == true)
        terminal.scrollTop = terminal.scrollHeight;
}

sendInput.addEventListener("keydown", (event) => {
    switch (event.code) {
        case 'ArrowUp':
            if (pos == input_history.length)
                prev_sendInput = sendInput.value;
            if (pos > 0)
                pos--;
            if (input_history[pos] != undefined)
                sendInput.value = input_history[pos];
            break;
        case 'ArrowDown':
            if (pos <= input_history.length)
                pos++;
            if (input_history[pos] != undefined)
                sendInput.value = input_history[pos];
            else
                sendInput.value = prev_sendInput;
            break;
        case "Enter":
            if (event.ctrlKey == true)
                sendData();
            break;
    }
    // do something
});

function sendData() {
    var line_end = "";
    if (lineEnding.value == "\\n")
        line_end = "\n";
    if (lineEnding.value == "\\r")
        line_end = "\r";
    if (lineEnding.value == "\\r\\n")
        line_end = "\r\n";
    var data = Buffer.from(sendInput.value + line_end, "utf-8");
    serialport.write(data, function (err) {
        if (err) {
            window.alert('Error on write: ', err.message);
            return;
        }
    });
    input_history.push(sendInput.value);
    pos++;
    sendInput.value = "";
}

function cleanTerminal() {
    history.innerHTML = "";
    first_line = true;
    start_line_index = current_line_index + 1;
}
getPorts();

//"C:\Users\benja\AppData\Local\Arduino15\packages\esp32\tools\xtensa-esp32-elf-gcc\gcc8_4_0-esp-2021r2-patch3\bin\xtensa-esp32-elf-addr2line.exe"
var addr2line_path = "\\packages\\esp32\\tools\\xtensa-esp32-elf-gcc\\gcc8_4_0-esp-2021r2-patch3\\bin\\xtensa-esp32-elf-addr2line.exe";
var elf_path = "C:\\Users\\benja\\Documents\\Arduino\\teste_serial_cam\\build\\esp32.esp32.esp32\\teste_serial_cam.ino.bin";
var memory_address = "0x400d27c8:0x3ffe2240";
var command = addr2line_path + " -pFiac -e" + elf_path + " " + memory_address;
//xtensa-esp32-elf-addr2line -pfiaC -e build/PROJECT.elf ADDRESS

/*
exec(command, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});
*/
