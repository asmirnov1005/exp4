class Peephole {

  speed = 0.25; // TODO: parameter

  touchClientPosition = null;
  touchNaturalPosition = null;
  naturalPosition = null;

  constructor(imgElem, displayElem, displaySize, events = {}) {
    this.imgElem = imgElem;
    this.nW = this.imgElem.naturalWidth;
    this.nH = this.imgElem.naturalHeight;
    this.cW = this.imgElem.clientWidth;
    this.cH = this.imgElem.clientHeight;
    if (!this.cW || !this.cH)
      throw new Error("Image element size (width and height) should be specified!");

    this.displayElem = displayElem;
    this.dcW = this.displayElem.clientWidth;
    this.dcH = this.displayElem.clientHeight;
    if (!this.dcW || !this.dcH)
      throw new Error("Display element size (width and height) should be specified!");
    this.dnW = displaySize.w;
    this.dnH = displaySize.h;
    // TODO: displaySize.w, displaySize.h should be === 1 mod 2
    // TODO: this.dcW / this.dnW should be integer
    if (!this.dnW || !this.dnH)
      throw new Error("Display size (dW and dH parameters) should be nonzero integers!");
    this.displayElem.style.backgroundRepeat = "no-repeat";
    this.displayElem.style.backgroundSize = this.nW * Math.round(this.dcW / this.dnW) + "px " + this.nH * Math.round(this.dcH / this.dnH) + "px";
  	this.displayElem.style.imageRendering = "crisp-edges";

    this.mnW = this.dnW;
    this.mnH = this.dnH;
    this.mcW = Math.round(this.mnW * this.cW / this.nW);
    this.mcH = Math.round(this.mnH * this.cH / this.nH);
    this.magnifierElem = document.createElement("div");
    this.magnifierElem.classList.add("peephole-magnifier");
    this.magnifierElem.style.display = "none";
    this.magnifierElem.style.position = "absolute";
    this.magnifierElem.style.width = this.mcW + "px";
    this.magnifierElem.style.height = this.mcH + "px";
    this.magnifierElem.style.border = "solid black 1px";
    this.imgElem.parentElement.insertBefore(this.magnifierElem, this.imgElem);

    this._initEvents(events);
  }

  // TODO: Remove it later
  log() {
    console.log('Natural Size', this.nW, this.nH);
    console.log('Image Size', this.cW, this.cH);
    console.log('Display Natural Size', this.dnW, this.dnH);
    console.log('Display Element Size', this.dcW, this.dcH);
    console.log('Magnifier Natural Size', this.mnW, this.mnH);
    console.log('Magnifier Element Size', this.mcW, this.mcH);
  }

  _initEvents(events) {
    this.onMouseup = events.onMouseup ? events.onMouseup : function () {};
    this.imgElem.addEventListener("mousedown", this._imgElemOnMousedownEvent.bind(this));
    this.magnifierElem.addEventListener("mousedown", this._imgElemOnMousedownEvent.bind(this));
    document.addEventListener("mousemove", this._onMagnifierMoveEvent.bind(this));
    document.addEventListener("mouseup", this._documentOnMouseupEvent.bind(this));
  }

  _imgElemOnMousedownEvent(event) {
    event.preventDefault();

    this.touchClientPosition = this._cursorPosition(event);
    this.touchNaturalPosition = {
      x : Math.round(this.touchClientPosition.x * this.nW / this.cW),
      y : Math.round(this.touchClientPosition.y * this.nH / this.cH),
    }
    this.magnifierElem.style.display = "block";
    this.displayElem.style.backgroundImage = "url('" + this.imgElem.src + "')";
    this._onMagnifierMoveEvent(event);
  }

  _onMagnifierMoveEvent(event) {
    event.preventDefault();

    if (!this.touchClientPosition) return;
    const clientOrigin = this.touchClientPosition;
    const clientCurrentTouch = this._cursorPosition(event);
    const clientDX = clientCurrentTouch.x - clientOrigin.x;
    const clientDY = clientCurrentTouch.y - clientOrigin.y;
    const naturalDX = Math.round(clientDX * this.speed);
    const naturalDY = Math.round(clientDY * this.speed);
    const naturalX = Math.max(0, Math.min(this.nW - 1, this.touchNaturalPosition.x + naturalDX));
    const naturalY = Math.max(0, Math.min(this.nH - 1, this.touchNaturalPosition.y + naturalDY));
    this.naturalPosition = { x : naturalX, y : naturalY };
    const clientPosition = {
      x : Math.round(this.naturalPosition.x * this.cW / this.nW) - 1,
      y : Math.round(this.naturalPosition.y * this.cH / this.nH) - 1,
    }
    this._updateMagnifierPosition(clientPosition);

    this._updateDisplay(this.naturalPosition);
  }

  _documentOnMouseupEvent(event) {
    event.preventDefault();

    if (!this.touchClientPosition) return;
    this.onMouseup(event, this.naturalPosition);
    this.touchClientPosition = null;
    this.touchNaturalPosition = null;
    this.naturalPosition = null;
  }

  _cursorPosition(event) {
    var a, x = 0, y = 0;
    event = event || window.event;
    a = this.imgElem.getBoundingClientRect();
    x = event.pageX - a.left;
    y = event.pageY - a.top;
    x = x - window.pageXOffset;
    y = y - window.pageYOffset;
    return { x : x, y : y };
  }

  _updateMagnifierPosition(position) {
    this.magnifierElem.style.left = (position.x + this.mcW / 2) + "px";
    this.magnifierElem.style.top = (position.y + this.mcH / 2) + "px";
  }

  _updateDisplay(position) {
    const dx = (position.x - Math.floor(this.dnW / 2)) * Math.round(this.dcW / this.dnW);
    const dy = (position.y - Math.floor(this.dnH / 2)) * Math.round(this.dcH / this.dnH);
    const sDX = dx > 0 ? "-" + dx + "px" : -dx + "px";
    const sDY = dy > 0 ? "-" + dy + "px" : -dy + "px";
    this.displayElem.style.backgroundPosition = sDX + " " + sDY;
  }

}
