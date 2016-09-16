var textarea = document.getElementById('content');

var editor = ace.edit("editor");
editor.setTheme("ace/theme/tomorrow_night");
editor.getSession().setMode("ace/mode/html");
editor.getSession().setTabSize(4);
editor.getSession().setUseSoftTabs(true);
document.getElementById('editor').style.fontSize='14px';

editor.getSession().on('change', function () {
    textarea.value=editor.getSession().getValue();
});
textarea.value=editor.getSession().getValue();