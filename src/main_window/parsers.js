var current_parser_index = -1;
var results = [];
var line_parsed = 0;
var custom_parsers_count = 0;
var custom_parsers = [];
var parsed_ids = [];
var deleted_custom_parsers = [];
var disconnect_on_boot = document.getElementById("disconnect_on_boot");
var custom_parsers_div = document.getElementById("custom_parsers_div");
var json_color = document.getElementById("json_color");

var json_filter = document.getElementById("json_filter");
var decoder_filter = document.getElementById("decoder_filter");


function runParsers() {
    for (; line_parsed < current_line_index;) {
        var target_line_element = document.getElementById('l' + line_parsed);
        if (typeof (target_line_element) === 'undefined')
            break;
        if (target_line_element == null)
            break;
        var target_timestamp_element = document.getElementById('t' + line_parsed);
        if (typeof (target_timestamp_element) === 'undefined')
            break;
        var timestamp = target_timestamp_element.innerHTML.split('-')[0] + ':';
        var target_line = target_line_element.innerHTML;
        if (disconnect_on_boot.checked && target_line.startsWith("waiting for download"))
            disconnect();

        for (var i = 0; i < custom_parsers.length; i++) {
            if (typeof (custom_parsers[i].trigger) !== 'undefined') {
                if (target_line.indexOf(custom_parsers[i].trigger) > -1) {
                    try {
                        var data_line = target_line.trim();
                        var func = `${custom_parsers[i].func}('${data_line}','${target_line_element.id}')`;
                        addParserResult(eval(func), data_line, custom_parsers[i].color, custom_parsers[i].name, timestamp);
                    }
                    catch (e) {
                        console.log('error:', e);
                    }
                }
            }
        }

        if (target_line.indexOf("Backtrace") > -1) {
            decodeBacktrace(target_line, target_line_element.id, timestamp);
        }

        if (target_line.startsWith("{")) {
            try {
                var parsedJSON = JSON.parse(target_line);
                var jsonResult = document.createElement("pre");
                jsonResult.setAttribute("id", "pl" + line_parsed);
                jsonResult.innerHTML = syntaxHighlightJSON(JSON.stringify(parsedJSON, null, 2));
                addParserResult(jsonResult, target_line, preferences.jsonColor, "json", timestamp);
            }
            catch (e) {
                console.log('error parsing json:', e);
            }
        }

        checkGraphTriggers(timestamp, target_line);

        line_parsed++;
    }
    //line_parsed = current_line_index;
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
    custom_parsers_count = 0;
    custom_parsers_div.innerHTML = "";
    var filterDropdown = document.getElementById("filter_dropdown");
    filterDropdown.innerHTML = "";
    for (var i = 0; i < custom_parsers.length; i++) {
        createCustomParserField(custom_parsers[i].name, custom_parsers[i].script,
            custom_parsers[i].func, custom_parsers[i].trigger, custom_parsers[i].color);
        if (fs.existsSync(custom_parsers[i].script)) {
            var current_script = document.getElementById(custom_parsers[i].name);
            if (typeof (current_script) === 'undefined' || current_script == null) {
                var customScript = document.createElement("script");
                customScript.setAttribute("src", custom_parsers[i].script);
                customScript.setAttribute("id", custom_parsers[i].name);
                var body = document.getElementsByTagName('body').item(0);
                body.appendChild(customScript);

                var customFilterLabel = document.createElement("label");
                customFilterLabel.setAttribute("for", custom_parsers[i].name + "_filter");
                customFilterLabel.setAttribute("class", "filters_label");
                customFilterLabel.innerHTML = custom_parsers[i].name;

                var customFilter = document.createElement("input");
                customFilter.setAttribute("type", "checkbox");
                customFilter.setAttribute("onchange", "updateParserHistory(this)");
                customFilter.setAttribute("class", "filters");
                customFilter.setAttribute("id", custom_parsers[i].name + "_filter");
                customFilter.setAttribute("data-filter", custom_parsers[i].name);
                customFilter.checked = true;

                filterDropdown.appendChild(customFilterLabel);
                filterDropdown.appendChild(customFilter);
                filterDropdown.appendChild(document.createElement("br"));
            }
        }
    }
    getESPaddr2line();
}

function saveCustomParsers() {
    custom_parsers = [];
    for (var i = 0; i < custom_parsers_count; i++) {
        if (!deleted_custom_parsers.includes(i)) {
            var newParserScript = document.getElementById("cpScriptInput" + i);
            var newParserName = document.getElementById("cpName" + i);
            var newParserFunc = document.getElementById("cpFunc" + i)
            var newParserTrigger = document.getElementById("cpTrig" + i);
            var newParserColor = document.getElementById("cpColor" + i);
            custom_parsers.push({
                script: newParserScript.value.trim(),
                name: newParserName.value.trim(),
                func: newParserFunc.value.trim(),
                trigger: newParserTrigger.value.trim(),
                color: newParserColor.value
            });
        }
    }
    updateParsers();
}

function addParserResult(newResult, newResultSource, color, parserName, timestamp) {
    current_parser_index++;
    var newOutputEntry = document.createElement("button");
    newOutputEntry.setAttribute("id", "b" + newResult.id);
    newOutputEntry.setAttribute("value", current_parser_index);
    newOutputEntry.setAttribute("data-parser", parserName);
    newOutputEntry.setAttribute("class", "output_entry output_entry_color");

    var target_filter = document.querySelector(`[data-filter="${parserName}"]`);
    var display_type = 'block';
    if (target_filter != null)
        display_type = target_filter.checked ? 'block' : 'none';

    newOutputEntry.setAttribute("style", `display:${display_type};border-color:${color}`);
    newOutputEntry.setAttribute("onclick", "showOutputResult(this.value)");

    var newOutputTimestamp = document.createElement("span");
    newOutputTimestamp.setAttribute("class", "parser_timestamp");
    newOutputTimestamp.innerHTML = timestamp;
    newOutputEntry.appendChild(newOutputTimestamp);
    newOutputEntry.innerHTML += newResultSource;

    results.push(newResult);
    parsed_ids.push(newResult.id);
    output_history.appendChild(newOutputEntry);

    if (auto_scroll.checked == true) {
        output_history.scrollTop = output_history.scrollHeight;
        if (target_filter == undefined) return;
        if (target_filter.checked)
            showOutputResult(current_parser_index);
    }
}

function showOutputResult(id) {
    output.innerHTML = "";
    output.appendChild(results[id]);
    output.scrollTop = 0;
}

function deleteCustomParserField(id) {
    targetParserField = document.getElementById(`cpDiv${id}`);
    custom_parsers_div.removeChild(targetParserField);
    deleted_custom_parsers.push(id);
}

function createCustomParserField(name, script, func, trigger, color) {
    var newParserField = document.createElement("div");
    newParserField.setAttribute("id", "cpDiv" + custom_parsers_count);
    newParserField.setAttribute("class", "custom_parser_entry");

    var first_half = document.createElement("div");
    first_half.setAttribute("class", "half");
    var second_half = document.createElement("div");
    second_half.setAttribute("class", "half");

    var newParserName = document.createElement("input");
    newParserName.setAttribute("type", "text");
    newParserName.setAttribute("placeholder", current_language["parser_name_placeholder"]);
    newParserName.setAttribute("id", "cpName" + custom_parsers_count);
    if (typeof (name) !== 'undefined')
        newParserName.setAttribute("value", name);

    var newParserFunc = document.createElement("input");
    newParserFunc.setAttribute("type", "text");
    newParserFunc.setAttribute("placeholder", current_language["parser_function_placeholder"]);
    newParserFunc.setAttribute("id", "cpFunc" + custom_parsers_count);
    if (typeof (func) !== 'undefined')
        newParserFunc.setAttribute("value", func);

    var color_div = document.createElement("div");
    color_div.setAttribute("class", "color_div");
    var newParserColor = document.createElement("input");
    newParserColor.setAttribute("type", "color");
    newParserColor.setAttribute("placeholder", current_language["parser_color_placeholder"]);
    newParserColor.setAttribute("id", "cpColor" + custom_parsers_count);
    if (typeof (color) !== 'undefined')
        newParserColor.setAttribute("value", color);
    color_div.appendChild(newParserColor);

    var newParserScriptInput = document.createElement("input");
    newParserScriptInput.setAttribute("type", "text");
    newParserScriptInput.setAttribute("placeholder", current_language["parser_script_placeholder"]);
    newParserScriptInput.setAttribute("id", "cpScriptInput" + custom_parsers_count);
    if (typeof (script) !== 'undefined')
        newParserScriptInput.setAttribute("value", script);

    var newParserScript = document.createElement("input");
    newParserScript.setAttribute("type", "file");
    newParserScript.setAttribute("id", "cpScript" + custom_parsers_count);
    newParserScript.setAttribute("style", "display:none");
    newParserScript.setAttribute("accept", ".js");
    newParserScript.setAttribute("onchange", `getParserScript(${custom_parsers_count})`);

    var newParserScriptBrowse = document.createElement("button");
    newParserScriptBrowse.setAttribute("onclick", `clickBrowse(${custom_parsers_count})`);
    newParserScriptBrowse.setAttribute("class", "general_btn");
    newParserScriptBrowse.innerText = current_language["browse"];

    var newParserTrigger = document.createElement("input");
    newParserTrigger.setAttribute("type", "text");
    newParserTrigger.setAttribute("placeholder", current_language["parser_trigger_placeholder"]);
    newParserTrigger.setAttribute("id", "cpTrig" + custom_parsers_count);
    if (typeof (trigger) !== 'undefined')
        newParserTrigger.setAttribute("value", trigger);

    var newParserExclude = document.createElement("img");
    newParserExclude.setAttribute("width", "16");
    newParserExclude.setAttribute("height", "16");
    newParserExclude.setAttribute("src", "../images/trash-2-16.png");
    newParserExclude.setAttribute("onclick", `deleteCustomParserField(${custom_parsers_count})`);

    var line = document.createElement("div");
    line.setAttribute("class", "line");
    var label = document.createElement("label");
    label.innerText = current_language["name"];
    line.appendChild(label);
    line.appendChild(newParserName);
    first_half.appendChild(line);

    line = document.createElement("div");
    line.setAttribute("class", "line");
    label = document.createElement("label");
    label.innerText = current_language["script"];
    line.appendChild(label);
    line.appendChild(newParserScriptInput);
    line.appendChild(newParserScript);
    line.appendChild(newParserScriptBrowse);
    first_half.appendChild(line);

    line = document.createElement("div");
    line.setAttribute("class", "line");
    label = document.createElement("label");
    label.innerText = current_language["function"];
    line.appendChild(label);
    line.appendChild(newParserFunc);
    second_half.appendChild(line);

    line = document.createElement("div");
    line.setAttribute("class", "line");
    label = document.createElement("label");
    label.innerText = current_language["trigger"];
    line.appendChild(label);
    line.appendChild(newParserTrigger);
    second_half.appendChild(line);

    newParserField.appendChild(color_div);
    newParserField.appendChild(first_half);
    newParserField.appendChild(second_half);
    newParserField.appendChild(newParserExclude);
    custom_parsers_div.appendChild(newParserField);
    custom_parsers_count++;
}

function updateParserHistory(target_filter) {
    parsed_ids.forEach((currentValue) => {
        var current_parser_line = document.getElementById("b" + currentValue);
        if (current_parser_line.dataset.parser === target_filter.dataset.filter)
            current_parser_line.style.display = target_filter.checked ? 'block' : 'none';
    });
}
