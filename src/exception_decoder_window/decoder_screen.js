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
ipcRenderer.send('recvMain', { id: 0, cmd: "getTheme", requester: 3 });
ipcRenderer.send('recvMain', { id: 0, cmd: "getLang", requester: 3 });

// just a dummy variabel to not have a problem with the decoder function
var preferences = { decoderColor:"#00000"};

var backtrace_data_input = document.getElementById("backtrace_data_input");
var output = document.getElementById("output");

function runManualDecode() {
    getESPaddr2line();
    var backtrace_data = backtrace_data_input.value.trim();
    decodeBacktrace(backtrace_data, 0, Date.now());
}

function addParserResult(newResult, newResultSource, color, parserName, timestamp) {
    output.innerHTML = newResult.innerHTML;
}