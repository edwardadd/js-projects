/*
  Copyright Edward Addley 2012
*/


function round(a) {
  return Math.floor(a + 0.5);
}

///////////////////////////////////////////////////////////
// Canvas
///////////////////////////////////////////////////////////

function Canvas(c) {

  this.ctx = null;
  this.canvas = c;
  this.backcanvas = null;
  
  this.width = this.canvas.width;
  this.height = this.canvas.height;

  var mainctx = this.canvas.getContext("2d");

  this.init = function () {
    this.backcanvas = document.createElement('canvas');
    this.backcanvas.width = this.canvas.width;
    this.backcanvas.height = this.canvas.height;

    this.ctx = this.backcanvas.getContext("2d");

    // Set fill style - use for clearing atm
    this.ctx.fillStyle = "#115599";
  };

  this.clear = function () {
    this.ctx.fillRect(0, 0, this.width, this.height);
  };

  this.draw = function () {
    // draw backcanvas to screen
    mainctx.drawImage(this.backcanvas, 0, 0);
  };
  
  this.resize = function () {
    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight - this.canvas.offsetTop;
    this.width = this.backcanvas.width = this.canvas.width;
    this.height = this.backcanvas.height = this.canvas.height;
    
    onChange();
  };
}

///////////////////////////////////////////////////////////
// Terrain Generation
///////////////////////////////////////////////////////////

function StartGen(data, width, height, roughness, seed) {
  Math.seedrandom(seed);
  
  // Set the corner positions - shared values to enable tiling
  var a, b, c, d, i, range = 50;
  a = data[0] = Math.random() * range * 2 - range;
  b = data[width - 1] = a;
  c = data[(width - 1) * width] = a;
  d = data[width * height - 1] = a;
  
  i = width;
  while (i > 1) {
    var roundi = Math.ceil(i) - 1;
    var halfi = Math.ceil(i * 0.5);

    // Diamond - but maybe I misunderstood the article as these seem more like squares
    for (var y = 0; y < height - 1; y += roundi) {
      for (var x = 0; x < width - 1; x += roundi) {
        var index = (round((i - 1) * 0.5) + x) + (y + round((i - 1) * 0.5)) * width;
        a = data[x +  y * width];
        b = data[roundi + x + y * width];
        c = data[x +  (y + roundi) * width];
        d = data[roundi + x + (y + roundi) * width];
        data[index] = round((a + b + c + d) * 0.25) + Math.random() * range * 2 - range;
      }
    }
    
    // Square - although they seem more like diamonds...
    // Due to the diamonds on the edges only being half diamonds it means we need to deal
    // with them wrapping instead or choosing an average number when at the edges.
    for (var y = 0; y < height - 1; y += roundi) {
      for (var x = 0; x < width - 1; x += roundi) {
      
        // top
        if (y == 0) {
          a = data[round((i - 1) * 0.5) + x +  (height - halfi) * width]; // top
        } else {
          a = data[round((i - 1) * 0.5) + x +  (y - round((i - 1) * 0.5)) * width]; // top
        }
        
        b = data[x +  y * width]; // left
        c = data[x + roundi +  y * width]; // right
        
        if (y == height - 1) {
          d = data[round((i - 1) * 0.5) + x + (0 + round((i - 1) * 0.5)) * width]; // bottom
        } else {
          d = data[round((i - 1) * 0.5) + x +  (y + round((i - 1) * 0.5)) * width]; // bottom
        }

        data[round((i - 1) * 0.5)  + x + y * width] = round((a + b + c + d) * 0.25) + Math.random() * range * 2 - range;
        if (y == 0) {
          data[round((i - 1) * 0.5) + x + (height-1) * width] = data[round((i - 1) * 0.5) + x + y * width];
        }
        
        // left
        a = data[x +  y * width]; // top
        
        if (x == 0) {
          b = data[width - 1 +  y * width]; // left
        } else {
          b = data[x - round((i - 1) * 0.5) +  y * width]; // left
        }
        
        if (x == width - 1) {
          c = data[0 +  y * width]; // right
        } else {
          c = data[round((i - 1) * 0.5) + x + (y + round((i - 1) * 0.5)) * width]; // right
        }

        d = data[x +  (y + roundi) * width]; // bottom

        data[x + (round((i - 1) * 0.5) + y) * width] = round((a + b + c + d) * 0.25) + Math.random() * range * 2 - range;
        if (x == 0) {
          data[(width-1) + (round((i - 1) * 0.5) + y) * width] = data[x + (round((i - 1) * 0.5) + y) * width];
        }
      }
    }
    
    i = i * 0.5;
    range = range * roughness;
  }
}

///////////////////////////////////////////////////////////
// World
///////////////////////////////////////////////////////////

function World() {
  var w = 10, h = 10, data = null, scale = 1, min = 0, seed = 0;

  this.init = function (newSeed, size, roughness) {
    var i = 0,
        max = -99999;

    // we need the min for later
    min = 99999;
    
    seed = newSeed;

    w = size; h = size;
    
    data = new Array(w * h);
    
    for (i = 0; i < (w * h); i++) {
      data[i] = 0;
    }
    
    StartGen(data, w, h, roughness, seed);
    
    // Find the scale between the lowest and highest points
    for (i = 0; i < (w * h); i++) {
      var t = data[i];
      if (t < min) {
        min = t;
      }
      if (t > max) {
        max = t;
      }
    }
    
    scale = max - min;    
  };

  this.draw = function (ctx) {

    var imgData = ctx.getImageData(0, 0, w, h);

    var x, y;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var z = ((data[x + w * y] - min) / scale ) * 255;
        var index = (x + y * w) * 4;

        imgData.data[3 + index] = 255; //a
        
        if (z >= 230) {
          imgData.data[index] = z; //r
          imgData.data[1 + index] = z; //g
          imgData.data[2 + index] = z; //b
        } else if (z >= 50) {
          imgData.data[index] = 0; //r
          imgData.data[1 + index] = z + 50; //g
          imgData.data[2 + index] = 0; //b
        } else if (z >= 0) {
          imgData.data[index] = 0; //r
          imgData.data[1 + index] = 0; //g
          imgData.data[2 + index] = z + 100; //b
        } else {
          imgData.data[index] = 255; //r
          imgData.data[1 + index] = 0; //g
          imgData.data[2 + index] = 0; //b
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };
}

///////////////////////////////////////////////////////////
// App
///////////////////////////////////////////////////////////

var theApp = null;

function App() {
  this.mainCanvas = null;
  this.world = null;
};

App.prototype.init = function () {
  var canvas = document.getElementById("maincanvas");
  var mainctx = canvas.getContext("2d");

  if (canvas !== "undefined") {
    canvas.width = innerWidth;
    canvas.height = innerHeight - canvas.offsetTop;
    this.mainCanvas = new Canvas(canvas);
    this.mainCanvas.init();

    this.world = new World();
    onChange();
  }
};

function onChange() {
  var sizetextbox = document.getElementById("sizetextbox");
  var seedtextbox = document.getElementById("seedtextbox");
  var scaletextbox = document.getElementById("scaletextbox");

  var roughreg = /^(\d+)\.(\d+)$/;
  
  if (scaletextbox.value.match(roughreg) != null) {
  
    // TODO validate input
    theApp.world.init(seedtextbox.value, parseInt(sizetextbox.value), parseFloat(scaletextbox.value));
    
    theApp.mainCanvas.clear();
    theApp.world.draw(theApp.mainCanvas.ctx);
    theApp.mainCanvas.draw();
  }
}

function onResize() {
  theApp.mainCanvas.resize();
}

///////////////////////////////////////////////////////////
// Main Entry
///////////////////////////////////////////////////////////

// Set initial on finish loading function
window.onload = function () {
  theApp = new App();
  theApp.init();
};

// Error handling
window.onerror = function (message, location, line) {
  alert(message + " : " + line);
};
