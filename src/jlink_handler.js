var jlink_path = "start /D \"%ProgramFiles%\\SEGGER\\JLink\"";
console.log(execSync(jlink_path + " Jlink.exe").toString());