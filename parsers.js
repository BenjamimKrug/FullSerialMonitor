var current_parser_index = -1;
var results = [];
var line_parsed = false;
var customParsersCount = 0;
var customParsers = [];
var deletedCustomParsers = [];
var customParsersDiv = document.getElementById("customParsersDiv");

function runParsers() {
    if (prev_line != null) {
        for (var i = 0; i < customParsers.length; i++) {
            if (typeof (customParsers[i].trigger) !== 'undefined') {
                if (prev_line.innerHTML.indexOf(customParsers[i].trigger) > -1) {
                    try {
                        var data_line = prev_line.innerHTML.trim();
                        console.log("data_line: ", data_line);
                        var func = `${customParsers[i].func}('${data_line}')`;
                        console.log(func);
                        addParserResult(eval(func), data_line);
                    }
                    catch (e) {
                        console.log('error:', e);
                    }
                }
            }
        }
        if (prev_line.innerHTML.indexOf("Backtrace") > -1 && line_parsed == false) {
            line_parsed = true;
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

function clickBrowse(id) {
    document.getElementById("cpScript" + id).click();
}

function updateParsers() {
    customParsersCount = 0;
    customParsersDiv.innerHTML = "";
    for (var i = 0; i < customParsers.length; i++) {
        createCustomParserField(customParsers[i].name, customParsers[i].script, customParsers[i].func, customParsers[i].trigger);
        if (fs.existsSync(customParsers[i].script)) {
            var customScript = document.createElement("script");
            customScript.setAttribute("src", customParsers[i].script);
            var body = document.getElementsByTagName('body').item(0);
            body.appendChild(customScript);
        }
    }
    getESPaddr2line();
}

function saveCustomParsers() {
    customParsers = [];
    for (var i = 0; i < customParsersCount; i++) {
        if (!deletedCustomParsers.includes(i)) {
            var newParserScript = document.getElementById("cpScriptInput" + i);
            var newParserName = document.getElementById("cpName" + i);
            var newParserFunc = document.getElementById("cpFunc" + i)
            var newParserTrigger = document.getElementById("cpTrig" + i);
            customParsers.push({
                script: newParserScript.value.trim(),
                name: newParserName.value.trim(),
                func: newParserFunc.value.trim(),
                trigger: newParserTrigger.value.trim()
            });
        }
    }
    updateParsers();
}

function deleteCustomParserField(id) {
    targetParserField = document.getElementById(`cpDiv${id}`);
    customParsersDiv.removeChild(targetParserField);
    deletedCustomParsers.push(id);
}

function createCustomParserField(name, script, func, trigger) {
    var newParserField = document.createElement("div");
    newParserField.setAttribute("id", "cpDiv" + customParsersCount);
    newParserField.setAttribute("class", "custom_parser_entry");
    var newParserName = document.createElement("input");
    newParserName.setAttribute("type", "text");
    newParserName.setAttribute("placeholder", "parser name");
    newParserName.setAttribute("id", "cpName" + customParsersCount);
    newParserName.setAttribute("class", "custom_parser_input");
    if (typeof (name) !== 'undefined')
        newParserName.setAttribute("value", name);

    var newParserFunc = document.createElement("input");
    newParserFunc.setAttribute("type", "text");
    newParserFunc.setAttribute("placeholder", "parser function");
    newParserFunc.setAttribute("id", "cpFunc" + customParsersCount);
    newParserFunc.setAttribute("class", "custom_parser_input");
    if (typeof (func) !== 'undefined')
        newParserFunc.setAttribute("value", func);

    var newParserScript_input = document.createElement("input");
    newParserScript_input.setAttribute("type", "text");
    newParserScript_input.setAttribute("placeholder", "script file path");
    newParserScript_input.setAttribute("id", "cpScriptInput" + customParsersCount);
    newParserScript_input.setAttribute("class", "custom_parser_input");
    if (typeof (script) !== 'undefined')
        newParserScript_input.setAttribute("value", script);

    var newParserScript = document.createElement("input");
    newParserScript.setAttribute("type", "file");
    newParserScript.setAttribute("id", "cpScript" + customParsersCount);
    newParserScript.setAttribute("style", "display:none");
    newParserScript.setAttribute("accept", ".js");
    newParserScript.setAttribute("onchange", `getParserScript(${customParsersCount})`);

    var newParserScriptBrowse = document.createElement("button");
    newParserScriptBrowse.setAttribute("onclick", `clickBrowse(${customParsersCount})`);
    newParserScriptBrowse.setAttribute("class", "general_btn");
    newParserScriptBrowse.setAttribute("style", "position:relative;left:10px");
    newParserScriptBrowse.innerHTML = "Browse...";

    var newParserTrigger = document.createElement("input");
    newParserTrigger.setAttribute("type", "text");
    newParserTrigger.setAttribute("placeholder", "parser trigger");
    newParserTrigger.setAttribute("id", "cpTrig" + customParsersCount);
    newParserTrigger.setAttribute("class", "custom_parser_input");
    if (typeof (trigger) !== 'undefined')
        newParserTrigger.setAttribute("value", trigger);

    var newParserExclude = document.createElement("button");
    newParserExclude.setAttribute("style", "position: absolute;right:5px");
    newParserExclude.innerHTML = "Delete";
    newParserExclude.setAttribute("onclick", `deleteCustomParserField(${customParsersCount})`);

    newParserField.innerHTML = "Name ";
    newParserField.appendChild(newParserName);
    newParserField.innerHTML += "&nbsp&nbsp&nbsp&nbspFunction ";
    newParserField.appendChild(newParserFunc);
    newParserField.appendChild(document.createElement("br"));
    newParserField.innerHTML += "Script ";
    newParserField.appendChild(newParserScript_input);
    newParserField.appendChild(newParserScript);
    newParserField.appendChild(newParserScriptBrowse);
    newParserField.innerHTML += "&nbsp&nbsp&nbsp&nbspTrigger ";
    newParserField.appendChild(newParserTrigger);
    newParserField.appendChild(newParserExclude);
    customParsersDiv.appendChild(newParserField);
    customParsersCount++;
}

