### Introduction
This is a Serial monitor I developing with every feature I ever saw on various other monitors or found useful to have. Fully developed in Javascript with Node and Electron. I made it after using many serial monitors and not finding any of them complete, always missing some feature, so I decided to make my own serial monitor that would have all the features needed for a serial monitor.

### Included features
- Every basic feature:
    - COM port selection
    - BaudRate selection with wide range of options
    - Optional autoscroll
    - Optional timestamp
    - Data sending with line ending options and optional hotkey, either Enter or Ctrl + Enter
    - Dark and Light theme
    - Multilanguage support, for now English and Brazillian Portuguese are built in, however anyone can make a translation and add it to the languages folder, (and help with adding them to program if they're kind hearted).
    - Received data clean button
- Log file for the received data, with the option to choose whether to overwrite or append to the file
- Graph for the data received on the serial port:
    <img src="/documentation/graph window with values.png" alt="graph with data">
- Parsers:
    - ESP Exception Decoder: automatic .elf file detection and processor architecture detection
    <img src="/documentation/exception decoder output.png" alt="exception output">
    - JSON parser for JSON payloads sent on the serial port
    <img src="/documentation/json output.png" alt="json output">
    - Custom parsers that can be added by the user, also written in JS, activated on custom trigger substrings.
    <img src="/documentation/custom parser registry.png" alt="parser registry">
    a deeper explanation on how to use the custom parser feature can be found [later on in this readme file](#how-to-use-the-custom-parsers-feature)
    - Parser entries history similar to the packet history in MQTT Explorer by [Thomas Nordquist](https://github.com/thomasnordquist)  
    <img src="/documentation/parser output entry history.png" alt="parser history">
    - Parser entries with customized colors to help differientiate entries according to the parser similar to [MQTT FX by SoftBlade](https://www.softblade.de/)
    <img src="/documentation/exception decoder parser color.png" alt="exception color">
    <img src="/documentation/json parser color.png" alt="json color">
- Text finder on the whole page from [electron-find from TheoXiong](https://github.com/TheoXiong/electron-find)
    <img src="/documentation/text finder.png" alt="text finder">
- Optional connection status change display
- Optional disconnection on Boot message from ESP series microcontrollers
- Standalone ESP Exception Decoder

### Planned features to be added on future versions
- Other useful built in parsers, like ModBus - RTU
- RTT port connection
- X, Y, Z MODEM upload for files
- Increase parser output history usability
- More customization options for the built in parsers
- Useful features suggested by the users

### Installation process
The installation process is very simple, you simply download the most recent version on the [releases page](https://github.com/BenjamimKrug/FullSerialMonitor/releases). A Windows version is already built in a zip file, but if you use another platform for now your best option is to build the version yourself. 
Note: For now I don't have access to linux or Mac computer to test builds for those platforms.

With the .zip file, simply unzip it and put the resulting folder somewhere you'll be able to find it. Only thing to be careful is to not put it somewhere where special admnistrative access is needed to access the files, as that will cause some problems with the program.

### How to use the Logging feature
To use the logging feature you can configure it on the config menu, at first it will look like the following:
<img src="/documentation/log file empty.png" alt="log file empty">

The Log file can be configured into 3 modes:
- *None*: No log file will be created and no data logging.
- *Overwrite*: Data received on the serial terminal will overwrite any existing file from the previous session. So if you close the program and open it again, once the serial port is connected the previous log will be discarded. 
- *Append*: All data received on the serial terminal will be appended to the log file, so the log persists between closing and opening the program.

The "Add Timestamp" switch can be checked to add the timestamp to the log file.
To select where the log file will be created, simply click on the "Browse..." button and select the folder.

Once it is all configured, when you connect to the serial port a file called "log.txt" will be created on the folder you selected, and the data received will be treated according to the mode configured.

### How to use the built-in ESP Exception Decoder
If you want to use the built in ESP Exception Decoder for the serial port terminal you can just select the .elf file for the current code you're running on your ESP through the browse button:
<img src="/documentation/esp exception decoder section.png" alt="esp exception decoder section">
Which will then open a file explorer for you to select the file. Alternatively you can simply click the "Auto detect" button if you're using the Arduino IDE, which normally puts all it's compilation files in the Temp folder, so the program can find them by getting the most recently compiled.
When a line starting with "Backtrace" is received on the serial port, the parser does the decoding automatically and outputs it in the lower half:
<img src="/documentation/exception decoder output.png" alt="exception decoder output">

### How to use the standalone ESP Exception Decoder
Beyond the built into the terminal Decoder, the program also includes a standalone ESP Exception decoder, you can open it via the tools menu:
<img src="/documentation/standalone exception decoder button.png" alt="standalone exception decoder button">

Upon opening the window it will look like this:
<img src="/documentation/empty standalone exception decoder.png" alt="empty standalone exception decoder">

So just fill in your backtrace and the path to your .elf file:
<img src="/documentation/standalone exception decoder filled in.png" alt="standalone exception decoder filled in">

If you use the Arduino IDE, you can simply click the "Auto Detect" button for it to find the most recently compiled sketch

Once it is all filled in, just click the "Decode" button and the decoded backtrace will appear in the Output div:
<img src="/documentation/standalone exception decoder decoded.png" alt="standalone exception decoder decoded">

### How to use the Custom Parsers feature
To use the custom parsers feature, you must first create a .js file with a parser function following the pattern specified in the [example file](/documentation/customParserExample.js). With the created file, go to the config menu on the custom parsers section:
<img src="/documentation/empty custom parser div.png" alt="empty parser div">
Click on the "+" button to add a new custom parser
<img src="/documentation/empty custom parser registry.png" alt="parser registry">
Then fill all the fields:
<img src="/documentation/custom parser registry.png" alt="parser registry">
Where each field is the following:
- *Name*: name of the parser, for easier use on the part of the user
- *Script*: path for the script file, can be written manually or found through the browse function
- *Function*: name of the function use to parse the data, it is important to be careful that the function name must always be unique.
- *Trigger*: substring that must be in the line for it to get sent to the parser, for example in the JSON parser the trigger is "{" and for the exception decoder it's "Backtrace"
- *Color*: identification color used on the parser entry in the output history div

Note: all the parsing is done only when the line is fully sent, so it happens when a \n character is received, ending the line.

When the parser is configured the results will start appearing on the output history div for every line that contains the string you filled in the trigger field. It should look something like this:
<img src="/documentation/parser output entry history.png" alt="parser output entry history">

### How to use the Parser output history feature
As the parsers put out results, they get added to the history div as a button with the time of entry, the payload used in the parser and the color assigned to that parser. 
<img src="/documentation/output history example.png" alt="output history">

In the right corner you can see there is a "Filters" button
<img src="/documentation/filter example.png" alt="filter example">

On this dropdown you can check the parsers you actively want to see, in this case the JSON parser is unchecked so only the exception decoder gets show:
<img src="/documentation/filtered history example.png" alt="filtered history example">

When you click on the parser output entry, the output div gets filled with the parser result for that entry.

### How to use the Graph Feature
To use the graph feature, you must first open the window by going to the tools button and then clicking the Grapher button
<img src="/documentation/grapher button.png" alt="grapher button">
Once you open the window, at least on you first time opening it will look like this:
<img src="/documentation/empty graph window.png" alt="empty graph window">
When you open the config menu it should look something like this:
<img src="/documentation/graph tracking empty.png" alt="empty graph tracking config">
Click on the "+" button to add a new graph tracking
<img src="/documentation/empty graph tracking item.png" alt="empty graph tracking item">
Then fill all the fields:
<img src="/documentation/filled graph tracking item.png" alt="filled graph tracking item">
Where each field is the following:
- *Name*: name of the series, for labeling the series on the graph
- *Trigger*: substring at the start of the line used to identify the graph data on the serial port, it will be removed from the line data and the numerical value right after it will be sent to the graph.
- *Color*: the color that will be used to display the series

So for example with the graph tracking configured in the example the text received on the terminal will be the following:
`value15`
Where 15 is the value that get added to the graph series and the string "value" is discarted. As with the custom parsers, a new line('\n') character is needed at the end of the data for it to be parsed.

When data starts to come in the serial port, the graph will be filled:
<img src="/documentation/graph window with values.png" alt="graph window with values">

Note that on the top of the screen there is a label for each of the series currently being tracked, in this case there are two series, by clicking on the label you can hide any series you want and then click again to show them once more:
<img src="/documentation/graph window with test invisible.png" alt="graph window with test invisible">

You can set the axis ranges on the config menu:
<img src="/documentation/graph config ranges.png" alt="graph config ranges">
If you do not want to manually set the values you can simply check the auto detect slider, that way the graph will set the ranges based on the minimum and maximum values present in the series'.

Finally you can configure how many data points in the X axis you wish to have in the graph. For example, In case you only want 100 points to be shown, you can configure it in the menu:
<img src="/documentation/graph max points.png" alt="graph max points">

Once that happens, only the most recent 100 points will be shown in the graph, all points beyond that will be discarded.
If you do not want any data to be discarded, simply set the value to 0, then all data will be kept in the graph until you manually delete them with the delete button in the corner of the screen.


### How to use the Payload sequencer feature
The program includes a feature to program a sequence of packets to be sent via the serial port, to use it you can open it via the tools menu:
<img src="/documentation/payload sequencer button.png" alt="payload sequencer button">

Upon opening the window for the first time, it will look like this:
<img src="/documentation/empty payload sequencer.png" alt="empty payload sequencer">

To add a packet to the sequence simply click the "Add Packet" button, with that an empty field will be created at the end of the sequence:
<img src="/documentation/empty payload sequencer item.png" alt="empty payload sequencer item">
Where each field is the following:
- *Packet*: is the field where you will type in the actual data you want to send
- *Delay*: is the field where you will put the delay until that packet is sent. It starts counting from the time it send the previous packet, so for the first packet it start counting from the moment you click the "send sequence" button.

<img src="/documentation/payload sequencer window.png" alt="payload sequencer window">

After you've saved the sequence, you can start sending the sequence, if "Continuous sequence" is checked the sequence will repeat continously, if not it will run the whole sequence and then stop.

Note: the line ending for each of the packets will be the line ending configured at the top of the terminal
