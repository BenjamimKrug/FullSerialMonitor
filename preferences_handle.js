//log file config elements and variables
var config_menu = document.getElementById("config_menu");
var log_addTimestamp = document.getElementById("log_addTimestamp");
var log_type = document.getElementById("log_type");
var log_folder = document.getElementById("log_folder");
var log_folder_input = document.getElementById("log_folder_input");
let log_file_writer = null;
var preferences = null;
var prev_preferences = null;

fs.readFile("./preferences.json", 'utf8', (err, data) => {
    if (err) {
        return;
    }
    preferences = JSON.parse(data);
    if (preferences != null) {
        if (typeof (preferences.comPort) !== 'undefined')
            comPorts.value = preferences.comPort;

        if (typeof (preferences.baudrate) !== 'undefined')
            baudrate_input.value = preferences.baudrate;

        if (typeof (preferences.autoScroll) !== 'undefined')
            autoScroll.checked = preferences.autoScroll;

        if (typeof (preferences.addTimestamp) !== 'undefined')
            addTimestamp.checked = preferences.addTimestamp;

        if (typeof (preferences.logFolder) !== 'undefined')
            log_folder_input.value = preferences.logFolder;

        if (typeof (preferences.logType) !== 'undefined')
            log_type.value = preferences.logType;

        if (typeof (preferences.logAddTimestamp) !== 'undefined')
            log_addTimestamp.checked = preferences.logAddTimestamp;

        if (typeof (preferences.ctrlEnter) !== 'undefined')
            ctrlEnter.checked = preferences.ctrlEnter;

        if (typeof (preferences.lineEnding) !== 'undefined')
            lineEnding.value = preferences.lineEnding;

        if (typeof (preferences.decoderFolder) !== 'undefined')
            decoder_folder_input.value = preferences.decoderFolder;

        if (typeof (preferences.decoderArch) !== 'undefined')
            decoderArch.value = preferences.decoderArch;

        if (typeof (preferences.customParsers) !== 'undefined') {
            customParsers = preferences.customParsers;
            customParsersCount = customParsers.length;
        }
    }
    prev_preferences = preferences;
});

function backupPreferences() {
    if (typeof (prev_preferences.comPort) !== 'undefined')
        comPorts.value = prev_preferences.comPort;

    if (typeof (prev_preferences.baudrate) !== 'undefined')
        baudrate_input.value = prev_preferences.baudrate;

    if (typeof (prev_preferences.autoScroll) !== 'undefined')
        autoScroll.checked = prev_preferences.autoScroll;

    if (typeof (prev_preferences.addTimestamp) !== 'undefined')
        addTimestamp.checked = prev_preferences.addTimestamp;

    if (typeof (prev_preferences.logFolder) !== 'undefined')
        log_folder_input.value = prev_preferences.logFolder;

    if (typeof (prev_preferences.logType) !== 'undefined')
        log_type.value = prev_preferences.logType;

    if (typeof (prev_preferences.logAddTimestamp) !== 'undefined')
        log_addTimestamp.checked = prev_preferences.logAddTimestamp;

    if (typeof (prev_preferences.ctrlEnter) !== 'undefined')
        ctrlEnter.checked = prev_preferences.ctrlEnter;

    if (typeof (prev_preferences.lineEnding) !== 'undefined')
        lineEnding.value = prev_preferences.lineEnding;

    if (typeof (prev_preferences.decoderFolder) !== 'undefined')
        decoder_folder_input.value = prev_preferences.decoderFolder;

    if (typeof (prev_preferences.decoderArch) !== 'undefined')
        decoderArch.value = prev_preferences.decoderArch;

    if (typeof (prev_preferences.customParsers) !== 'undefined')
        customParsers = prev_preferences.customParsers;
}

function readDirPaths(log, decoder) {
    if (log) {
        if (typeof (log_folder.files[0]) !== 'undefined') {
            var logFolderPath = log_folder.files[0].path.trim();
            log_folder_input.value = logFolderPath.substring(0, logFolderPath.lastIndexOf('\\') + 1);
        }
        else
            window.alert("Folder completly empty, must have at least one file");
    }
    if (decoder) {
        if (typeof (decoder_folder.files[0]) !== 'undefined') {
            var decoderFolderPath = decoder_folder.files[0].path.trim();
            decoder_folder_input.value = decoderFolderPath.substring(0, decoderFolderPath.lastIndexOf('\\') + 1);
        }
        else
            window.alert("Folder completly empty, must have at least one file");
    }
}

function getELF() {
    if (typeof (elf_path.files[0]) !== 'undefined')
        elf_path_input.value = elf_path.files[0].path.trim();
    elf_path_input.scrollLeft = elf_path_input.scrollWidth;
}

elf_path_input.addEventListener('blur', () => {
    elf_path_input.scrollLeft = elf_path_input.scrollWidth;
});

function updatePreferences() {
    preferences.logFolder = log_folder_input.value.trim();
    preferences.decoderFolder = decoder_folder_input.value.trim();
    preferences.logType = log_type.value.trim();
    preferences.logAddTimestamp = log_addTimestamp.checked;
    preferences.autoScroll = autoScroll.checked;
    if (preferences.autoScroll == true)
        terminal.scrollTop = terminal.scrollHeight;
    preferences.lineEnding = lineEnding.value.trim();
    preferences.addTimestamp = addTimestamp.checked;
    preferences.comPort = comPorts.value.trim();
    preferences.baudrate = baudrate_input.value.trim();
    preferences.ctrlEnter = ctrlEnter.checked;
    preferences.customParsers = customParsers;
    fs.writeFile("./preferences.json", JSON.stringify(preferences), (err) => {
        if (err)
            window.alert("Error on writing preferences file:", err);
    });
    prev_preferences = preferences;
}

document.getElementById("open_config_menu").onclick = function () {
    prev_preferences = preferences;
    if (config_menu.style.display != "none")
        config_menu.style.display = "none";
    else
        config_menu.style.display = "block";
};