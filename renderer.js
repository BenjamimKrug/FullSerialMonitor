const fs = require('fs');
const { BrowserWindow } = require('electron');
const { SerialPort } = require("serialport");
const { exec } = require("child_process");
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
var log_autoScroll = document.getElementById("log_autoScroll");
var log_type = document.getElementById("log_type");
var log_folder = document.getElementById("log_folder");
var log_folder_input = document.getElementById("log_folder_input");
var decoder_folder = document.getElementById("decoder_folder");
var decoder_folder_input = document.getElementById("decoder_folder_input");
var config_menu = document.getElementById("config_menu");
var serialport = null;
var preferences = null;
var prev_preferences = null;
var lineStart = true;
let log_file_writer = null;

fs.readFile("./preferences.json", 'utf8', (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    preferences = JSON.parse(data);
    if (preferences != null) {
        if (typeof (preferences.comPort) !== 'undefined')
            comPorts_input.value = preferences.comPort;
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
        if (typeof (preferences.logAutoScroll) !== 'undefined')
            log_autoScroll.checked = preferences.logAutoScroll;
    }
    prev_preferences = preferences;
});

function backupPreferences() {
    if (typeof (prev_preferences.comPort) !== 'undefined')
        comPorts_input.value = prev_preferences.comPort;
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
    if (typeof (prev_preferences.logAutoScroll) !== 'undefined')
        log_autoScroll.checked = prev_preferences.logAutoScroll;
}

function readDirPaths() {
    if (typeof (log_folder.files[0]) !== 'undefined') {
        var logFolderPath = log_folder.files[0].path;
        log_folder_input.value = logFolderPath.substring(0, logFolderPath.lastIndexOf('\\') + 1);
        console.log(log_folder_input.value);
    }
    else
        window.alert("Folder completly empty, must have at least one file");
    if (typeof (decoder_folder.files[0]) !== 'undefined') {
        var decoderFolderPath = decoder_folder.files[0].path;
        decoder_folder_input.value = decoderFolderPath.substring(0, decoderFolderPath.lastIndexOf('\\') + 1);
        console.log(decoder_folder_input.value);
    }
    else
        window.alert("Folder completly empty, must have at least one file");
}

function updatePreferences() {
    preferences.logFolder = log_folder_input.value;
    preferences.decoderFolder = decoder_folder_input.value;
    preferences.logType = log_type.value;
    preferences.logAutoScroll = log_autoScroll.checked;
    preferences.autoScroll = autoScroll.checked;
    if (preferences.autoScroll == true)
        terminal.scrollTop = terminal.scrollHeight;
    preferences.addTimestamp = addTimestamp.checked;
    preferences.comPort = comPorts_input.value;
    preferences.baudrate = baudrate_input.value;
    fs.writeFile("./preferences.json", JSON.stringify(preferences), (err) => {
        if (err)
            console.log(err);
        else {
            console.log("File written successfully\n");
        }
    });
    prev_preferences = preferences;
}

document.getElementById("open_config_menu").onclick = function () {
    prev_preferences = preferences;
    if (config_menu.style.display != "none") {
        config_menu.style.display = "none";
    } else {
        config_menu.style.display = "block";
    }
};

function getPorts() {
    var returnList = "<option value='customOption'>[custom value]</option>";
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
        console.log("error: undefined value");
}


function disconnect() {
    if (serialport != null && serialport.isOpen) {
        serialport.port.close().then((err) => {
            console.log("disconnected");
            sendButton.disabled = true;
            sendInput.disabled = true;
            lineEnding.disabled = true;
        });
    }
}

function connectSerialPort(data) {
    updatePreferences();
    serialport = new SerialPort({ path: data.comPort, baudRate: parseInt(data.baudrate), hupcl: false });
    serialport.on('error', function (err) {
        console.log("erro", err);
        window.alert("Error trying to open Port: " + err);
    });
    serialport.on("open", function (err) {
        if (err) {
            console.log("erro", err);
            return;
        }
        sendButton.disabled = false;
        sendInput.disabled = false;
        lineEnding.disabled = false;
        log_file_writer = fs.createWriteStream(log_folder_input.value + "log.txt", {
            flags: 'w'
        });
    });
    serialport.on("close", function (err) {
        sendButton.disabled = true;
        sendInput.disabled = true;
        lineEnding.disabled = true;
        if (err) {
            window.alert("Port disconnected: " + err);
            return;
        }
        console.log("desconectado");
    });
    serialport.on("readable", function () {
        recvData(serialport.read().toString());
    });
}

function recvData(message) {
    if (lineStart == true) {
        if (addTimestamp.checked) {
            let date = new Date();
            message = "<a>" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds() + "-> </a>" + message;
        }
        console.log("inicio linha");
        lineStart = false;
    }
    var index = message.indexOf("\n");
    var m_length = message.length;
    while (index > -1) {
        var new_line = "<br>";
        if (index < m_length) {
            if (addTimestamp.checked) {
                let date = new Date();
                new_line = "<br>" + "<a>" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds() + "-> </a>";
            }
        }
        else
            lineStart = true;

        message = message.replace(/(?:\r\n|\n)/g, new_line);
        index = message.indexOf("\n");
    }
    log_file_writer.write(message);
    history.innerHTML += message;
    if (preferences.autoScroll == true)
        terminal.scrollTop = terminal.scrollHeight;
}

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
            return console.log('Error on write: ', err.message);
        }
        console.log('message written');
    });
    sendInput.value = "";
}

function toggleField(hideObj, showObj) {
    hideObj.disabled = true;
    hideObj.style.display = 'none';
    showObj.disabled = false;
    showObj.style.display = 'inline';
    showObj.focus();
    console.log("hide:", hideObj);
    console.log("show:", showObj);
}

function cleanTerminal() {
    history.innerHTML = "";
    console.log("apagou");
}
getPorts();

//"C:\Users\benja\AppData\Local\Arduino15\packages\esp32\tools\xtensa-esp32-elf-gcc\gcc8_4_0-esp-2021r2-patch3\bin\xtensa-esp32-elf-addr2line.exe"
var addr2line_path = "C:\\Users\\benja\\AppData\\Local\\Arduino15\\packages\\esp32\\tools\\xtensa-esp32-elf-gcc\\gcc8_4_0-esp-2021r2-patch3\\bin\\xtensa-esp32-elf-addr2line.exe";
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
