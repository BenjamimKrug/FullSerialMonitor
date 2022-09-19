const fs = require('fs');
const terminal = document.getElementById("terminal");
const input_text = document.getElementById("input");
const history = document.getElementById("history");
const autoScroll = document.getElementById("autoScroll");
const comPorts = document.getElementById("comPorts");
const comPorts_input = document.getElementById("comPorts_input");
const baudrate = document.getElementById("baudrate");
const baudrate_input = document.getElementById("baudrate_input");
const { SerialPort } = require("serialport");
const { exec } = require("child_process");
var createInterface = require('readline').createInterface;
var serialport = null;
var preferences = null;
var lineStart = true;
var addTimestamp = true;

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
        console.log(autoScroll);
    }
});

document.getElementById("terminal").addEventListener('click', function () {
    input_text.focus();
});


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
    var data = { "comPort": comPorts_input.value, "baudrate": baudrate_input.value }
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

function connectSerialPort(data) {
    serialport = new SerialPort({ path: data.comPort, baudRate: parseInt(data.baudrate), hupcl: false });
    serialport.on('error', function (err) {
        console.log("erro", err);
    });
    var lineReader = createInterface({
        input: serialport
    });

    lineReader.on('line', function (line) {
        handleData(line.toString() + "\n");
    });
}

function handleData(message) {
    if (lineStart == true) {
        if (addTimestamp) {
            let date = new Date();
            message = "<a>" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds() + "-> </a>" + message;
        }
        console.log("inicio linha");
        lineStart = false;
    }
    if (message.indexOf("\n") > 0) {
        message = message.replace(/(?:\r\n|\n)/g, '<br>');
        lineStart = true;
    }
    history.innerHTML += message;
    if (preferences.autoScroll == true)
        terminal.scrollTop = terminal.scrollHeight;
}


function updatePreferences() {
    preferences.autoScroll = autoScroll.checked;
    if (preferences.autoScroll == true)
        terminal.scrollTop = terminal.scrollHeight;
    preferences.comPort = comPorts_input.value;
    preferences.baudrate = baudrate_input.value;
    fs.writeFile("./preferences.json", JSON.stringify(preferences), (err) => {
        if (err)
            console.log(err);
        else {
            console.log("File written successfully\n");
            console.log("The written has the following contents:");
        }
    });
}

input_text.addEventListener('keydown', function search(e) {
    if (e.keyCode == 13) {
        // append your output to the history,
        // here I just append the input
        history.innerHTML += input_text.value + '<br>';
        console.log(history.innerHTML);
        // you can change the path if you want
        // crappy implementation here, but you get the idea
        if (input_text.value.substring(0, 3) === 'cd ') {
            document.getElementById('path').innerHTML = input_text.value.substring(3) + '&nbsp;>&nbsp;';
        }

        // clear the input
        input_text.value = "";

    }
});

function cleanTerminal() {
    history.innerHTML = "";
    console.log("apagou");
}

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