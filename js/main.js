const imgElem = document.getElementById("image");
const crosshairElem = document.getElementById("crosshair");

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
    crosshair : {
      clientSize : { width : 110, height : 110 },
      size : { width : 11, height : 11 },
      position : {
        static : false,
        shift : {
          direction : "top",
          size : 70,
        },
      },
    },
    events : { onMousedown : onMousedown, onMouseup : onMouseup },
    speed : 0.25,
    showGlass : false,
  };
  ph = new Peephole(imgElem, crosshairElem, phOptions);

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
