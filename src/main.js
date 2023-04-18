/*
    Full Serial monitor written by Benjamim Krug
    https://github.com/BenjamimKrug/FullSerialMonitor
    for more information refer to the readme file
*/
const { app, BrowserWindow, Menu, ipcMain, globalShortcut, shell } = require('electron');
const path = require('path');
const url = require('url');
require('@electron/remote/main').initialize();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows = [];
var windows_count = 0;
var options = {
    forward: true,
    findNext: false,
    matchCase: false,
    wordStart: false,
    medialCapitalAsWordStart: false
}
function createWindow(file_name) {
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

    // and load the index.html of the app.
    newWindow.loadURL(url.format({
        pathname: path.join(__dirname, file_name),
        protocol: 'file:',
        slashes: true
    }));

    // Open the DevTools.
    //mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    newWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        windows[windows_count] = null;
        newWindow = null;
    });
    require("@electron/remote/main").enable(newWindow.webContents);


    newWindow.on('focus', () => {
        globalShortcut.register('CmdorCtrl+F', () => {
            newWindow.webContents.send('find_request', options);
        });
    });

    newWindow.on('blur', () => {
        globalShortcut.unregister('CmdorCtrl+F')
    })
    windows.push(newWindow);
    windows_count++;
    return newWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    createWindow('index.html');
    const template = [
        {
            label: 'Edit',
            submenu: [
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Documentation',
                    click: function () {
                        shell.openExternal("https://github.com/BenjamimKrug/FullSerialMonitor#readme");
                    }

                },
                {
                    label: 'Issues',
                    click: function () {
                        shell.openExternal("https://github.com/BenjamimKrug/FullSerialMonitor/issues");
                    }
                }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Payload Sequencer',
                    click: function () {
                        createWindow('sequencerWindow.html');
                    }
                }
            ]
        },
        {
            role: 'toggleDevTools'
        }
    ]
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    ipcMain.on('recvMain', (event, arg) => {
        windows[arg.id].webContents.send('recvChannel', arg); // sends the stuff from Window1 to Window2.
    });
    ipcMain.on('createWindow', (event, arg) => {
        createWindow(arg);
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


