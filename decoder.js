const { exec } = require("child_process");
var decoder_folder = document.getElementById("decoder_folder");
var decoder_folder_input = document.getElementById("decoder_folder_input");
var decoderArch = document.getElementById("decoderArch");
var elf_path = document.getElementById("elf_path");
var elf_path_input = document.getElementById("elf_path_input");
var backtraceDecoder_input;
var backtraceDecoder_input_line = null;
var elf_error_warning = false;

//"C:\Users\benja\AppData\Local\Arduino15\packages\esp32\tools\xtensa-esp32-elf-gcc\gcc8_4_0-esp-2021r2-patch3\bin\xtensa-esp32-elf-addr2line.exe"
var addr2line_path = "packages\\esp32\\tools\\xtensa-esp32-elf-gcc\\gcc8_4_0-esp-2021r2-patch3\\bin\\xtensa-esp32-elf-addr2line.exe";
var memory_address = null;
var esp32_version = "";
var esp32_gcc_version = "";
//xtensa-esp32-elf-addr2line -pfiaC -e build/PROJECT.elf ADDRESS

function decodeBacktrace() {
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
                var command = decoder_folder_input.value + addr2line_path + " -pfiaC -e " + elf_path_input.value.trim() + " " + memory_address;
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        backtraceResult.innerHTML += error.message + "<br>";
                        return;
                    }
                    if (stderr) {
                        backtraceResult.innerHTML += stderr + "<br>";
                        return;
                    }
                    backtraceResult.innerHTML += stdout + "<br>";
                });
            }
        }
        memory_address = backtraceDecoder_input.substring(lastIndex, m_length - 1);
        if (!memory_address.startsWith("Backtrace")) {
            var command = addr2line_path + " -pfiaC -e " + elf_path_input.value + " " + memory_address;
            exec(command, (error, stdout, stderr) => {
                if (error)
                    backtraceResult.innerHTML += error.message + "<br>";
                if (stderr)
                    backtraceResult.innerHTML += stderr + "<br>";
                if (stdout)
                    backtraceResult.innerHTML += stdout + "<br>";
                addParserResult(backtraceResult, backtraceDecoder_input);
                return;
            });
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

function syntaxHighlightDecoder(decoded) {
    decoded = decoded.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return decoded.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
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

function getESPaddr2line() {
    var hardwareFolder = decoder_folder_input.value + "packages\\esp32\\hardware\\esp32\\";
    fs.readdir(hardwareFolder, (err, files) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log(files);
        files.forEach(file => {
            esp32_version = file;
            console.log(esp32_version);
            fs.readFile(hardwareFolder + esp32_version + "\\installed.json", 'utf8', (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                }
                var installed_json = JSON.parse(data);
                console.log(installed_json);
                console.log(installed_json.packages[0].platforms[0].toolsDependencies[0].version);
                esp32_gcc_version = installed_json.packages[0].platforms[0].toolsDependencies[0].version;
                addr2line_path = "packages\\esp32\\tools\\xtensa-esp32-elf-gcc\\" + esp32_gcc_version + "\\bin\\xtensa-esp32-elf-addr2line.exe";
            });
        });
    });
}
