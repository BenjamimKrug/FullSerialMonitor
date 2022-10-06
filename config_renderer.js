const fs = require('fs');
const { BrowserWindow } = require('electron');
const { SerialPort } = require("serialport");
const { exec } = require("child_process");
var createInterface = require('readline').createInterface;


async function getDir() {
    const dirHandle = await window.showDirectoryPicker();
    console.log(dirHandle);
    // run code for dirHandle// Check if handle exists inside directory our directory handle
    const relativePaths = await dirHandle.resolve();

    if (relativePath === null) {
        // Not inside directory handle
    } else {
        // relativePath is an array of names, giving the relative path

        for (const name of relativePaths) {
            // log each entry
            console.log(name);
        }
    }
}


fs.readFile("C:/Projetos/flows.json", 'utf8', (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log(data);
});

fs.writeFile("C:/Projetos/log.txt", "isso é um teste", (err) => {
    if (err) {
        console.log(err);
        return;
    }
});