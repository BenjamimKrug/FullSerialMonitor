function checkCustomParser(data_line) {
    console.log("custom parser: ", data_line);    
    var customResult = document.createElement("pre");
    customResult.setAttribute("id", "p" + backtraceDecoder_input_line);
    customResult.innerHTML = "results";
    return customResult;
}