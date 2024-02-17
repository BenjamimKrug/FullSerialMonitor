function parsePayload(data_line, data_line_index) {
    const rows = data_line.split('|');
    let csvContent = rows.join(',') + "\r\n";
    fs.appendFile("./csv_test.csv", csvContent, (err) => {
        if (err)
            ipcRenderer.send("openAlert", { title: "Error on writing csv file:", content: err.message});
    });
    var customResult = document.createElement("pre");
    customResult.innerHTML = csvContent;
    return customResult;
}
