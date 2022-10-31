//log file config elements and variables
var config_menu = document.getElementById("config_menu");
var log_addTimestamp = document.getElementById("log_add_timestamp");
var log_type = document.getElementById("log_type");
var log_folder = document.getElementById("log_folder");
var log_folder_input = document.getElementById("log_folder_input");
var json_color = document.getElementById("json_color");
var theme_style = document.getElementById("theme_style");
var theme_select = document.getElementById("theme_select");
let log_file_writer = null;
var preferences = null;
var prev_preferences = null;

fs.readFile("./preferences.json", 'utf8', (err, data) => {
    if (err) {
        return;
    }
    preferences = JSON.parse(data);
    if (preferences != null) {
        setPreferences(preferences);
    }
    prev_preferences = preferences;
});


function setPreferences(target_preferences) {
    if (typeof (target_preferences.comPort) !== 'undefined')
        com_ports.value = target_preferences.comPort;

    if (typeof (target_preferences.baudrate) !== 'undefined')
        baudrate_input.value = target_preferences.baudrate;

    if (typeof (target_preferences.autoScroll) !== 'undefined')
        auto_scroll.checked = target_preferences.autoScroll;

    if (typeof (target_preferences.addTimestamp) !== 'undefined')
        add_timestamp.checked = target_preferences.addTimestamp;

    if (typeof (target_preferences.logFolder) !== 'undefined')
        log_folder_input.value = target_preferences.logFolder;

    if (typeof (target_preferences.logType) !== 'undefined')
        log_type.value = target_preferences.logType;

    if (typeof (target_preferences.logAddTimestamp) !== 'undefined')
        log_add_timestamp.checked = target_preferences.logAddTimestamp;

    if (typeof (target_preferences.ctrlEnter) !== 'undefined')
        ctrl_enter.checked = target_preferences.ctrlEnter;

    if (typeof (target_preferences.lineEnding) !== 'undefined')
        line_ending.value = target_preferences.lineEnding;

    if (typeof (target_preferences.decoderFolder) !== 'undefined')
        decoder_folder_input.value = target_preferences.decoderFolder;

    if (typeof (target_preferences.decoderArch) !== 'undefined')
        decoder_arch.value = target_preferences.decoderArch;

    if (typeof (target_preferences.decoderColor) !== 'undefined')
        decoder_color.value = target_preferences.decoderColor;

    if (typeof (target_preferences.jsonColor) !== 'undefined')
        json_color.value = target_preferences.jsonColor;

    if (typeof (target_preferences.disconnectOnBoot) !== 'undefined')
        disconnect_on_boot.checked = target_preferences.disconnectOnBoot;

    if (typeof (target_preferences.showConChanges) !== 'undefined')
        show_con_changes.checked = target_preferences.showConChanges;

    if (typeof (target_preferences.elfPath) !== 'undefined')
        elf_path_input.value = target_preferences.elfPath;

    if (typeof (target_preferences.theme) !== 'undefined') {
        theme_select.value = target_preferences.theme;
        theme_style.href = theme_select.value + "_theme_style.css";
    }

    if (typeof (target_preferences.customParsers) !== 'undefined') {
        custom_parsers = target_preferences.customParsers;
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
        jsonColor: json_color.value,
        disconnectOnBoot: disconnect_on_boot.checked,
        showConChanges: show_con_changes.checked,
        logType: log_type.value,
        logAddTimestamp: log_addTimestamp.checked,
        autoScroll: auto_scroll.checked,
        lineEnding: line_ending.value,
        addTimestamp: add_timestamp.checked,
        comPort: com_ports.value,
        baudrate: baudrate_input.value,
        ctrlEnter: ctrl_enter.checked,
        theme: theme_select.value,
        elfPath: elf_path_input.value.trim(),
        customParsers: custom_parsers
    };
    if (preferences.autoScroll == true) {
        terminal.scrollTop = terminal.scrollHeight;
        output_history.scrollTop = output_history.scrollHeight;
    }
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