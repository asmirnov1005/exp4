class Peephole {

  constructor(imgElem, displayElem, options) {
    this.speed = options.speed || 1;

    this._initImage(imgElem);
    this._initDisplay(displayElem, options.displaySize);
    this._initGlass(options.showGlass);
    this._initEvents(options.events || {});
    this._setupPositions();
  }

  log() {
    console.log('Natural Size', this._nW, this._nH);
    console.log('Image Size', this._cW, this._cH);
    console.log('Display Natural Size', this._dnW, this._dnH);
    console.log('Display Element Size', this._dcW, this._dcH);
    if (this._showGlass) {
      console.log('Glass Natural Size', this._gnW, this._gnH);
      console.log('Glass Element Size', this._gcW, this._gcH);
    }
  }

  _setupPositions() {
    this._touchClientPosition = null;
    this._touchNaturalPosition = null;
    this._naturalPosition = null;
  }

  _initImage(imgElem) {
    this._imgElem = imgElem;

    this._nW = this._imgElem.naturalWidth;
    this._nH = this._imgElem.naturalHeight;
    this._cW = this._imgElem.clientWidth;
    this._cH = this._imgElem.clientHeight;
    if (!this._cW || !this._cH)
      throw new Error("Image element size (width and height) should be specified!");
  }

  _initDisplay(displayElem, displaySize) {
    this._displayElem = displayElem;

    this._dcW = this._displayElem.clientWidth;
    this._dcH = this._displayElem.clientHeight;
    if (!this._dcW || !this._dcH)
      throw new Error("Display element size (width and height) should be specified!");
    if (!displaySize)
      throw new Error("`displaySize` is required option!");
    this._dnW = displaySize.width;
    this._dnH = displaySize.height;
    if (this._dnW % 2 !== 1 || this._dnH % 2 !== 1)
      throw new Error("Width and height of the display should be odd integers!");
    if (this._dcW % this._dnW !== 0 || this._dcH % this._dnH !== 0)
      throw new Error("Width and height of the display element should be divisible by its natural width and height.");
    if (!this._dnW || !this._dnH)
      throw new Error("Display size (dW and dH parameters) should be nonzero integers!");

    this._displayElem.style.backgroundRepeat = "no-repeat";
    this._displayElem.style.backgroundSize = this._nW * Math.round(this._dcW / this._dnW) + "px " + this._nH * Math.round(this._dcH / this._dnH) + "px";
  	this._displayElem.style.imageRendering = "-moz-crisp-edges";
    this._displayElem.style.imageRendering = "-webkit-crisp-edges";
    this._displayElem.style.imageRendering = "pixelated";
    this._displayElem.style.imageRendering = "crisp-edges";
  }

  _initGlass(showGlass) {
    this._showGlass = showGlass === false ? false : true;

    if (!this._showGlass) return;

    this._gnW = this._dnW;
    this._gnH = this._dnH;
    this._gcW = Math.round(this._gnW * this._cW / this._nW);
    this._gcH = Math.round(this._gnH * this._cH / this._nH);

    this._glassElem = document.createElement("div");
    this._glassElem.classList.add("peephole-glass");
    this._glassElem.style.display = "none";
    this._glassElem.style.position = "absolute";
    this._glassElem.style.width = this._gcW + "px";
    this._glassElem.style.height = this._gcH + "px";
    this._glassElem.style.border = "solid black 1px";

    this._imgElem.parentElement.insertBefore(this._glassElem, this._imgElem);
  }

  _initEvents(events) {
    this._onMousedown = events.onMousedown;
    this._onMouseup = events.onMouseup;

    this._imgElem.addEventListener('load', this._imgElemOnLoad.bind(this));
    this._imgElem.addEventListener("mousedown", this._imgElemOnMousedownEvent.bind(this));
    this._imgElem.addEventListener("touchstart", this._imgElemOnMousedownEvent.bind(this));
    if (this._showGlass) {
      this._glassElem.addEventListener("mousedown", this._imgElemOnMousedownEvent.bind(this));
      this._glassElem.addEventListener("touchstart", this._imgElemOnMousedownEvent.bind(this));
    }
    document.addEventListener("mousemove", this._onPeepholeMoveEvent.bind(this));
    document.addEventListener("touchmove", this._onPeepholeMoveEvent.bind(this));
    document.addEventListener("mouseup", this._documentOnMouseupEvent.bind(this));
    document.addEventListener("touchend", this._documentOnMouseupEvent.bind(this));
  }

  _imgElemOnMousedownEvent(event) {
    event.preventDefault();

    this._touchClientPosition = this._cursorPosition(event);
    this._touchNaturalPosition = {
      x : Math.round(this._touchClientPosition.x * this._nW / this._cW),
      y : Math.round(this._touchClientPosition.y * this._nH / this._cH),
    }
    if (this._onMousedown)
      setTimeout(function (x, y) {
        this._onMousedown(event, { x : x, y : y });
      }.bind(this, this._touchNaturalPosition.x, this._touchNaturalPosition.y));
    if (this._showGlass)
      this._glassElem.style.display = "block";
    this._displayElem.style.backgroundImage = "url('" + this._imgElem.src + "')";
    this._onPeepholeMoveEvent(event);
  }

  _onPeepholeMoveEvent(event) {
    event.preventDefault();

    if (!this._touchClientPosition) return;
    const clientOrigin = this._touchClientPosition;
    const clientCurrentTouch = this._cursorPosition(event);
    const clientDX = clientCurrentTouch.x - clientOrigin.x;
    const clientDY = clientCurrentTouch.y - clientOrigin.y;
    const naturalDX = Math.round(clientDX * this.speed);
    const naturalDY = Math.round(clientDY * this.speed);
    const naturalX = Math.max(0, Math.min(this._nW - 1, this._touchNaturalPosition.x + naturalDX));
    const naturalY = Math.max(0, Math.min(this._nH - 1, this._touchNaturalPosition.y + naturalDY));
    this._naturalPosition = { x : naturalX, y : naturalY };
    const clientPosition = {
      x : Math.round(this._naturalPosition.x * this._cW / this._nW) - 1,
      y : Math.round(this._naturalPosition.y * this._cH / this._nH) - 1,
    }
    if (this._showGlass)
      this._updateglassElemPosition(clientPosition);
    this._updateDisplay(this._naturalPosition);
  }

  _documentOnMouseupEvent(event) {
    event.preventDefault();

    if (!this._touchClientPosition) return;
    if (this._onMouseup)
      setTimeout(function (x, y) {
        this._onMouseup(event, { x : x, y : y });
      }.bind(this, this._naturalPosition.x, this._naturalPosition.y));
    this._setupPositions();
  }

  _cursorPosition(event) {
    if (event.type == "touchstart" || event.type == "touchmove" || event.type == "touchend") {
      event = event.originalEvent || event;
      const touches = event.touches || event.changedTouches;
      event = touches[0];
    }
    const rect = this._imgElem.getBoundingClientRect();
    const x = event.pageX - rect.left - window.pageXOffset;
    const y = event.pageY - rect.top - window.pageYOffset;
    return { x : x, y : y };
  }

  _imgElemOnLoad(event) {
    if (this._displayElem.style.backgroundImage != "")
      this._displayElem.style.backgroundImage = "url('" + this._imgElem.src + "')";
  }

  _updateglassElemPosition(position) {
    this._glassElem.style.left = (position.x + this._gcW / 2) + "px";
    this._glassElem.style.top = (position.y + this._gcH / 2) + "px";
  }

  _updateDisplay(position) {
    const dx = (position.x - Math.floor(this._dnW / 2)) * Math.round(this._dcW / this._dnW);
    const dy = (position.y - Math.floor(this._dnH / 2)) * Math.round(this._dcH / this._dnH);
    const sDX = dx > 0 ? "-" + dx + "px" : -dx + "px";
    const sDY = dy > 0 ? "-" + dy + "px" : -dy + "px";
    this._displayElem.style.backgroundPosition = sDX + " " + sDY;
  }

}
