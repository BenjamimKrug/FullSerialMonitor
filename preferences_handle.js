//log file config elements and variables
var config_menu = document.getElementById("config_menu");
var log_addTimestamp = document.getElementById("log_add_timestamp");
var log_type = document.getElementById("log_type");
var log_folder = document.getElementById("log_folder");
var log_folder_input = document.getElementById("log_folder_input");
var json_color = document.getElementById("json_color");
var json_filter = document.getElementById("json_filter");
var decoder_filter = document.getElementById("decoder_filter");
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
            com_ports.value = preferences.comPort;

        if (typeof (preferences.baudrate) !== 'undefined')
            baudrate_input.value = preferences.baudrate;

        if (typeof (preferences.autoScroll) !== 'undefined')
            auto_scroll.checked = preferences.autoScroll;

        if (typeof (preferences.addTimestamp) !== 'undefined')
            add_timestamp.checked = preferences.addTimestamp;

        if (typeof (preferences.logFolder) !== 'undefined')
            log_folder_input.value = preferences.logFolder;

        if (typeof (preferences.logType) !== 'undefined')
            log_type.value = preferences.logType;

        if (typeof (preferences.logAddTimestamp) !== 'undefined')
            log_add_timestamp.checked = preferences.logAddTimestamp;

        if (typeof (preferences.ctrlEnter) !== 'undefined')
            ctrl_enter.checked = preferences.ctrlEnter;

        if (typeof (preferences.lineEnding) !== 'undefined')
            line_ending.value = preferences.lineEnding;

        if (typeof (preferences.decoderFolder) !== 'undefined')
            decoder_folder_input.value = preferences.decoderFolder;

        if (typeof (preferences.decoderArch) !== 'undefined')
            decoder_arch.value = preferences.decoderArch;

        if (typeof (preferences.decoderColor) !== 'undefined')
            decoder_color.value = preferences.decoderColor;
            
        if (typeof (preferences.decoderFilter) !== 'undefined')
        decoder_filter.checked = preferences.decoderFilter;

        if (typeof (preferences.jsonColor) !== 'undefined')
            json_color.value = preferences.jsonColor;

        if (typeof (preferences.jsonFilter) !== 'undefined')
            json_filter.checked = preferences.jsonFilter;

        if (typeof (preferences.elfPath) !== 'undefined')
            elf_path_input.value = preferences.elfPath;

        if (typeof (preferences.customParsers) !== 'undefined') {
            custom_parsers = preferences.customParsers;
            updateParsers();
        }
    }
    prev_preferences = preferences;
});

function backupPreferences() {
    if (typeof (prev_preferences.comPort) !== 'undefined')
        com_ports.value = prev_preferences.comPort;

    if (typeof (prev_preferences.baudrate) !== 'undefined')
        baudrate_input.value = prev_preferences.baudrate;

    if (typeof (prev_preferences.autoScroll) !== 'undefined')
        auto_scroll.checked = prev_preferences.autoScroll;

    if (typeof (prev_preferences.addTimestamp) !== 'undefined')
        add_timestamp.checked = prev_preferences.addTimestamp;

    if (typeof (prev_preferences.logFolder) !== 'undefined')
        log_folder_input.value = prev_preferences.logFolder;

    if (typeof (prev_preferences.logType) !== 'undefined')
        log_type.value = prev_preferences.logType;

    if (typeof (prev_preferences.logAddTimestamp) !== 'undefined')
        log_add_timestamp.checked = prev_preferences.logAddTimestamp;

    if (typeof (prev_preferences.ctrlEnter) !== 'undefined')
        ctrl_enter.checked = prev_preferences.ctrlEnter;

    if (typeof (prev_preferences.lineEnding) !== 'undefined')
        line_ending.value = prev_preferences.lineEnding;

    if (typeof (prev_preferences.decoderFolder) !== 'undefined')
        decoder_folder_input.value = prev_preferences.decoderFolder;

    if (typeof (prev_preferences.decoderArch) !== 'undefined')
        decoder_arch.value = prev_preferences.decoderArch;

    if (typeof (prev_preferences.decoderColor) !== 'undefined')
        decoder_color.value = prev_preferences.decoderColor;

    if (typeof (prev_preferences.jsonColor) !== 'undefined')
        json_color.value = prev_preferences.jsonColor;

    if (typeof (prev_preferences.jsonFilter) !== 'undefined')
        json_filter.checked = prev_preferences.jsonFilter;

    if (typeof (prev_preferences.elfPath) !== 'undefined')
        elf_path_input.value = prev_preferences.elfPath;

    if (typeof (prev_preferences.customParsers) !== 'undefined') {
        custom_parsers = prev_preferences.customParsers;
        updateParsers();
    }
}

function readDirPaths(log, decoder) {
    if (log) {
        if (typeof (log_folder.files[0]) !== 'undefined') {
            var log_folder_path = log_folder.files[0].path.trim();
            log_folder_input.value = log_folder_path.substring(0, log_folder_path.lastIndexOf('\\') + 1);
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
    saveCustomParsers();
    preferences = {
        logFolder: log_folder_input.value.trim(),
        decoderFolder: decoder_folder_input.value.trim(),
        decoderColor: decoder_color.value,
        decoderFilter: decoder_filter.checked,
        jsonColor: json_color.value,
        jsonFilter: json_filter.checked,
        logType: log_type.value,
        logAddTimestamp: log_addTimestamp.checked,
        autoScroll: auto_scroll.checked,
        lineEnding: line_ending.value,
        addTimestamp: add_timestamp.checked,
        comPort: com_ports.value,
        baudrate: baudrate_input.value,
        ctrlEnter: ctrl_enter.checked,
        elfPath: elf_path_input.value.trim(),
        customParsers: custom_parsers
    };
    if (preferences.autoScroll == true)
        terminal.scrollTop = terminal.scrollHeight;
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