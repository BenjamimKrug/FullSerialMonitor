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
- Graph for the data received on the serial port:
    <img src="/documentation/graph window with values.png" alt="graph with data">
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
- Other useful built in parsers, like ModBus - RTU
- Y-MODEM upload for files
- Increase parser output history usability
- More customization options for the built in parsers
- Useful features suggested by the users

### How to use the built-in ESP Exception Decoder
If you want to use the built in ESP Exception Decoder for the serial port terminal you can just select the .elf file for the current code you're running on your ESP through the browse button:
<img src="/documentation/esp exception decoder section.png" alt="esp exception decoder section">
Which will then open a file explorer for you to select the file. Alternatively you can simply click the "Auto detect" button if you're using the Arduino IDE, which normally puts all it's compilation files in the Temp folder, so the program can find them by getting the most recently compiled.

### How to use the Custom Parsers feature
To use the custom parsers feature, you must first create a .js file with a parser function following the pattern specified in the example [file](/documentation/customParserExample.js). With the created file, go to the config menu on the custom parsers section:
<img src="/documentation/empty custom parser div.png" alt="empty parser div">
Click on the + button, to add a new custom parser
<img src="/documentation/empty custom parser registry.png" alt="parser registry">
Then fill all the fields:
<img src="/documentation/custom parser registry.png" alt="parser registry">
Where each field is the following:
- *Name*: name of the parser, for easier use on the part of the user
- *Script*: path for the script file, can be written manually or found through the browse function
- *Function*: name of the function use to parse the data
- *Trigger*: word or character that must be in the line for it to get sent to the parser, for example in the JSON parser the trigger is the '{' character and for the exception decoder it's the word Backtrace
- *Color*: identification color used on the parser entry in the output history div

Obs.: all the parsing is done only when the line is fully sent, so it happens when a \n character is sent, ending the line.

When the parser is configured the results will start appearing on the output history div for every line that contains the string you filled in the trigger field. It should look something like this:
<img src="/documentation/parser output entry history.png" alt="parser output entry history">

### How to use the Parser output history functionality
As the parsers put out results, they get added to the history div as a button with the time of entry, the payload used in the parser and the color assigned to that parser. 
<img src="/documentation/output history example.png" alt="output history">

In the right corner you can see there is a filter button

<img src="/documentation/filter example.png" alt="filter example">

On this dropdown you can check the parsers you actively want to see, in this case the JSON parser is unchecked so only the exception decoder gets show:

<img src="/documentation/filtered history example.png" alt="filtered history example">

When you click on the parser output entry, the output div gets filled with the parser result for that entry.

### How to use the Graph Feature

To use the graph feature, you must first  open the window by going to the tools button and then clicking the Grapher button
<img src="/documentation/grapher button.png" alt="grapher button">
Once you open the window, at least on you first time opening it will look like this:
<img src="/documentation/empty graph window.png" alt="empty graph window">
When you open the config menu it should look something like this:
<img src="/documentation/graph tracking empty.png" alt="empty graph tracking config">
Click on the + button, to add a new graph tracking
<img src="/documentation/empty graph tracking item.png" alt="empty graph tracking item">
Then fill all the fields:
<img src="/documentation/filled graph tracking item.png" alt="filled graph tracking item">
Where each field is the following:
- *Name*: name of the parser, for easier use on the part of the user
- *Trigger*: substring at the start of the line used to identify the graph data on the serial port, it will be removed from the line data and the numerical value right after it will be sent to the graph.

So for example with the graph tracking configured in the example the text received on the terminal will be the following:
`value15`
Where 15 is the value that get added to the graph values and value is discarted. As with the custom parsers, a new line('\n') character is needed at the end of the data for it to be parsed.

When data starts to come in the graph will be filled:
<img src="/documentation/graph window with values.png" alt="graph window with values">