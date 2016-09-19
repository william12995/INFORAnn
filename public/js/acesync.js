//var textarea = document.getElementById('content');
var mode = document.getElementById('istextcontent');

var editor = ace.edit("editor");
editor.setTheme("ace/theme/tomorrow_night");
modeswitch();
editor.getSession().setTabSize(4);
editor.getSession().setUseSoftTabs(true);
editor.getSession().setUseWorker(false);
mode.onclick = modeswitch;

function modeswitch() {
	if(mode.checked){
		editor.getSession().setMode("ace/mode/html");
	} else {
		editor.getSession().setMode("");
	}
}
function send() {
    var form = document.getElementById('editform');
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "content");
    hiddenField.setAttribute("value", editor.getSession().getValue());
    form.appendChild(hiddenField);
    form.submit();
}
