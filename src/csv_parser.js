function parsePayload(data_line, data_line_index) {
    const rows = data_line.split('|');
    let csvContent = rows.join(',') + "\r\n";
    fs.appendFile("./csv_test.csv", csvContent, (err) => {
        if (err)
            window.alert("Error on writing csv file:", err);
    });
    var customResult = document.createElement("pre");
    customResult.innerHTML = csvContent;
    return customResult;
}
