const imgElem = document.getElementById("image");
const displayElem = document.getElementById("display");

let ph = null;

if (imgElem.complete) {
  imgElemLoaded();
} else {
  imgElem.addEventListener('load', imgElemLoaded);
  imgElem.addEventListener('error', function() {
    console.log("Something went wrong...");
  });
}

function imgElemLoaded() {
  if (ph) return;

  let phOptions = {
    displaySize : { width : 21, height : 21 },
    events : { onMousedown : onMousedown, onMouseup : onMouseup },
    speed : 0.25,
    showGlass : false,
  };
  ph = new Peephole(imgElem, displayElem, phOptions);

  ph.log();
}

function selectOnChange(event) {
  imgElem.src = document.getElementById("img-select").value;
}

function onMousedown(event, position) {
  imgElem.style.opacity = 0.5;
}

function onMouseup(event, position) {
  imgElem.style.opacity = 1;
  document.getElementById("info").textContent =
    "Selected pixel: (" + position.x + ", " + position.y + ")";
}
