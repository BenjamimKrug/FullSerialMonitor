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
//xtensa-esp32-elf-addr2line -pfiaC -e build/PROJECT.elf ADDRESS


function decodeResult() {
    if (elf_path_input.value != "") {
        var index = backtraceDecoder_input.indexOf(" ");
        var lastIndex = 0;
        var m_length = backtraceDecoder_input.length;
        while (index > -1) {
            memory_address = backtraceDecoder_input.substring(lastIndex, index);
            lastIndex = index + 1;
            index = backtraceDecoder_input.indexOf(" ", lastIndex);
            if (!memory_address.startsWith("Backtrace")) {
                var command = decoder_folder_input.value + addr2line_path + " -pFiac -e " + elf_path_input.value.trim() + " " + memory_address;
                console.log(command);
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                        return;
                    }
                    console.log(`stdout: ${stdout}`);
                });
            }
        }
        memory_address = backtraceDecoder_input.substring(lastIndex, m_length - 1);
        if (!memory_address.startsWith("Backtrace")) {
            var command = addr2line_path + " -pFiac -e " + elf_path_input.value + " " + memory_address;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });
        }
    }
    else {
        if (!elf_error_warning) {
            elf_error_warning = true;
            window.alert("Backtrace could not be parsed, choose .elf file please");
        }
    }
}
