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
var log_file = document.getElementById("log_file");
var config_menu = document.getElementById("config_menu");
var serialport = null;
var preferences = null;
var lineStart = true;

fs.readFile("./preferences.json", 'utf8', (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    preferences = JSON.parse(data);
    if (preferences != null) {
        comPorts_input.value = preferences.comPort;
        baudrate_input.value = preferences.baudrate;
        autoScroll.checked = preferences.autoScroll;
        addTimestamp.checked = preferences.addTimestamp;
    }
});

function updatePreferences() {
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
}

function handleDir(event) {
    var folderPath = event.target.files[0].path;
    console.log(folderPath.substring(0, folderPath.lastIndexOf('\\') + 1));
}


document.getElementById("open_config_menu").onclick = function () {
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
    /*
    var lineReader = createInterface({
        input: serialport
    });

    lineReader.on('line', function (line) {
        recvData(line.toString() + "\n");
    });
    */
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
