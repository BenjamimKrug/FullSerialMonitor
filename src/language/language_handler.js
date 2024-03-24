var current_language;
var language_config = document.getElementById("language_config");
// Function to update content based on selected language
function updateContentLang() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = current_language[key];
    });
    if (window.location.href.includes("main_window")) {
        ipcRenderer.send('setLang', current_language);
        ipcRenderer.send('recvMain', { id: 1, cmd: 'setLang', lang: current_language });
        ipcRenderer.send('recvMain', { id: 2, cmd: 'setLang', lang: current_language });
        ipcRenderer.send('recvMain', { id: 3, cmd: 'setLang', lang: current_language });
    }
}

function readLanguage() {
    if (typeof language_config == "undefined")
        return;
    var data = fs.readFileSync('./language/' + language_config.value, { encoding: 'utf8', flag: 'r' });
    current_language = JSON.parse(data);
}

function updateLanguageList() {
    if (typeof language_config == "undefined")
        return;
    var current_language_config = language_config.value;
    var files = fs.readdirSync('./language/', { withFileTypes: true });
    language_config.innerHTML = "";
    var file_count = files.length;
    for (var i = 0; i < file_count; i++) {
        if (files[i].name == "language_handler.js")
            continue;
        var option = document.createElement("option");
        option.value = files[i].name;
        option.innerHTML = files[i].name.replace(".json", "");
        if (current_language_config == files[i].name)
            option.setAttribute("selected", "");
        language_config.appendChild(option);
    }
}