const fs = require('fs');
const { BrowserWindow } = require('electron');
var createInterface = require('readline').createInterface;
var log_file = document.getElementById("log_file");

document.getElementById("log_file").addEventListener("change", (event) => {
    let output = document.getElementById("listing");
    var folderPath = event.target.files[0].path;
    console.log(folderPath.substring(0, folderPath.lastIndexOf('\\') + 1));
}, false);

fs.writeFile("log.txt", "isso é um teste", (err) => {
    if (err) {
        console.log(err);
        return;
    }
});