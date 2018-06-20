var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*------------------------------*\
|* Fluid Image
\*------------------------------*/

// Mouse over to interact and repel. 
// Mouse down to attract.
// Drag and drop file for new image.

var RADIANS = Math.PI / 180;
var STRENGTH = 2;
var ELASTICITY = 0.0001;
var DAMPING = 0.996;
var MASS = 0.1;
var MAX_SIZE = 40;
var SIZE = 14;
var CIRCLE = 'circle';
var SQUARE = 'square';
var TYPE = SQUARE; // Render type
var DPR = 1; // window.devicePixelRatio || 1;
var DEMO_IMAGE = 'C:\Users\McG\Projects\fluidpic\static\grandmaster.jpg';

/*------------------------------*\
|* Main Canvas
\*------------------------------*/

var Canvas = function () {
    function Canvas() {
        _classCallCheck(this, Canvas);

        // setup a canvas
        this.canvas = document.getElementById('canvas');
        this.dpr = DPR;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(this.dpr, this.dpr);

        // method binds
        this.render = this.render.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        this.handleMouse = this.handleMouse.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleMousedown = this.handleMousedown.bind(this);
        this.handleMouseup = this.handleMouseup.bind(this);

        // state
        this.isDragging = false;
        this.hasLoaded = false;
        this.tick = 0;
        this.mouse = {
            x: window.innerWidth * this.dpr / 2,
            y: window.innerHeight * this.dpr / 2,
            mousedown: false
        };

        // setup
        this.setupListeners();
        this.addInitialImage();
        this.setCanvasSize();
        this.render();
    }

    _createClass(Canvas, [{
        key: 'setupListeners',
        value: function setupListeners() {
            window.addEventListener('resize', this.handleResize);
            this.canvas.addEventListener('drop', this.handleDrop, false);
            this.canvas.addEventListener('dragover', this.handleDragOver, false);
            this.canvas.addEventListener('dragleave', this.handleDragLeave, false);
            window.addEventListener('mousemove', this.handleMouse);
            window.addEventListener('mousedown', this.handleMousedown);
            window.addEventListener('mouseup', this.handleMouseup);
        }
    }, {
        key: 'handleResize',
        value: function handleResize() {
            this.setCanvasSize();
        }
    }, {
        key: 'handleMousedown',
        value: function handleMousedown(event) {
            this.mouse.mousedown = true;
        }
    }, {
        key: 'handleMouseup',
        value: function handleMouseup(event) {
            this.mouse.mousedown = false;
        }
    }, {
        key: 'handleDrop',
        value: function handleDrop(event) {
            event.preventDefault();

            var image = event.dataTransfer.getData('text/plain');
            this.isDragging = false;
            this.hasLoaded = false;

            var file = event.dataTransfer.files[0];

            this.handleImageFile(file);
        }
    }, {
        key: 'handleImageFile',
        value: function handleImageFile(file) {
            var _this = this;

            // check for image, if not return
            var imageType = /image.*/;
            if (!file.type.match(imageType)) return;

            // create image from file
            this.image = new FluidImage({
                file: file
            }, SIZE);

            this.image.hasLoaded().then(function () {
                console.log('successfully loaded!');
                _this.handleLoad();
            }).catch(function (e) {
                console.log('>:-| failed:', e);
            });
        }
    }, {
        key: 'handleLoad',
        value: function handleLoad() {
            this.hasLoaded = true;
            this.centerImageToWindow();

            if (!this.demo) {
                this.demoForce();
            }
        }
    }, {
        key: 'handleDragOver',
        value: function handleDragOver(event) {
            event.preventDefault();
            this.isDragging = true;
        }
    }, {
        key: 'handleDragLeave',
        value: function handleDragLeave(event) {
            event.preventDefault();
            this.isDragging = false;
        }
    }, {
        key: 'handleMouse',
        value: function handleMouse(event) {
            var x = event.clientX * this.dpr;
            var y = event.clientY * this.dpr;
            this.mouse.x = x;
            this.mouse.y = y;

            this.applyForce();
        }
    }, {
        key: 'addInitialImage',
        value: function addInitialImage() {
            var _this2 = this;

            // create image from file
            this.image = new FluidImage({
                src: DEMO_IMAGE
            }, SIZE);

            this.image.hasLoaded().then(function () {
                _this2.handleLoad();
            }).catch(function (e) {
                console.log('>:-| failed:', e);
            });
        }
    }, {
        key: 'centerImageToWindow',
        value: function centerImageToWindow() {
            var _image$canvas = this.image.canvas,
                w = _image$canvas.width,
                h = _image$canvas.height;
            var _canvas = this.canvas,
                cw = _canvas.width,
                ch = _canvas.height;

            var tx = cw / 2 - w / 2;
            var ty = ch / 2 - h / 2;

            // centers points on this main canvas
            this.image.points.map(function (p) {
                var x = p.x + tx;
                var y = p.y + ty;
                p.setOrigin(x, y);
                return p;
            });
        }
    }, {
        key: 'applyForce',
        value: function applyForce() {
            if (!this.hasLoaded) return; // wait for an image loaded

            var _mouse = this.mouse,
                mousedown = _mouse.mousedown,
                x = _mouse.x,
                y = _mouse.y;

            var points = this.image.points;
            var length = points.length;

            for (var i = 0; i < length; i++) {
                var fd = points[i];
                var dx = fd.cx - x;
                var dy = fd.cy - y;
                var angle = Math.atan2(dy, dx);
                var dist = STRENGTH / Math.sqrt(dx * dx + dy * dy);

                if (mousedown) {
                    dist *= -1;
                }

                var fx = Math.cos(angle) * dist;
                var fy = Math.sin(angle) * dist;
                fd.applyForce(fx, fy);
            }
        }
    }, {
        key: 'setCanvasSize',
        value: function setCanvasSize() {
            this.canvas.width = window.innerWidth * this.dpr;
            this.canvas.height = window.innerHeight * this.dpr;
            this.canvas.style.width = window.innerWidth + 'px';
            this.canvas.style.height = window.innerHeight + 'px';
        }
    }, {
        key: 'drawBg',
        value: function drawBg(color) {
            this.ctx.fillStyle = color || '#111111';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }, {
        key: 'drawText',
        value: function drawText() {
            var size = 60 * this.dpr;
            this.ctx.font = size + 'px  futura-pt, futura, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = 'white';

            var copy = this.isDragging ? 'Drop Image Now' : 'Drag Image Here';
            this.ctx.fillText(copy, this.canvas.width / 2, this.canvas.height / 2 + size / 2);
        }
    }, {
        key: 'drawMouse',
        value: function drawMouse() {
            var _mouse2 = this.mouse,
                mousedown = _mouse2.mousedown,
                x = _mouse2.x,
                y = _mouse2.y;

            this.ctx.lineWidth = 2 * this.dpr;
            this.ctx.strokeStyle = mousedown ? '#FFFFFF' : '#333333';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 16 * this.dpr, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }, {
        key: 'render',
        value: function render() {
            var _this3 = this;

            if (this.hasLoaded) {
                var bg = this.image.points[0].color;

                this.drawBg(bg);
                this.image.points.forEach(function (p) {
                    p.draw(_this3.ctx);
                    p.update();
                });
                this.ctx.restore();
            } else {
                this.drawBg();
            }

            this.drawMouse();

            if (this.tick < 300) {
                this.applyForce();
            }

            this.drawText();
            this.tick++;
            window.requestAnimationFrame(this.render);
        }
    }]);

    return Canvas;
}();

/*------------------------------*\
|* Fluid Image
\*------------------------------*/

var FluidImage = function () {
    function FluidImage() {
        var image = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
            src: false,
            file: false
        };
        var size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : SIZE;

        _classCallCheck(this, FluidImage);

        this.src = image.src;
        this.file = image.file;
        this.size = size;

        this.pw = 0; // numb of points width
        this.ph = 0; // numb of points height
        this.points = [];

        // binds
        this.onLoad = this.onLoad.bind(this);

        // create canvas and image el
        this.canvas = document.createElement('canvas');
        this.img = document.createElement('img');
        this.img.crossOrigin = 'Anonymous'; // prevent cors error
        this.img.onload = this.onLoad;

        this.ctx = this.canvas.getContext('2d');

        if (this.src) {
            this.img.src = this.src;
        } else if (this.file) {
            this.readFile();
        } else {
            throw new Error('Must provide an image as a url or file');
        }
    }

    _createClass(FluidImage, [{
        key: 'readFile',
        value: function readFile() {
            var _this4 = this;

            var reader = new FileReader();

            // reader load event handler
            var loadHandler = function loadHandler(aImg) {
                return function (e) {
                    // e.target.result is a dataURL for the image
                    aImg.src = e.target.result;

                    _this4.drawToCanvas();
                };
            };
            reader.onload = loadHandler(this.img);

            // read file
            reader.readAsDataURL(this.file);
        }
    }, {
        key: 'hasLoaded',
        value: function hasLoaded() {
            var _this5 = this;

            return new Promise(function (resolve, reject) {
                _this5.resolveLoaded = resolve;
            });
        }
    }, {
        key: 'onLoad',
        value: function onLoad(event) {
            // resolve promise if one has been requested
            if (this.resolveLoaded) {
                this.resolveLoaded();
            }
            this.setupCanvas();
            this.drawToCanvas();
            this.getPixels();
        }
    }, {
        key: 'getPixels',
        value: function getPixels() {
            var img = this.canvas;
            var size = this.size;
            var pixelData = this.ctx.getImageData(0, 0, img.width, img.height);
            var colors = pixelData.data;

            // gets color of each pixel based on size,
            // then creates a fluid pixel and adds to points

            for (var i = size; i <= img.height; i += size) {
                for (var j = size; j <= img.width; j += size) {
                    var pixelPosition = (j + i * pixelData.width) * 4;
                    var x = j;
                    var y = i;
                    var w = size;
                    var h = size;
                    var r = colors[pixelPosition];
                    var g = colors[pixelPosition + 1];
                    var b = colors[pixelPosition + 2];
                    var rgba = 'rgba(' + r + ', ' + g + ', ' + b + ', 1)';

                    var fluidPx = new FluidPixel(x, y, w, h, rgba);

                    this.points.push(fluidPx);
                }
            }
        }
    }, {
        key: 'setupCanvas',
        value: function setupCanvas() {
            var _img = this.img,
                w = _img.width,
                h = _img.height;

            var maxSide = Math.max(w, h);

            this.width = w;
            this.height = h;
            var max = MAX_SIZE * this.size;

            if (maxSide >= max) {
                var r = h / w;

                if (w >= max) {
                    this.width = max;
                    this.height = max * r;
                } else {
                    this.height = max;
                    this.width = max * r;
                }
            }

            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }
    }, {
        key: 'drawToCanvas',
        value: function drawToCanvas() {
            var width = this.width,
                height = this.height;

            this.ctx.drawImage(this.img, 0, 0, width, height);
        }
    }]);

    return FluidImage;
}();

/*------------------------------*\
|* Fluid Pixel
\*------------------------------*/

var FluidPixel = function () {
    function FluidPixel() {
        var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var w = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 50;
        var h = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 50;
        var color = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'red';

        _classCallCheck(this, FluidPixel);

        this.ox = x; // origin x
        this.oy = y; // origin y
        this.x = x;
        this.y = y;
        this.w = w; // width
        this.h = h; // height
        this.hw = w / 2; // half width
        this.hh = h / 2; // half height
        this.cx = x + this.hw; // center x
        this.cy = y + this.hh; // center y
        this.vx = 0; // velocity x
        this.vy = 0; // velocity y
        this.fx = 0; // force x
        this.fy = 0; // force y
        this.color = color;
        this.mass = MASS;
        this.elasticity = ELASTICITY;
        this.damping = DAMPING;
    }

    _createClass(FluidPixel, [{
        key: 'setOrigin',
        value: function setOrigin(x, y) {
            // updates a points position without affects
            this.ox = x; // origin x
            this.oy = y; // origin y
            this.x = x;
            this.y = y;
            this.cx = x + this.hw; // center x
            this.cy = y + this.hh; // center y
        }
    }, {
        key: 'update',
        value: function update() {
            // force to origin, difference multiplied by elasticity constant
            var ofx = (this.ox - this.x) * this.elasticity;
            var ofy = (this.oy - this.y) * this.elasticity;

            // sum forces
            var fx = this.fx + ofx;
            var fy = this.fy + ofy;

            // acceleration = force / mass;
            var ax = fx / this.mass;
            var ay = fy / this.mass;

            // velocity
            this.vx = this.damping * this.vx + ax;
            this.vy = this.damping * this.vy + ay;

            // add velocity to center and top/left
            this.x += this.vx;
            this.y += this.vy;
            this.cx += this.vx;
            this.cy += this.vy;

            // reset any applied forces
            this.fx = 0;
            this.fy = 0;
        }
    }, {
        key: 'applyForce',
        value: function applyForce(fx, fy) {
            this.fx = fx;
            this.fy = fy;
        }
    }, {
        key: 'draw',
        value: function draw(ctx) {
            var x = this.x,
                y = this.y,
                w = this.w,
                h = this.h,
                color = this.color;

            ctx.fillStyle = color;

            if (TYPE === CIRCLE) {
                var _x = x - w / 2;
                var _y = y - h / 2;
                ctx.beginPath();
                ctx.arc(_x, _y, w / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fill();
            } else if (TYPE === SQUARE) {
                ctx.fillRect(x, y, w, h);
            }
        }
    }]);

    return FluidPixel;
}();

var canvas = new Canvas();
