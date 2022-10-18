function checkCustomParser(data_line, data_line_index) {
    console.log("custom parser: ", data_line);    
    var customResult = document.createElement("pre");
    customResult.setAttribute("id", "p" + data_line_index);
    customResult.innerHTML = "results";
    return customResult;
}