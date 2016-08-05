// Get the modal
var modal = document.getElementById('modal');

// Get the <span> element that closes the modal
var span = document.getElementById("boxclose");

// When the user clicks on the button, open the modal 
function show() {
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
    if (event.target == modal2) {
        modal2.style.display = "none";
    }
}

// Get the modal
var modal2 = document.getElementById('modal2');

// Get the <span> element that closes the modal
var span2 = document.getElementById("boxclose2");

// When the user clicks on the button, open the modal 
function show2() {
    modal2.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span2.onclick = function () {
    modal2.style.display = "none";
}