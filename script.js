const input_text = document.getElementById("input");
const history = document.getElementById("history");
document.getElementById("terminal").addEventListener('click', function () {
    input_text.focus();
});

input_text.addEventListener('keydown', function search(e) {
    if (e.keyCode == 13) {
        // append your output to the history,
        // here I just append the input
        history.innerHTML += input_text.value + '<br>';
        console.log(history.innerHTML);
        // you can change the path if you want
        // crappy implementation here, but you get the idea
        if (input_text.value.substring(0, 3) === 'cd ') {
            document.getElementById('path').innerHTML = input_text.value.substring(3) + '&nbsp;>&nbsp;';
        }

        // clear the input
        input_text.value = "";

    }
});


function cleanTerminal() {
    history.innerHTML = "";
    console.log("apagou");
}