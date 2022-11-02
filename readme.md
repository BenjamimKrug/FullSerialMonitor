This is a Serial monitor I developed with every feature I ever saw on other monitor or found useful to have. Fully developed in Javscript with Node and Electron.

Included features:
- Every basic feature: 
    - COM port selection
    - BaudRate selection with wide range of options
    - Optional autoscroll
    - Optional timestamp
    - Data sending with line ending options and optional hotkey, either Enter or Ctrl + Enter
    - Dark and light theme
    - Received data clean button
- Log file for the received data, with the option to choose wheter to overwrite or append to the file
- Parsers:
    - ESP exception Decoder: automatic .elf file detection and processor architecture detection
    - JSON parser for JSON sent on the serial port
    - Custom parsers that can be added by the user, also written in JS, activated on custom trigger words.
    - Parser entries history similar to the packet history in MQTT Explorer by Thomas Nordquist(https://github.com/thomasnordquist)    
    - Parser entries with customized colors to help differientiate entries according to the parser similar to MQTT FX by SoftBlade
    <img src="/documentation/parser output entry history.png" alt="Alt text" title="Optional title">
- Optional connection status change display
- Optional disconnection on Boot message from ESP series microcontrollers