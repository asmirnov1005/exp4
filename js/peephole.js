class Peephole {

  /*
    options = {
      speed : <int>,
      showGlass : <bool>,
      crosshair : {
        clientSize : {
          width : <int>,
          height : <int>,
        },
        size : {
          width : <int>,
          height : <int>,
        },
        round : <bool>,
        position : {
          static : bool,
          shift : {
            direction : <string>,
            size : <int>,
          },
        },
      },
      events : {
        onMousedown : <function(event:<object>, position:{x:<int>, y:<int>})>,
        onMouseup : <function(event:<object>, position:{x:<int>, y:<int>})>
      },
    }
  */
  constructor(imgElem, crosshairElem, options) {
    this.speed = options.speed || 1;

    this._initImage(imgElem);
    this._initCrosshair(crosshairElem, options);
    this._initGlass(options);
    this._initEvents(options.events || {});
    this._setupPositions();
  }

  log() {
    console.log('Speed: ', this.speed);
    console.log('Image element:', this._imgElem);
    console.log('Image natural size: ' + this._nW + 'x' + this._nH);
    console.log('Image client size: ' + this._cW + 'x' + this._cH);
    console.log('Crosshair element:', this._crosshairElem);
    console.log('Crosshair natural size: ' + this._dnW + 'x' + this._dnH);
    console.log('Crosshair client size: ' + this._ccW + 'x' + this._ccH);
    console.log('Crosshair is round: ' + this._crosshairIsRound);
    console.log('Crosshair is static: ' + this._crosshairIsStatic);
    if (!this._crosshairIsStatic) {
      console.log('Crosshair shift order: ' + this._crosshairShiftOrder);
      console.log('Crosshair shift size: ' + this._crosshairShiftSize);
    }
    if (this._showGlass) {
      console.log('Glass element:', this._glassElem);
      console.log('Glass natural size: ' + this._gnW + 'x' + this._gnH);
      console.log('Glass client size: ' + this._gcW + 'x' + this._gcH);
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

  _initCrosshair(crosshairElem, options) {
    this._crosshairElem = crosshairElem;
    this._crosshairIsRound = options.crosshair && options.crosshair.round === true;
    this._crosshairIsStatic = !(options.crosshair && options.crosshair.position &&
                                options.crosshair.position.static === false);

    this._ccW = this._crosshairElem.clientWidth;
    this._ccH = this._crosshairElem.clientHeight;
    if (!this._crosshairIsStatic) {
      this._crosshairElem.style.display = "none";
      this._crosshairElem.style.position = "absolute";
      this._ccW = options.crosshair.clientSize.width;
      this._ccH = options.crosshair.clientSize.height;
      this._crosshairElem.style.width = this._ccW + "px";
      this._crosshairElem.style.height = this._ccH + "px";
    }
    if (!this._ccW || !this._ccH)
      throw new Error("Crosshair element size (width and height) should be specified!");

    const CROSSHAIR_SHIFT_ORDER = ["top", "bottom", "left", "right"];
    const CROSSHAIR_SHIFT_SIZE = Math.round(Math.max(this._ccW, this._ccH) / 2);
    this._crosshairShiftOrder = CROSSHAIR_SHIFT_ORDER;
    this._crosshairShiftSize = CROSSHAIR_SHIFT_SIZE;
    if (!this._crosshairIsStatic && options.crosshair && options.crosshair.position &&
        options.crosshair.position.shift) {
      this._crosshairShiftOrder = this._getCrosshairShiftOrder(
        options.crosshair.position.shift.direction
      ) || CROSSHAIR_SHIFT_ORDER;
      this._crosshairShiftSize = options.crosshair.position.shift.size ||
                                 CROSSHAIR_SHIFT_SIZE;
    }
    if (this._crosshairIsRound)
      this._crosshairElem.style.borderRadius = Math.round(Math.min(this._ccW, this._ccH) / 2) + "px";

    if (!options.crosshair || !options.crosshair.size)
      throw new Error("`crosshair.size` is required option!");
    this._dnW = options.crosshair.size.width;
    this._dnH = options.crosshair.size.height;
    if (this._dnW % 2 !== 1 || this._dnH % 2 !== 1)
      throw new Error("Width and height of the crosshair should be odd integers!");
    if (this._ccW % this._dnW !== 0 || this._ccH % this._dnH !== 0)
      throw new Error("Width and height of the crosshair element should be divisible by its natural width and height.");
    if (!this._dnW || !this._dnH)
      throw new Error("Crosshair size (dW and dH parameters) should be nonzero integers!");

    this._crosshairElem.style.backgroundRepeat = "no-repeat";
    this._crosshairElem.style.backgroundSize = this._nW * Math.round(this._ccW / this._dnW) + "px " + this._nH * Math.round(this._ccH / this._dnH) + "px";
  	this._crosshairElem.style.imageRendering = "-moz-crisp-edges";
    this._crosshairElem.style.imageRendering = "-webkit-crisp-edges";
    this._crosshairElem.style.imageRendering = "pixelated";
    this._crosshairElem.style.imageRendering = "crisp-edges";
  }

  _initGlass(options) {
    this._showGlass = options.showGlass === false ? false : true;

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
    if (this._crosshairIsRound)
      this._glassElem.style.borderRadius = Math.round(Math.min(this._gcW, this._gcH) / 2) + "px";

    this._imgElem.parentElement.insertBefore(this._glassElem, this._imgElem);
  }

  _initEvents(events) {
    this._onMousedown = events.onMousedown;
    this._onMouseup = events.onMouseup;

    this._imgElem.addEventListener('load', this._imgElemOnLoad.bind(this));
    this._imgElem.addEventListener("mousedown", this._imgElemOnMousedownEvent.bind(this));
    this._imgElem.addEventListener("touchstart", this._imgElemOnMousedownEvent.bind(this));
    if (!this._crosshairIsStatic) {
      this._crosshairElem.addEventListener("mousedown", this._imgElemOnMousedownEvent.bind(this));
      this._crosshairElem.addEventListener("touchstart", this._imgElemOnMousedownEvent.bind(this));
    }
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
    if (!this._crosshairIsStatic)
      this._crosshairElem.style.display = "block";
    if (this._showGlass)
      this._glassElem.style.display = "block";
    this._crosshairElem.style.backgroundImage = "url('" + this._imgElem.src + "')";
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
    if (!this._crosshairIsStatic)
      this._updateCrosshairElemPosition({ x : event.pageX, y : event.pageY });
    if (this._showGlass)
      this._updateGlassElemPosition(clientPosition);
    this._updateCrosshair(this._naturalPosition);
  }

  _getCrosshairShiftOrder(direction) {
    if (direction == "top")
      return ["top", "bottom", "left", "right"];
    if (direction == "bottom")
      return ["bottom", "top", "left", "right"];
    if (direction == "left")
      return ["left", "right", "top", "bottom"];
    if (direction == "right")
      return ["right", "left", "top", "bottom"];
    throw new Error("Wrong crosshair shift direction value.");
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
    if (this._crosshairElem.style.backgroundImage != "")
      this._crosshairElem.style.backgroundImage = "url('" + this._imgElem.src + "')";
  }

  _updateCrosshairElemPosition(position) {
    const preRect = this._imgElem.getBoundingClientRect();
    const rect = {
      top : window.pageYOffset + preRect.top,
      bottom : window.pageYOffset + preRect.bottom,
      left : window.pageXOffset + preRect.left,
      right : window.pageXOffset + preRect.right,
    };
    const boundedX = Math.max(rect.left, Math.min(rect.right, position.x));
    const boundedY = Math.max(rect.top, Math.min(rect.bottom, position.y));
    for (const direction of this._crosshairShiftOrder) {
      const elemCenterX = boundedX + (direction == "left" ? -this._crosshairShiftSize : (direction == "right" ? this._crosshairShiftSize : 0));
      const elemCenterY = boundedY + (direction == "top" ? -this._crosshairShiftSize : (direction == "bottom" ? this._crosshairShiftSize : 0));
      if (elemCenterX - this._ccW / 2 < rect.left || elemCenterX + this._ccW / 2 > rect.right) continue;
      if (elemCenterY - this._ccH / 2 < rect.top || elemCenterY + this._ccH / 2 > rect.bottom) continue;
      this._crosshairElem.style.left = (elemCenterX - this._ccW / 2) + "px";
      this._crosshairElem.style.top = (elemCenterY - this._ccH / 2) + "px";
      return;
    }
    if (boundedX <= rect.left + this._crosshairShiftSize + this._ccW / 2 &&
        boundedY <= rect.top + this._crosshairShiftSize + this._ccH / 2) {
      this._crosshairElem.style.left = rect.left + "px";
      this._crosshairElem.style.top = rect.top + "px";
      return;
    }
    if (boundedX >= rect.right - this._crosshairShiftSize - this._ccW / 2 &&
        boundedY <= rect.top + this._crosshairShiftSize + this._ccH / 2) {
      this._crosshairElem.style.left = (rect.right - this._ccW) + "px";
      this._crosshairElem.style.top = rect.top + "px";
      return;
    }
    if (boundedX <= rect.left + this._crosshairShiftSize + this._ccW / 2 &&
        boundedY >= rect.bottom - this._crosshairShiftSize - this._ccH / 2) {
      this._crosshairElem.style.left = rect.left + "px";
      this._crosshairElem.style.top = (rect.bottom - this._ccH) + "px";
      return;
    }
    if (boundedX >= rect.right - this._crosshairShiftSize - this._ccW / 2 &&
        boundedY >= rect.bottom - this._crosshairShiftSize - this._ccH / 2) {
      this._crosshairElem.style.left = (rect.right - this._ccW) + "px";
      this._crosshairElem.style.top = (rect.bottom - this._ccH) + "px";
      return;
    }
  }

  _updateGlassElemPosition(position) {
    this._glassElem.style.left = (position.x + this._gcW / 2) + "px";
    this._glassElem.style.top = (position.y + this._gcH / 2) + "px";
  }

  _updateCrosshair(position) {
    const dx = (position.x - Math.floor(this._dnW / 2)) * Math.round(this._ccW / this._dnW);
    const dy = (position.y - Math.floor(this._dnH / 2)) * Math.round(this._ccH / this._dnH);
    const sDX = dx > 0 ? "-" + dx + "px" : -dx + "px";
    const sDY = dy > 0 ? "-" + dy + "px" : -dy + "px";
    this._crosshairElem.style.backgroundPosition = sDX + " " + sDY;
  }

}
