const { exec, execSync } = require("child_process");
const os = require('os');
var decoder_arch = document.getElementById("decoder_arch");
var decoder_color = document.getElementById("decoder_color");
var elf_path = document.getElementById("elf_path");
var elf_path_input = document.getElementById("elf_path_input");
var elf_error_warning = false;
var elf_file_auto_path = "";
var general_core = "";

//"C:\Users\benja\AppData\Local\Arduino15\packages\esp32\tools\xtensa-esp32-elf-gcc\gcc8_4_0-esp-2021r2-patch3\bin\xtensa-esp32-elf-addr2line.exe"
var addr2line_path = "";
var memory_address = null;
//xtensa-esp32-elf-addr2line -pfiaC -e build/PROJECT.elf ADDRESS

function getELF() {
    if (typeof (elf_path.files[0]) !== 'undefined')
        elf_path_input.value = elf_path.files[0].path.trim();
    elf_path_input.scrollLeft = elf_path_input.scrollWidth;
}

elf_path_input.addEventListener('blur', () => {
    elf_path_input.scrollLeft = elf_path_input.scrollWidth;
});

function decodeBacktrace(backtraceDecoder_input, backtraceDecoder_input_line, timestamp) {
    if (elf_path_input.value == "") {
        if (!elf_error_warning) {
            elf_error_warning = true;
            ipcRenderer.send("openAlert", current_language["backtrace_error"]["title"]);
        }
        return "No ELF file given";
    }
    var backtraceResult = document.createElement("a");
    backtraceResult.setAttribute("id", "p" + backtraceDecoder_input_line);
    var index = backtraceDecoder_input.indexOf(" ");
    var lastIndex = 0;
    var m_length = backtraceDecoder_input.length;
    while (index > -1) {
        memory_address = backtraceDecoder_input.substring(lastIndex, index);
        lastIndex = index + 1;
        index = backtraceDecoder_input.indexOf(" ", lastIndex);
        if (!memory_address.startsWith("Backtrace")) {
            var command = addr2line_path + " -pfiaC -e " + elf_path_input.value.trim() + " " + memory_address;

            try {
                var stdout = execSync(command).toString();
                backtraceResult.innerHTML += syntaxHighlightDecoder(stdout) + "<br>";
            }
            catch (stderr) {
            }
        }
    }
    memory_address = backtraceDecoder_input.substring(lastIndex, m_length - 1);
    if (!memory_address.startsWith("Backtrace")) {
        var command = addr2line_path + " -pfiaC -e " + elf_path_input.value + " " + memory_address;
        try {
            var stdout = execSync(command).toString();
            backtraceResult.innerHTML += syntaxHighlightDecoder(stdout) + "<br>";
        }
        catch (stderr) {
            backtraceResult.innerHTML += stderr.message + "<br>";
        }
        addParserResult(backtraceResult, backtraceDecoder_input, preferences.decoderColor, "expDecoder", timestamp);
        return;
    }
}


function getESPaddr2line() {
    if (decoder_arch.value == "esp32c3")
        arch_elf_gcc = `riscv32-esp-elf`;
    else
        arch_elf_gcc = `xtensa-${decoder_arch.value}-elf`;
    addr2line_path = `decoders\\${arch_elf_gcc}-addr2line.exe`;
}

function getSketchBuild() {
    var tempFolder = os.tmpdir();
    var mostRecentBuild = "";
    var mostRecentTimestamp = 0;
    var files = fs.readdirSync(tempFolder);
    files.forEach(file => {
        if (!file.startsWith("arduino"))
            return;
        var stats = fs.lstatSync(tempFolder + '\\' + file);
        if (stats.isDirectory()) {
            if (mostRecentBuild != "arduino" && stats.mtimeMs > mostRecentTimestamp) {
                mostRecentTimestamp = stats.mtimeMs;
                mostRecentBuild = file;
            }
        }
    });
    if (mostRecentBuild == "")
        return;

    if (mostRecentBuild == "arduino") {
        var currentPath = tempFolder + '\\' + mostRecentBuild + '\\sketches';
        var sketchesFolder = fs.readdirSync(currentPath);
        sketchesFolder.forEach(file => {
            var stats = fs.lstatSync(currentPath + '\\' + file);
            if (stats.isDirectory()) {
                if (stats.mtimeMs > mostRecentTimestamp) {
                    mostRecentTimestamp = stats.mtimeMs;
                    mostRecentBuild = currentPath + '\\' + file;
                }
            }
        });
    }

    var filesSketch = fs.readdirSync(mostRecentBuild);
    var fqbn = "";
    filesSketch.forEach(file => {
        if (file == "build.options.json") {
            var buildOptionsFile = mostRecentBuild + '\\' + "build.options.json";
            try {
                var buildOptions = JSON.parse(fs.readFileSync(buildOptionsFile));
                fqbn = buildOptions.fqbn.split(":");
                if (fqbn[0] == "esp32") {
                    if (fqbn[2].startsWith("esp"))
                        decoder_arch.value = fqbn[2];
                    else
                        decoder_arch.value = fqbn[0];
                    general_core = fqbn[0];
                }
                else if (fqbn[0] == "esp8266") {
                    decoder_arch.value = fqbn[0];
                    general_core = fqbn[0];
                }
                else
                    ipcRenderer.send("openAlert", current_language["esp_support_error"]["content"]);
            }
            catch (err) {
                console.log(err);
            }
        }

        if (typeof (fqbn[0]) === 'undefined')
            return;
        if (fqbn[0].startsWith("esp") && file.endsWith("ino.elf")) {
            elf_file_auto_path = mostRecentBuild + '\\' + file;
        }
    });
    if (elf_file_auto_path == "")
        ipcRenderer.send("openAlert", current_language["elf_not_found_error"]);
    elf_path_input.value = elf_file_auto_path;
}

function syntaxHighlightDecoder(decoded) {
    decoded = decoded.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return decoded.replace(/0x[a-f0-9]{8}:|\b:[0-9]{1,}\b|[a-zA-Z0-9_*\(\)]{1,} at\b|\b\/[a-zA-Z0-9_]{1,}\.[a-z]{1,}/g, function (match) {
        var cls = 'key';
        if (/ at$/.test(match))
            cls = 'string';
        else if (/\.[a-z]{1,}/.test(match))
            cls = 'boolean';
        else if (/null/.test(match))
            cls = 'null';
        return `<span class="${cls}">` + (cls == 'string' ? `${match.substring(0, match.indexOf(" at"))}</span> at` : `${match}</span>`);
    });
}
