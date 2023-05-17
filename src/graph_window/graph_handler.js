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
    }
});
ipcRenderer.send('recvMain', { id: 0, cmd: "getTheme", requester: 2 });

/*Start of specific implementation */

var Chart = require('chart.js/auto');
var ctx = document.getElementById('chart').getContext('2d');
var data = {
    datasets: [{
        data: [20, 10],
    }]
};
const chart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'millisecond'
                }
            }
        }
    }
});

