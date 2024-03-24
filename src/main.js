/*
    Full Serial monitor written by Benjamim Krug
    https://github.com/BenjamimKrug/FullSerialMonitor
    for more information refer to the readme file
*/
const { app, BrowserWindow, Menu, ipcMain, globalShortcut, shell, dialog } = require('electron');
const path = require('path');
const url = require('url');
require('@electron/remote/main').initialize();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows = [null, null, null, null, null];
var options = {
    forward: true,
    findNext: false,
    matchCase: false,
    wordStart: false,
    medialCapitalAsWordStart: false
}

// needs to have this for atleast the first time
var current_language = {};

function createWindow(file_name, index) {
    if (windows[index] != null) {
        windows[index].focus();
        return;
    }
    // Create the browser window.
    let newWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        backgroundColor: "#ccc",
        webPreferences: {
            nodeIntegration: true, // to allow require
            contextIsolation: false, // allow use with Electron 12+
        },
        icon: __dirname + '/images/icon.ico'
    });
    newWindow.maximize();

    newWindow.loadURL(url.format({
        pathname: path.join(__dirname, file_name),
        protocol: 'file:',
        slashes: true
    }));

    // Open the DevTools.
    //mainWindow.webContents.openDevTools()
    if (index == 2) {
        // Emitted when the window is closed.
        newWindow.on('closed', function () {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.

            try {
                windows[0].webContents.send('recvChannel', { cmd: "graphClosed" });
            } catch (e) {

            }
            windows[index] = null;
            newWindow = null;
        });
    }
    else if (index == 0) {
        newWindow.on('closed', function () {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            for (var i = 1; i < windows.length; i++) {
                if (windows[i] != null)
                    windows[i].close();
            }
            windows[index] = null;
            newWindow = null;
        });
    } else newWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        windows[index] = null;
        newWindow = null;
    });

    require("@electron/remote/main").enable(newWindow.webContents);

    if (file_name.indexOf("main") > -1) {
        newWindow.on('focus', () => {
            globalShortcut.register('CmdorCtrl+F', () => {
                newWindow.webContents.send('find_request', options);
            });
        });

        newWindow.on('blur', () => {
            globalShortcut.unregister('CmdorCtrl+F');
        });
    }
    windows[index] = newWindow;
    return newWindow;
}

function makeMenuTemplate() {
    const template = [
        {
            label: current_language["edit"],
            submenu: [
                { label: current_language["cut"], role: 'cut' },
                { label: current_language["copy"], role: 'copy' },
                { label: current_language["paste"], role: 'paste' },
                { label: current_language["select_all"], role: 'selectAll' }
            ]
        },
        {
            label: current_language["help"],
            submenu: [
                {
                    label: current_language["documentation"],
                    click: function () {
                        shell.openExternal("https://github.com/BenjamimKrug/FullSerialMonitor#readme");
                    }

                },
                {
                    label: current_language["issues"],
                    click: function () {
                        shell.openExternal("https://github.com/BenjamimKrug/FullSerialMonitor/issues");
                    }
                }
            ]
        },
        {
            label: current_language["tools"],
            submenu: [
                {
                    label: current_language["payload_sequencer"],
                    click: function () {
                        createWindow('sequencer_window/index.html', 1);
                    }
                },
                {
                    label: current_language["grapher"],
                    click: function () {
                        createWindow('graph_window/index.html', 2);
                    }
                },
                {
                    label: current_language["exception_decoder"],
                    click: function () {
                        createWindow('exception_decoder_window/index.html', 3);
                    }
                }
            ]
        },
        {
            label: current_language["toggle_dev_tools"],
            role: 'toggleDevTools'
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    createWindow('main_window/index.html', 0);
    makeMenuTemplate();

    ipcMain.on('recvMain', (event, arg) => {
        try {
            windows[arg.id].webContents.send('recvChannel', arg); // sends the stuff from Window1 to Window2.
        } catch (e) {

        }
    });

    ipcMain.on('openAlert', (event, incomingMessage) => {
        if (incomingMessage.title == undefined)
            return;
        if (incomingMessage.content == undefined)
            return;
        dialog.showErrorBox(incomingMessage.title, incomingMessage.content);
    });

    ipcMain.on('createWindow', (event, arg) => {
        createWindow(arg.url, arg.index);
    });

    ipcMain.on('setLang', (event, arg) => {
        current_language = arg;
        makeMenuTemplate();
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    app.quit();
    globalShortcut.unregister('CmdorCtrl+F')
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});


