const { exec, execSync } = require("child_process");
var decoder_folder = document.getElementById("decoder_folder");
var decoder_folder_input = document.getElementById("decoder_folder_input");
var decoder_arch = document.getElementById("decoder_arch");
var decoder_color = document.getElementById("decoder_color");
var elf_path = document.getElementById("elf_path");
var elf_path_input = document.getElementById("elf_path_input");
var elf_error_warning = false;
var elf_file_auto_path = "";
var general_core = "";

//"C:\Users\benja\AppData\Local\Arduino15\packages\esp32\tools\xtensa-esp32-elf-gcc\gcc8_4_0-esp-2021r2-patch3\bin\xtensa-esp32-elf-addr2line.exe"
var addr2line_path = "packages\\esp32\\tools\\xtensa-esp32-elf-gcc\\gcc8_4_0-esp-2021r2-patch3\\bin\\xtensa-esp32-elf-addr2line.exe";
var memory_address = null;
var esp32_version = "";
var esp32_gcc_version = "";
//xtensa-esp32-elf-addr2line -pfiaC -e build/PROJECT.elf ADDRESS

function decodeBacktrace(backtraceDecoder_input, backtraceDecoder_input_line, timestamp) {
    if (elf_path_input.value != "") {
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
                var command = preferences.decoderFolder + addr2line_path + " -pfiaC -e " + elf_path_input.value.trim() + " " + memory_address;
                try {
                    var stdout = execSync(command).toString();
                    backtraceResult.innerHTML += syntaxHighlightDecoder(stdout) + "<br>";
                }
                catch (stderr) {
                    backtraceResult.innerHTML += syntaxHighlightDecoder(stderr) + "<br>";
                }
            }
        }
        memory_address = backtraceDecoder_input.substring(lastIndex, m_length - 1);
        if (!memory_address.startsWith("Backtrace")) {
            var command = preferences.decoderFolder + addr2line_path + " -pfiaC -e " + elf_path_input.value + " " + memory_address;
            try {
                var stdout = execSync(command).toString();
                backtraceResult.innerHTML += syntaxHighlightDecoder(stdout) + "<br>";
            }
            catch (stderr) {
                backtraceResult.innerHTML += syntaxHighlightDecoder(stderr) + "<br>";
            }
            addParserResult(backtraceResult, backtraceDecoder_input, preferences.decoderColor, "expDecoder", timestamp);
            return;
        }
    }
    else {
        if (!elf_error_warning) {
            elf_error_warning = true;
            window.alert("Backtrace could not be parsed, choose .elf file please");
        }
        return "No ELF file given";
    }
}

function getESPaddr2line() {
    var hardwareFolder = preferences.decoderFolder + "packages\\esp32\\hardware\\esp32\\";
    fs.readdir(hardwareFolder, (err, files) => {
        if (err) {
            console.log(err);
            return;
        }
        files.forEach(file => {
            esp32_version = file;
            fs.readFile(hardwareFolder + esp32_version + "\\installed.json", 'utf8', (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                }
                var installed_json = JSON.parse(data);
                if (decoder_arch.value == "esp32c3")
                    arch_elf_gcc = `riscv32-esp-elf`;
                else
                    arch_elf_gcc = `xtensa-${decoder_arch.value}-elf`;
                var len = installed_json.packages[0].platforms[0].toolsDependencies.length;
                var platforms = installed_json.packages[0].platforms[0];
                for (var i = 0; i < len; i++) {
                    if (platforms.toolsDependencies[i].name == `${arch_elf_gcc}-gcc`) {
                        esp32_gcc_version = platforms.toolsDependencies[i].version;
                        break;
                    }
                }
                addr2line_path = `packages\\esp32\\tools\\${arch_elf_gcc}-gcc\\${esp32_gcc_version}\\bin\\${arch_elf_gcc}-addr2line.exe`;
            });
        });
    });
    getSketchBuild();
    elf_path_input.value = elf_file_auto_path;
}

function getSketchBuild() {
    var localFolder = preferences.decoderFolder.split("Arduino15")[0] + 'Temp';
    var mostRecentBuild = "";
    var mostRecentTimestamp = 0;
    var files = fs.readdirSync(localFolder);
    files.forEach(file => {
        var stats = fs.lstatSync(localFolder + '\\' + file);
        if (stats.isDirectory() && file.startsWith("arduino-sketch")) {
            if (stats.mtimeMs > mostRecentTimestamp) {
                mostRecentTimestamp = stats.mtimeMs;
                mostRecentBuild = file;
            }
        }
    });
    if (mostRecentBuild != "") {
        var filesSketch = fs.readdirSync(localFolder + '\\' + mostRecentBuild);
        var fqbn = "";
        filesSketch.forEach(file => {
            if (file == "build.options.json") {
                var buildOptionsFile = localFolder + '\\' + mostRecentBuild + '\\' + "build.options.json";
                try {
                    var buildOptions = JSON.parse(fs.readFileSync(buildOptionsFile));
                    fqbn = buildOptions.fqbn.split(":");

                    if (fqbn[0] == "esp32") {
                        decoder_arch.value = fqbn[2];
                        general_core = fqbn[0];
                    }
                    else if (fqbn[0] == "esp8266") {
                        decoder_arch.value = fqbn[0];
                        general_core = fqbn[0];
                    }
                    else
                        window.alert("Core not supported by the exception decoder");
                }
                catch (err) {
                    console.log(err);
                }
            }
            if (fqbn[0].startsWith("esp") && file.endsWith("ino.elf")) {
                elf_file_auto_path = localFolder + '\\' + mostRecentBuild + '\\' + file;
            }
        });
    }
}

function syntaxHighlightDecoder(decoded) {
    decoded = decoded.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return decoded.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match))
                cls = 'key';
            else
                cls = 'string';
        } else if (/true|false/.test(match))
            cls = 'boolean';
        else if (/null/.test(match))
            cls = 'null';
        return `<span class="${cls}">${match}</span>`;
    });
}
