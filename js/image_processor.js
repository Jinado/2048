// Bogus definition of Webcam so that my IDE doesn't scream at me for using undefined variables
Webcam = Webcam || {
  set: options => options,
  attach: selector => selector,
  snap: callback => callback,
  freeze: () => null,
  unfreeze: () => null,
  reset: () => null,
  on: (event, callback) => callback(event),
  off: (event, callback) => callback(event),
  upload: (image, url, callback) => callback(image, url)
};

function ImageProcessor(selector, options) {
    this.selector = selector;
    this.options = options;
    this.element = document.querySelector(selector);

    Webcam.set(options);
    Webcam.attach(selector);
}

ImageProcessor.prototype.captureImage = function (callback, canvas) {
    Webcam.snap(callback, canvas);
};

ImageProcessor.prototype.addWebcamEventListener = function (event, callback) {
    Webcam.on(event, callback);
};

ImageProcessor.prototype.removeWebcamEventListener = function (event, callback) {
    Webcam.off(event, callback);
};

ImageProcessor.prototype.resetConnection = function (newSelector, options) {
    if(typeof newSelector === "undefined") {
        newSelector = this.selector;
    }

    if(typeof options === "undefined") {
        this.options = null;

        if(typeof newSelector === "object") {
            this.options = newSelector;
        }
    }

    Webcam.reset();

    if(this.options) {
        Webcam.set(this.options);
    }

    Webcam.attach(newSelector);
    this.selector = newSelector;
    this.element = document.querySelector(newSelector);
};