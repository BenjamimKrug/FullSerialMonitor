var current_parser_index = -1;
var results = [];
var line_parsed = false;
var customParsersCount = 0;
var customParsers = [];
var customParsersDiv = document.getElementById("customParsersDiv");

function runParsers() {
    if (prev_line != null) {
        if (customParsers.length > 0) {
            console.log(customParsers);
        }
        if (prev_line.innerHTML.indexOf("Backtrace") > -1 && line_parsed == false) {
            line_parsed = true;
            console.log(prev_line.innerHTML);
            backtraceDecoder_input = prev_line.innerHTML;
            backtraceDecoder_input_line = prev_line.id;
            decodeBacktrace();
            return;
        }
        if (prev_line.innerHTML.startsWith("{") && line_parsed == false) {
            line_parsed = true;
            try {
                var parsedJSON = JSON.parse(prev_line.innerHTML);
                var jsonResult = document.createElement("pre");
                jsonResult.setAttribute("id", "p" + backtraceDecoder_input_line);
                jsonResult.innerHTML = syntaxHighlightJSON(JSON.stringify(parsedJSON, null, 2));
                addParserResult(jsonResult, prev_line.innerHTML);
            }
            catch (e) {
                console.log('invalid json');
            }
            return;
        }
    }
}

function addParserResult(new_result, new_result_source) {
    current_parser_index++;
    var new_output_entry = document.createElement("button");
    new_output_entry.setAttribute("id", "b" + new_output_entry.id);
    new_output_entry.setAttribute("value", current_parser_index);
    new_output_entry.setAttribute("class", "output_entry");
    new_output_entry.setAttribute("onclick", "showOutputResult(this.value)");
    new_output_entry.innerHTML += new_result_source;
    results.push(new_result);
    showOutputResult(current_parser_index);
    output_history.appendChild(new_output_entry);
    output_history.appendChild(document.createElement("br"));
}

function showOutputResult(id) {
    output.innerHTML = "";
    output.appendChild(results[id]);
}

function syntaxHighlightJSON(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function getParserScript(id) {
    var newParserScript = document.getElementById("cpScript" + id);
    var newParserScript_input = document.getElementById("cpScriptInput" + id);
    if (typeof (newParserScript.files[0]) !== 'undefined')
        newParserScript_input.value = newParserScript.files[0].path;
}

function clickBrowse(id){
    document.getElementById("cpScript" + id).click();
}

function createCustomParserField() {
    var newParserField = document.createElement("div");
    var newParserName = document.createElement("input");
    newParserName.setAttribute("type", "text");
    newParserName.setAttribute("id", "cpName" + customParsersCount);

    var newParserScript_input = document.createElement("input");
    newParserScript_input.setAttribute("type", "text");
    newParserScript_input.setAttribute("id", "cpScriptInput" + customParsersCount);

    var newParserScript = document.createElement("input");
    newParserScript.setAttribute("type", "file");
    newParserScript.setAttribute("id", "cpScript" + customParsersCount);
    newParserScript.setAttribute("style", "display:none");
    newParserScript.setAttribute("onchange", `getParserScript(${customParsersCount})`);

    var newParserScriptBrowse = document.createElement("button");
    newParserScriptBrowse.setAttribute("onclick", `clickBrowse(${customParsersCount})`);

    var newParserSubmit = document.createElement("button");
    newParserSubmit.setAttribute("onclick", `addCustomParser(${customParsersCount})`);
    newParserField.appendChild(newParserName);
    newParserField.appendChild(newParserScript_input);
    newParserField.appendChild(newParserScript);
    newParserField.appendChild(newParserScriptBrowse);
    newParserField.appendChild(newParserSubmit);
    customParsersDiv.appendChild(newParserField);
    customParsersCount++;
}

function addCustomParser(id) {
    var newParserScript = document.getElementById("cpScriptInput" + id);
    var newParserName = document.getElementById("cpName" + id);
    customParsers.push({ script: newParserScript.value, name: newParserName.value });
    console.log(customParsers);
}
