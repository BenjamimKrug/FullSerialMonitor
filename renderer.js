const { ipcRenderer } = require('electron');

const ipc = require('electron').ipcRenderer;
const input_text = document.getElementById("input");
const history = document.getElementById("history");
const comPorts = document.getElementById("comPorts");
const comPorts_input = document.getElementById("comPorts_input");
const baudrate = document.getElementById("baudrate");
const baudrate_input = document.getElementById("baudrate_input");

document.getElementById("terminal").addEventListener('click', function () {
    input_text.focus();
});

ipc.on('recvPorts', function (evt, message) {
    console.log(message); // Returns: {'SAVED': 'File Saved'}
    comPorts.innerHTML = message.data;
});

ipc.on('recvData', function (evt, message) {
    if (message.indexOf("\n") > 0)
        message = message.replace(/(?:\r\n|\r|\n)/g, '<br>');
    console.log("dado ", message);
    history.innerHTML += message;
    input_text.focus();
});


function connect() {
    ipcRenderer.send("connect", { "comPort": comPorts_input.value, "baudrate": baudrate_input.value });
}

function getPorts() {
    ipcRenderer.send("getPorts", "test");
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