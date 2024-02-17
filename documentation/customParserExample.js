function parserFunction(data_line, data_line_index) {
    var customResult = document.createElement("pre");//obligatory to work properly, but does not need to be of type pre, can be any type
    customResult.setAttribute("id", "p" + data_line_index);//obligatory to work properly
    customResult.innerHTML = current_language["results_from_line"] + data_line_index;//just a random example of what can be done with the custom Parser
    /*
    Inside here you can do anything with the data, be it create a custom way to show the data
    or output data, whatever is put into the customResult object will get saved in the output results array
    and it must be of node type, an element created by the document.createElement method.
    This format gives a lot of flexibility
    */
    return customResult; //obligatory
}