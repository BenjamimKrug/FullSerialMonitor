//log file config elements and variables
var config_menu = document.getElementById("config_menu");
var log_addTimestamp = document.getElementById("log_add_timestamp");
var log_type = document.getElementById("log_type");
var log_folder = document.getElementById("log_folder");
var log_folder_input = document.getElementById("log_folder_input");
var json_color = document.getElementById("json_color");
var theme_style = document.getElementById("theme_style");
var theme_select = document.getElementById("theme_select");
var advanced_config = document.getElementById("advanced_config");
var advanced_config_div = document.getElementById("advanced_config_div");
var parity_select = document.getElementById("parity");
var dataBits_select = document.getElementById("dataBits");
var stopBits_select = document.getElementById("stopBits");
var rtscts_enable = document.getElementById("rtscts");
var xon_enable = document.getElementById("xon");
var xoff_enable = document.getElementById("xoff");
var xany_enable = document.getElementById("xany");
var hupcl_enable = document.getElementById("hupcl");

const preferences_file_path = "./preferences.json";

let log_file_writer = null;
var preferences = null;
var prev_preferences = null;

var defaultPreferences = {
    lang: "en.json",
    decoderColor: "#0000ff",
    jsonColor: "#00ff00",
    disconnectOnBoot: false,
    showConChanges: false,
    logType: "none",
    logAddTimestamp: false,
    autoScroll: true,
    lineEnding: "",
    addTimestamp: true,
    comPort: "",
    baudrate: 115200,
    ctrlEnter: false,
    advancedConfig: {
        enabled: false,
        stopBits: 1,
        dataBits: 8,
        parity: "none",
        rtscts: false,
        xon: false,
        xoff: false,
        xany: false,
        hupcl: false
    },
    theme: "dark",
    elfPath: "",
    customParsers: ""
};

fs.readFile(preferences_file_path, 'utf8', (err, data) => {
    if (err) {
        setPreferences(defaultPreferences);
        return;
    }
    preferences = JSON.parse(data);
    if (preferences != null) {
        setPreferences(preferences);
    }
    prev_preferences = {...preferences};
});


function setPreferences(target_preferences) {    
    updateLanguageList();
    if (typeof (target_preferences.lang) !== 'undefined')
        language_config.value = target_preferences.lang;
    readLanguage();
    updateContentLang();

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

    if (typeof (target_preferences.decoderArch) !== 'undefined')
        decoder_arch.value = target_preferences.decoderArch;

    if (typeof (target_preferences.elfPath) !== 'undefined')
        elf_path_input.value = target_preferences.elfPath;

    if (typeof (target_preferences.theme) !== 'undefined') {
        theme_select.value = target_preferences.theme;
        theme_style.href = "../style/" + theme_select.value + "_theme_style.css";
    }

    if (typeof (target_preferences.customParsers) !== 'undefined') {
        custom_parsers = target_preferences.customParsers;
        updateParsers();
    }

    if (typeof (target_preferences.advancedConfig) !== 'undefined') {
        advanced_config.checked = target_preferences.advancedConfig.enabled;
        stopBits_select.value = target_preferences.advancedConfig.stopBits;
        dataBits_select.value = target_preferences.advancedConfig.dataBits;
        parity_select.value = target_preferences.advancedConfig.parity;
        rtscts_enable.checked = target_preferences.advancedConfig.rtscts;
        xon_enable.checked = target_preferences.advancedConfig.xon;
        xoff_enable.checked = target_preferences.advancedConfig.xoff;
        xany_enable.checked = target_preferences.advancedConfig.xany;
        hupcl_enable.checked = target_preferences.advancedConfig.hupcl;
        changeAdvConfigDiv();
    }
}

function readDirPaths(log, decoder) {
    if (log) {
        if (typeof (log_folder.files[0]) !== 'undefined') {
            var log_folder_path = log_folder.files[0].path.trim();
            log_folder_input.value = log_folder_path.substring(0, log_folder_path.lastIndexOf('\\') + 1);
        }
        else
            ipcRenderer.send("openAlert", current_language["folder_empty_error"]);
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

function changeAdvConfigDiv() {
    if (advanced_config.checked) {
        advanced_config_div.style.display = "block";
        output_history.style.height = "23%";
    }
    else {
        advanced_config_div.style.display = "none";
        output_history.style.height = "46%";
        stopBits_select.value = "1";
        dataBits_select.value = "8";
        parity_select.value = "none";
        rtscts_enable.checked = false;
        xon_enable.checked = false;
        xoff_enable.checked = false;
        xany_enable.checked = false;
        hupcl_enable.checked = false;
    }
}

function updatePreferences() {
    saveCustomParsers();
    var advancedConfig_json = {
        enabled: advanced_config.checked,
        stopBits: stopBits_select.value,
        dataBits: dataBits_select.value,
        parity: parity_select.value,
        rtscts: rtscts_enable.checked,
        xon: xon_enable.checked,
        xoff: xoff_enable.checked,
        xany: xany_enable.checked,
        hupcl: hupcl_enable.checked
    };
    preferences = {
        lang: language_config.value.trim(),
        logFolder: log_folder_input.value.trim(),
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
        advancedConfig: advancedConfig_json,
        theme: theme_select.value,
        decoderArch: decoder_arch.value.trim(),
        elfPath: elf_path_input.value.trim(),
        customParsers: custom_parsers
    };
    if (preferences.autoScroll == true) {
        terminal.scrollTop = terminal.scrollHeight;
        output_history.scrollTop = output_history.scrollHeight;
    }    
    fs.unlink(preferences_file_path, (e) => { if (e) console.log(e) });
    fs.writeFile(preferences_file_path, JSON.stringify(preferences), (err) => {
        if (err)
            ipcRenderer.send("openAlert", current_language["writing_error"]);
    });
    prev_preferences = {...preferences};
}

function updateTheme(){
    theme_style.href = '../style/' + theme_select.value + '_theme_style.css';
    ipcRenderer.send('recvMain', { id: 1, cmd: "setTheme", theme: theme_style.href });
    ipcRenderer.send('recvMain', { id: 2, cmd: "setTheme", theme: theme_style.href });
}

document.getElementById("open_config_menu").onclick = function () {
    updateLanguageList();
    prev_preferences = {...preferences};
    if (config_menu.style.display != "none")
        config_menu.style.display = "none";
    else
        config_menu.style.display = "block";
};