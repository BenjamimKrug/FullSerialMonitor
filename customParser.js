function checkCustomParser(data_line, data_line_index) {
    var customResult = document.createElement("pre");
    customResult.setAttribute("id", "p" + data_line_index);
    customResult.innerHTML = "results from line " + data_line_index;
    return customResult;
}