const fs = require('fs');
const { ipcRenderer } = require('electron')
const { SerialPort } = require("serialport");
const remote = require('@electron/remote');
const { FindInPage } = require('electron-find');

const content = document.getElementById("content");
const terminal = document.getElementById("terminal");
const output = document.getElementById("output");

//options menu elements
const auto_scroll = document.getElementById("auto_scroll");
const com_ports = document.getElementById("com_ports");
const com_ports_input = document.getElementById("com_ports_input");
const baudrate_input = document.getElementById("baudrate_input");
const add_timestamp = document.getElementById("add_timestamp");
const sidebar_resizer = document.getElementById("sidebar_resizer");
const show_con_changes = document.getElementById("show_con_changes");

//send data elements and variables
const send_input = document.getElementById("send_input");
const send_button = document.getElementById("send_button");
const line_ending = document.getElementById("line_ending");
var ctrl_enter = document.getElementById("ctrl_enter");
var pos = 0;
var input_history = [];
var prev_send_input = "";

var serialport = null;
var lineStart;
var first_line = true;
var new_line = true;
var current_line_index = 0;
var current_line = null;
var prev_line = null;
var start_line_index = 0;
var sequence;
var sequenceTimeout;
var sequence_pos = 0;

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

setInterval(() => { getPorts() }, 1000);

ipcRenderer.on('find_request', () => {
    findInPage.openFindWindow();
});

ipcRenderer.on('recvChannel', (_event, arg) => {
    switch (arg.cmd) {
        case "sendSequence": {
            clearTimeout(sequenceTimeout);
            if (serialport == null) {
                ipcRenderer.send("openAlert", current_language["serial_port_not_open_error"]);
                return;
            }
            sequence_pos = 0;
            sequence = JSON.parse(fs.readFileSync(arg.sequence));
            sequenceTimeout = setTimeout(sendSequence, sequence.packets[sequence_pos].delay);
            break;
        }
        case "stopSequence": {
            clearTimeout(sequenceTimeout);
            break;
        }
        case "getTheme": {
            ipcRenderer.send('recvMain', { id: arg.requester, cmd: "setTheme", theme: theme_style.href });
            break;
        }
        case "getLang": {
            ipcRenderer.send('recvMain', { id: arg.requester, cmd: "setLang", lang: current_language });
            break;
        }
        case "graphOpened": {
            graphWindow = true;
            break;
        }
        case "graphClosed": {
            graphWindow = false;
            break;
        }
        case "setGraphsArray": {
            setGraphsArray(arg.graphsArray);
            break;
        }
    }
});

function sendSequence() {
    var line_end = "";
    if (line_ending.value == "\\n")
        line_end = "\n";
    if (line_ending.value == "\\r")
        line_end = "\r";
    if (line_ending.value == "\\r\\n")
        line_end = "\r\n";
    var data = Buffer.from(sequence.packets[sequence_pos].data + line_end, "utf-8");
    serialport.write(data, function (err) {
        if (err) {
            ipcRenderer.send("openAlert", current_language["writing_error"]);
            return;
        }
    });

    if (sequence.count - 1 == sequence_pos) {
        if (sequence.continuous)
            sequence_pos = -1;
        else {
            clearTimeout(sequenceTimeout);
            return;
        }
    }
    sequence_pos++;
    sequenceTimeout = setTimeout(sendSequence, sequence.packets[sequence_pos].delay);
}


function createWindow(window_url, i) {
    ipcRenderer.send("createWindow", { url: window_url, index: i });
}

function makeResizableDiv(div, vertical, horizontal) {
    const element = document.querySelector(div);
    const resizers = element.querySelectorAll('.resizer');
    const minimum_size = 20;
    let original_width = 0;
    let original_height = 0;
    let original_x = 0;
    let original_y = 0;
    let original_mouse_x = 0;
    let original_mouse_y = 0;
    for (let i = 0; i < resizers.length; i++) {
        const currentResizer = resizers[i];
        currentResizer.addEventListener('mousedown', function (e) {
            e.preventDefault()
            original_width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
            original_height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
            original_x = element.getBoundingClientRect().left;
            original_y = element.getBoundingClientRect().top;
            original_mouse_x = e.pageX;
            original_mouse_y = e.pageY;
            window.addEventListener('mousemove', resize)
            window.addEventListener('mouseup', stopResize)
        });

        function resize(e) {
            if (currentResizer.classList.contains('bottom-right')) {
                if (horizontal) {
                    const width = original_width + (e.pageX - original_mouse_x);
                    if (width > minimum_size)
                        element.style.width = width + 'px';
                }
                if (vertical) {
                    const height = original_height + (e.pageY - original_mouse_y);
                    if (height > minimum_size)
                        element.style.height = height + 'px';
                }
            }
            else if (currentResizer.classList.contains('bottom-left')) {
                if (horizontal) {
                    const height = original_height + (e.pageY - original_mouse_y);
                    if (height > minimum_size)
                        element.style.height = height + 'px';
                }
                if (vertical) {
                    const width = original_width - (e.pageX - original_mouse_x);
                    if (width > minimum_size) {
                        element.style.width = width + 'px';
                        element.style.left = original_x + (e.pageX - original_mouse_x) + 'px';
                    }
                }
            }
            else if (currentResizer.classList.contains('top-right')) {
                if (horizontal) {
                    const width = original_width + (e.pageX - original_mouse_x);
                    if (width > minimum_size)
                        element.style.width = width + 'px';
                }
                if (vertical) {
                    const height = original_height - (e.pageY - original_mouse_y)
                    if (height > minimum_size) {
                        element.style.height = height + 'px'
                        element.style.top = original_y + (e.pageY - original_mouse_y) + 'px'
                    }
                }
            }
            else {
                if (horizontal) {
                    const width = original_width - (e.pageX - original_mouse_x);
                    if (width > minimum_size) {
                        element.style.width = width + 'px';
                        element.style.left = original_x + (e.pageX - original_mouse_x) + 'px';
                    }
                }
                if (vertical) {
                    const height = original_height - (e.pageY - original_mouse_y);
                    if (height > minimum_size) {
                        element.style.height = height + 'px';
                        element.style.top = original_y + (e.pageY - original_mouse_y) + 'px';
                    }
                }
            }
            content.style.width = window.innerWidth - parseInt(element.style.width, 10) - 30 + 'px';
        }

        function stopResize() {
            window.removeEventListener('mousemove', resize)
        }
    }
}

//options menu handlers start
function changeTimestamp() {
    for (var i = start_line_index; i < current_line_index; i++) {
        if (document.getElementById('t' + i) != null)
            document.getElementById('t' + i).style.display = add_timestamp.checked ? "inline" : "none";
    }
}

function getPorts() {
    SerialPort.list().then(function (ports) {
        var current_port = com_ports.value;
        var returnList = "";
        ports.forEach(function (port) {
            returnList += "<option>" + port.path + "</option>";
        });
        com_ports.innerHTML = returnList;
        com_ports.value = current_port;
    });
}

function connect() {
    if (com_ports.value == "") {
        ipcRenderer.send("openAlert", current_language["no_com_ports_error"]);
        return;
    }
    var data = {
        path: com_ports.value,
        baudRate: parseInt(baudrate_input.value),
        dataBits: parseInt(dataBits_select.value),
        stopBits: parseInt(stopBits_select.value),
        parity: parity_select.value,
        rtscts: rtscts_enable.checked,
        xon: xon_enable.checked,
        xoff: xoff_enable.checked,
        xany: xany_enable.checked,
        hupcl: hupcl_enable.checked
    }
    if (data.path == undefined && data.baudrate == undefined) {
        ipcRenderer.send("openAlert", current_language["undefined_value_error"]);
        return;
    }

    if (serialport != null && serialport.isOpen) {
        serialport.port.close().then((err) => {
            connectSerialPort(data);
        });
    }
    else
        connectSerialPort(data);
}


function disconnect() {
    if (serialport != null && serialport.isOpen) {
        serialport.port.close().then((err) => {
            send_button.disabled = true;
            send_input.disabled = true;
            line_ending.disabled = true;
            if (show_con_changes.checked)
                recvData("\n<span style='color:red'>DISCONNECTED</span>\n");
            if (log_file_writer != null)
                log_file_writer.close();
        });
    }
}

function cleanTerminal() {
    terminal.innerHTML = "";
    output_history.innerHTML = "";
    new_line = true;
    start_line_index = current_line_index--;
}

function connectSerialPort(data) {
    updatePreferences();
    serialport = new SerialPort(data);
    serialport.on('error', function (err) {
        ipcRenderer.send("openAlert", { title: current_language["serialport_error"], content: err.message });
    });
    serialport.on("open", function (err) {
        if (err) {
            ipcRenderer.send("openAlert", { title: current_language["serialport_open_error"], content: err.message });
            return;
        }
        send_button.disabled = false;
        send_input.disabled = false;
        line_ending.disabled = false;
        if (show_con_changes.checked)
            recvData("<span style='color:green'>CONNECTED</span>\n");
        if (log_type.value == 'none')
            return;
        if (fs.existsSync(log_folder_input.value)) {
            log_file_writer = fs.createWriteStream(log_folder_input.value + "log.txt", {
                flags: log_type.value
            });
        }
        else
            ipcRenderer.send("openAlert", current_language["log_folder_does_not_exist"]);

    });
    serialport.on("close", function (err) {
        send_button.disabled = true;
        send_input.disabled = true;
        line_ending.disabled = true;
        if (err) {
            ipcRenderer.send("openAlert", { title: current_language["port_disconnected"], content: err.message });
            if (show_con_changes.checked)
                recvData("\n<span style='color:red'>DISCONNECTED</span>\n");
            if (log_file_writer != null)
                log_file_writer.close();
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
    payload = "";
    let date = new Date();
    var tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    var dateISO = (new Date(date - tzoffset)).toISOString().slice(0, -1);
    var current_datetime = dateISO.match(/\d\d:\d\d:\d\d.\d\d\d/);

    var m_length = message.length;
    var index = 0;
    while (index < m_length) {
        var message_new_line_content = "";
        var payload_new_line = "";

        //add the timestamp if a new line was started
        if (new_line == true) {
            new_line = false;
            var timestamp = document.createElement("a");
            timestamp.innerHTML = current_datetime + "->";
            if (add_timestamp.checked == false)
                timestamp.setAttribute("style", "display:none");
            timestamp.setAttribute("id", 't' + current_line_index);
            terminal.appendChild(timestamp);

            current_line = document.createElement("a");
            current_line.setAttribute("id", 'l' + current_line_index);
            terminal.appendChild(current_line);

            if (log_add_timestamp.checked)
                payload_new_line = current_datetime + "->";
        }

        for (; index < m_length; index++) {
            var c = message[index];
            payload_new_line += c;
            if (c == '\n') {
                new_line = true;
                index++;
                break;
            } else if (c != '\r') {
                message_new_line_content += c;
            }
        }

        current_line.innerHTML += message_new_line_content;

        payload += payload_new_line;

        //adds the new line in html if a new line was detected
        if (new_line == true) {
            terminal.appendChild(document.createElement("br"));
            current_line_index++;
        }
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
send_input.addEventListener("keyup", (event) => {
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
            ipcRenderer.send("openAlert", current_language["writing_error"]);
            return;
        }
    });
    input_history.push(send_input.value);
    pos = input_history.length;
    send_input.value = "";
}

function init() {
    //Data send handles end
    getPorts();
    makeResizableDiv('.options_menu', false, true);
}

init();

