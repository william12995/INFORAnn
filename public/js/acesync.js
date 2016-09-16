var textarea = document.getElementById('content');
var mode = document.getElementById('istextcontent');

var editor = ace.edit("editor");
editor.setTheme("ace/theme/tomorrow_night");
modeswitch();
editor.getSession().setTabSize(4);
editor.getSession().setUseSoftTabs(true);
editor.getSession().setUseWorker(false);

editor.getSession().on('change', function () {
    textarea.value=editor.getSession().getValue();
});
textarea.value=editor.getSession().getValue();

mode.onclick = modeswitch;

function modeswitch() {
	if(mode.checked){
		editor.getSession().setMode("ace/mode/html");
	} else {
		editor.getSession().setMode("");
	}
}