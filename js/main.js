const imgElem = document.getElementById("image");
if (imgElem.complete) {
  imgElemLoaded();
} else {
  imgElem.addEventListener('load', imgElemLoaded);
  imgElem.addEventListener('error', function() {
    console.log("Something went wrong...");
  });
}

function imgElemLoaded() {
  const displayElem = document.getElementById("display");
  let displaySize = { w : 21, h : 21 };
  let events = {
    onMouseup : function (event, position) {
      document.getElementById("info").textContent =
        "Selected pixel: (" + position.x + ", " + position.y + ")";
    }
  };
  const ph = new Peephole(imgElem, displayElem, displaySize = displaySize, events = events);

  ph.log();
}
