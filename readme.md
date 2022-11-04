### Introduction
This is a Serial monitor I developed with every feature I ever saw on other monitors or found useful to have. Fully developed in Javascript with Node and Electron. I made it after using many serial monitors and not finding any of them complete, always missing some feature.

### Included features:
- Every basic feature:
    - COM port selection
    - BaudRate selection with wide range of options
    - Optional autoscroll
    - Optional timestamp
    - Data sending with line ending options and optional hotkey, either Enter or Ctrl + Enter
    - Dark and Light theme
    - Received data clean button
- Log file for the received data, with the option to choose whether to overwrite or append to the file
- Parsers:
    - ESP Exception Decoder: automatic .elf file detection and processor architecture detection
    <img src="/documentation/exception decoder output.png" alt="exception output">
    - JSON parser for JSON payloads sent on the serial port
    <img src="/documentation/json output.png" alt="json output">
    - Custom parsers that can be added by the user, also written in JS, activated on custom trigger words.
    <img src="/documentation/custom parser registry.png" alt="parser registry">
    a deeper explanation on how to use the custom parser feature can be found later on in this readme file
    - Parser entries history similar to the packet history in MQTT Explorer by Thomas Nordquist(https://github.com/thomasnordquist)  
    <img src="/documentation/parser output entry history.png" alt="parser history">  
    - Parser entries with customized colors to help differientiate entries according to the parser similar to MQTT FX by SoftBlade    
    <img src="/documentation/exception decoder parser color.png" alt="exception color">
    <img src="/documentation/json parser color.png" alt="json color">
- Text finder on the whole page from electron-find from TheoXiong(https://github.com/TheoXiong/electron-find)
<img src="/documentation/text finder.png" alt="text finder">
- Optional connection status change display
- Optional disconnection on Boot message from ESP series microcontrollers

### Planned features to be added on future versions:
- Sent payload sequencer, where you can set a list of payloads to be sent and the delay between each payload
- Data grapher, ideally a mix of the Arduino Serial Plotter and the MQTT Explorer graphs
- Other useful built in parsers, like ModBus - RTU
- Manual input Exception decoder similar to the solution from me-no-dev(https://github.com/me-no-dev/EspExceptionDecoder) for Arduino 1.x, currently the decoder can only be used with data that come from the COM port
- Increase parser output history usability
- More customization options for the built in parsers
- Useful features suggested by the users

### How to use the built-in ESP Exception Decoder
If you want to use the built in ESP Exception Decoder you must configure the Arduino data Folder, usually can be found on the following path Users/username/AppData/Local/Arduino15, due to the nature of electron security the program can't find the folder on it's own.
<img src="/documentation/Arduino15 folder.png" alt="arduino15 folder">
After setting the Arduino15 folder the program can find all the rest it needs, such as the .elf file used to run the backtrace, which is found automatically based on the most recently changed arduino sketch folder on the Temp Folder and from that folder it can detect the ESP architecture. The parsing should be done automatically when the Backtrace is sent on the serial monitor.

### How to use the Custom Parsers feature
To use the custom parsers feature, you must first create a .js file with a parser function following the pattern specified in the example [file](/documentation/customParserExample.js). With the created file, go to the config menu:
<img src="/documentation/empty custom parser div.png" alt="empty parser div">
Click on the + button, to add a new custom parser
<img src="/documentation/empty custom parser registry.png" alt="parser registry">
Then fill all the fields:
<img src="/documentation/custom parser registry.png" alt="parser registry">
- *Name*: name of the parser, for easier use on the part of the user
- *Script*: path for the script file, can be written manually or found through the browse function
- *Function*: name of the function use to parse the data
- *Trigger*: word or character that must be in the line for it to get sent to the parser, for example in the JSON parser the trigger is the '{' character and for the exception decoder it's the word Backtrace
- *Color*: identification color used on the parser entry in the output history div

Obs.: all the parsing is done only when the line is fully sent, so it happens when a \n character is sent, ending the line.

### How to use the Parser output history functionality
As the parsers put out results, the get added to the history div as a button with the time of entry, the payload used in the parser and the color assigned to that parser. 
<img src="/documentation/output history example.png" alt="parser output history">

In the right corner you can see there is a filter button

<img src="/documentation/filter example.png" alt="filter example">

On this dropdown you can check the parsers you actively want to see, in this case the JSON parser is unchecked so only the exception decoder gets show:

<img src="/documentation/filtered history example.png" alt="filtered history example">

When you click on the parser output entry, the output div gets filled with the parser result for that entry.