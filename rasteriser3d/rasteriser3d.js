
var Round = function(v) {
  return Math.floor( v + 0.5);
};

function Point(_x, _y, _z) {
  this.x = _x;
  this.y = _y;
  this.z = _z;
	this.w = 1;
}

Point.prototype.Sub = function (a, b) {
  return new Point(a.x - b.x, a.y - b.y, a.z - b.z);
};

Point.prototype.Length = function () {
  return Math.sqrt((this.x * this.x + this.y * this.y + this.z * this.z));
};

Point.prototype.Normalise = function () {
  var len = this.Length();
  this.x = this.x / len;
  this.y = this.y / len;
  this.z = this.z / len;
};

Point.prototype.Cross = function (b, c) {
  return new Point(
    b.y * c.z - b.z * c.y,
    b.z * c.x - b.x * c.z,
    b.x * c.y - b.y * c.x
    );
};

function Vertex(_x, _y, _z, _u, _v) {
  this.p = new Point(_x, _y, _z);
  this.u = _u;
  this.v = _v;
}

function Triangle( _a, _b, _c) {
  this.a = _a;
  this.b = _b;
  this.c = _c;
  this.colour = { r: 255, g: 0, b: 0, a: 255};
}

Triangle.prototype.Draw = function( _canvasContext, wvp ) {

  //console.time("ApplyingWVPMatrix");
  var oa = wvp.Apply(this.a.p);
  var ob = wvp.Apply(this.b.p);
  var oc = wvp.Apply(this.c.p);
  //console.timeEnd("ApplyingWVPMatrix");

  // oa = document.edGame.Convert2D(oa);
  // ob = document.edGame.Convert2D(ob);
  // oc = document.edGame.Convert2D(oc);

	var maxY = oa.y;
	var minY = oa.y;

	if( maxY < ob.y ) maxY = ob.y;
	if( maxY < oc.y ) maxY = oc.y;
	if( minY > ob.y ) minY = ob.y;
	if( minY > oc.y ) minY = oc.y;


	var maxX = oa.x;
	var minX = oa.x;

	if( maxX < ob.x ) maxX = ob.x;
	if( maxX < oc.x ) maxX = oc.x;
	if( minX > ob.x ) minX = ob.x;
	if( minX > oc.x ) minX = oc.x;

  //console.time("PixelsInTriangle");
  if(maxX - minX > 0 && maxY - minY > 0) {
		var image = _canvasContext.getImageData(minX, minY, maxX - minX, maxY - minY);
		for( var y = minY; y < maxY; y++)
		{
      for( var x = minX; x < maxX; x++)
      {
        // check that pixel is within triangle
        // edge equation = Bx . Cy
        var inside = true;

        // edge a
        var B = ob.y - oa.y;
        var C = oa.x - ob.x;
        var Point = { _x: x - ob.x, _y: y - ob.y };

        if( B * Point._x + C * Point._y < 0)
          inside = false;

        // edge b
        B = oc.y - ob.y;
        C = ob.x - oc.x;
        Point = { _x: x - oc.x, _y: y - oc.y };

        if( B * Point._x + C * Point._y < 0)
          inside = false;

        // edge c
        B = oa.y - oc.y;
        C = oc.x - oa.x;
        Point = { _x: x - oa.x, _y: y - oa.y };

        if( B * Point._x + C * Point._y < 0)
          inside = false;


        if(inside) {
          image.data[4 * (x - minX) + 0 + (y - minY) * (maxX - minX) * 4] = this.colour.r;
          image.data[4 * (x - minX) + 1 + (y - minY) * (maxX - minX) * 4] = this.colour.g;
          image.data[4 * (x - minX) + 2 + (y - minY) * (maxX - minX) * 4] = this.colour.b;
          image.data[4 * (x - minX) + 3 + (y - minY) * (maxX - minX) * 4] = this.colour.a;
        }
      }
		}
    //console.timeEnd("PixelsInTriangle");
		_canvasContext.putImageData(image, minX, minY);
  }
};

function Matrix4x4() {
  this.value = new Array(16);
}

Matrix4x4.prototype.Identity = function() {
  this.value[0] = 1;
  this.value[1] = 0;
  this.value[2] = 0;
  this.value[3] = 0;

  this.value[4] = 0;
  this.value[5] = 1;
  this.value[6] = 0;
  this.value[7] = 0;

  this.value[8] = 0;
  this.value[9] = 0;
  this.value[10] = 1;
  this.value[11] = 0;

  this.value[12] = 0;
  this.value[13] = 0;
  this.value[14] = 0;
  this.value[15] = 1;
};

Matrix4x4.prototype.RotateX = function( angle ) {
  var m = new Matrix4x4();
	m.Identity();
  m.value[5] = Math.cos(angle);
  m.value[6] = -Math.sin(angle);
  m.value[9] = Math.sin(angle);
  m.value[10] = Math.cos(angle);

  return m;
};

Matrix4x4.prototype.RotateY = function( angle ) {
  var m = new Matrix4x4();
  m.Identity();
  m.value[0] = Math.cos(angle);
  m.value[2] = Math.sin(angle);
  m.value[8] = -Math.sin(angle);
  m.value[10] = Math.cos(angle);

  return m;
};

Matrix4x4.prototype.RotateZ = function( angle ) {
  var m = new Matrix4x4();
  m.Identity();
  m.value[0] = Math.cos(angle);
  m.value[1] = -Math.sin(angle);
  m.value[4] = Math.sin(angle);
  m.value[5] = Math.cos(angle);

  return m;
};

Matrix4x4.prototype.Translate = function ( x, y, z )
{
  var m = new Matrix4x4();
	m.Identity();
  m.value[3] = x;
  m.value[7] = y;
  m.value[11] = z;
	return m;
};

Matrix4x4.prototype.Multiply = function( m1, m2 )
{
  var result = new Matrix4x4();
  for( var y = 0; y < 4; y++ )
  {
    for( var x = 0; x < 4; x++ )
    {
      result.value[x + y * 4] = m1.value[0 + y * 4] * m2.value[x + 0 * 4] +
                                m1.value[1 + y * 4] * m2.value[x + 1 * 4] +
                                m1.value[2 + y * 4] * m2.value[x + 2 * 4] +
                                m1.value[3 + y * 4] * m2.value[x + 3 * 4];
    }
  }
  return result;
};

Matrix4x4.prototype.Apply = function( point )
{
  var p = new Point(0, 0, 0);
  p.x = this.value[0] * point.x +
        this.value[1] * point.y +
        this.value[2] * point.z +
        this.value[3] * point.w;

  p.y = this.value[4] * point.x +
        this.value[5] * point.y +
        this.value[6] * point.z +
        this.value[7] * point.w;

  p.z = this.value[8] * point.x +
        this.value[9] * point.y +
        this.value[10] * point.z +
        this.value[11] * point.w;

  p.w = this.value[12] * point.x +
        this.value[13] * point.y +
        this.value[14] * point.z +
        this.value[15] * point.w;

  if(p.w !== 1.0 && p.w != 0) {
    p.x = p.x / p.w;
    p.y = p.y / p.w;
    p.z = p.z / p.w;
    p.w = p.w / p.w;
  }
  return p;
};

Matrix4x4.prototype.Log = function () {

  console.log("Matrix:");
  for(i = 0; i < 4; i++) {
    console.log("." + this.value[0 + i * 4] + ", " + this.value[1 + i * 4] + ", " + this.value[2 + i * 4] + ", " + this.value[3 + i * 4]);
  }
};

function Game() {

  this.DrawInterval = 1;
  this.GameLoop = null;

  var _canvas;
  var _canvasContext;

  this.polygons = [];
  this.angle = 0;
  this.wvp = new Matrix4x4();
  this.projMatrix = new Matrix4x4();
  this.viewMatrix = new Matrix4x4();

  this.Initialize = function () {
    // initialize all game variables

    _canvas = document.getElementById('gameCanvas');
    this.wvp.Identity();

    this.CreateViewMatrix();
    this.CreateProjectionMatrix();


    //cube
    var scale = 25;

    // back
    this.polygons.push( new Triangle( new Vertex(-scale,scale,-scale, 0, 1), new Vertex( scale, scale, -scale, 1, 1 ), new Vertex( scale, -scale, -scale, 1, 0 )));
    this.polygons.push( new Triangle( new Vertex(-scale,scale,-scale, 0, 1), new Vertex( scale, -scale,-scale, 1, 0), new Vertex( -scale, -scale, -scale, 0, 0 )));

    // front
    this.polygons.push( new Triangle( new Vertex(scale,scale,scale, 0, 1), new Vertex( -scale, -scale, scale, 1, 1 ), new Vertex( scale, -scale, scale, 1, 0 )));
    this.polygons.push( new Triangle( new Vertex(scale,scale,scale, 0, 1), new Vertex( -scale, scale, scale, 1, 0), new Vertex( -scale, -scale, scale, 0, 0 )));

    // bottom
    this.polygons.push( new Triangle( new Vertex(-scale, -scale,-scale, 0, 1), new Vertex( scale, -scale, -scale, 1, 1 ), new Vertex( scale, -scale, scale, 1, 0 )));
    this.polygons.push( new Triangle( new Vertex(-scale, -scale,-scale, 0, 1), new Vertex( scale, -scale, scale, 1, 0), new Vertex( -scale, -scale, scale, 0, 0 )));

    // top
    this.polygons.push( new Triangle( new Vertex(-scale, scale,-scale, 0, 1), new Vertex( scale, scale, scale, 1, 1 ), new Vertex( scale, scale, -scale, 1, 0 )));
    this.polygons.push( new Triangle( new Vertex(-scale, scale,-scale, 0, 1), new Vertex( -scale, scale, scale, 1, 0), new Vertex( scale, scale, scale, 0, 0 )));

    // left side
    this.polygons.push( new Triangle( new Vertex(-scale, -scale,-scale, 0, 1), new Vertex( -scale, scale, scale, 1, 1 ), new Vertex( -scale, scale, -scale, 1, 0 )));
    this.polygons.push( new Triangle( new Vertex(-scale, -scale,-scale, 0, 1), new Vertex( -scale, -scale, scale, 1, 0), new Vertex( -scale, scale, scale, 0, 0 )));

    // right side
    this.polygons.push( new Triangle( new Vertex(scale, -scale,-scale, 0, 1), new Vertex( scale, scale, -scale, 1, 1 ), new Vertex( scale, scale, scale, 1, 0 )));
    this.polygons.push( new Triangle( new Vertex(scale, -scale,-scale, 0, 1), new Vertex( scale, scale, scale, 1, 0), new Vertex( scale, -scale, scale, 0, 0 )));


    this.polygons[0].colour = { r: 255, g: 0, b: 0, a: 255};
    this.polygons[1].colour = { r: 255, g: 0, b: 0, a: 255};

    this.polygons[2].colour = { r: 0, g: 255, b: 0, a: 255};
    this.polygons[3].colour = { r: 0, g: 255, b: 0, a: 255};

    this.polygons[4].colour = { r: 120, g: 120, b: 120, a: 255};
    this.polygons[5].colour = { r: 255, g: 255, b: 255, a: 255};

    this.polygons[6].colour = { r: 0, g: 0, b: 120, a: 255};
    this.polygons[7].colour = { r: 0, g: 0, b: 255, a: 255};

    this.polygons[8].colour = { r: 120, g: 0, b: 120, a: 255};
    this.polygons[9].colour = { r: 255, g: 0, b: 255, a: 255};

    this.polygons[10].colour = { r: 120, g: 120, b: 0, a: 255};
    this.polygons[11].colour = { r: 255, g: 255, b: 0, a: 255};
    return true;
  };

  this.CreateViewMatrix = function () {
    var lookat = new Point(0, 0, 0);
    var c = new Point(0, 10, -50);
    var u = new Point(0, 0, 0);
    var v = new Point(0, 0, 0);
    var w = new Point(0, 0, 0);

    w = w.Sub(c, lookat);
    w.Normalise();

    u = u.Cross(new Point(0, 1, 0), w);
    u.Normalise();

    v = v.Cross(w, u);
    v.Normalise();

    var rotation = new Matrix4x4();
    rotation.Identity();

    rotation.value[0] = u.x;
    rotation.value[1] = u.y;
    rotation.value[2] = u.z;

    rotation.value[4] = v.x;
    rotation.value[5] = v.y;
    rotation.value[6] = v.z;

    rotation.value[8] = w.x;
    rotation.value[9] = w.y;
    rotation.value[10] = w.z;

    var trans = new Matrix4x4();
    trans.Identity();

    trans.value[3] = -c.x;
    trans.value[7] = -c.y;
    trans.value[11] = -c.z;

    this.viewMatrix = trans.Multiply(rotation, trans);
  };

  this.CreateProjectionMatrix = function () {
    this.projMatrix.Identity();

    // var far = 1000;
    // var near = 1;

    // var fov = 90;
    // var FovScale = 1 / Math.tan((fov * 0.5) /** Math.PI / 180*/);
    // this.projMatrix.value[0] = FovScale;
    // this.projMatrix.value[5] = FovScale / (_canvas.height / _canvas.width);
    // this.projMatrix.value[10] = - far / (far - near);
    // this.projMatrix.value[11] = - 2 * far * near / (far - near);
    // this.projMatrix.value[14] = - 1;
    // this.projMatrix.value[15] = 0;

    //var
      // l = _canvas.width * 0.5,
      // r = -_canvas.width * 0.5,
      // t = _canvas.height * 0.5,
      // b = -_canvas.height * 0.5;
    //   l = -_canvas.width * 0.5,
    //   r = _canvas.width * 0.5,
    //   t = -_canvas.height * 0.5,
    //   b = _canvas.height * 0.5;

    // this.projMatrix.value[0] = (2 * near) / (r - l);
    // this.projMatrix.value[2] = (r + l) / (r - l);
    // this.projMatrix.value[5] = (2 * near) / (t - b);
    // this.projMatrix.value[5] = (t + b) / (t - b);
    // this.projMatrix.value[10] = - far / (far - near);
    // this.projMatrix.value[11] = - far * near / (far - near);
    // this.projMatrix.value[14] = - 1;
    // this.projMatrix.value[15] = 0;

    // this.projMatrix.value[10] = - 1;
    this.projMatrix.value[11] = - 1;
    this.projMatrix.value[15] = 0;
  };

  this.LoadContent = function () {
    this.GameLoop = setInterval(this.RunGameLoop, this.DrawInterval);
  };

  this.RunGameLoop = function (game) {
    document.edGame.Update();
    document.edGame.Draw();
  };

  this.Run = function () {
    if (this.Initialize()) {
      // if initialization was succesfull, load content
      this.LoadContent();
    }
  };

  this.Update = function () {
    this.angle += 0.01;
    if(this.angle > 6.28 )
      this.angle = 0;



    //console.time("Matrices");
		this.wvp.Identity();
    //var roty = this.wvp.RotateY(this.angle);
    //var rotx = this.wvp.RotateX(this.angle);
		//var rotz = this.wvp.RotateZ(this.angle);
    var WorldMatrix = this.wvp.Translate( 0, 0, 0 );

    //var fin = this.wvp.Multiply( transm, rotx);
    //fin = this.wvp.Multiply( fin, roty);
    //fin = this.wvp.Multiply( fin, rotz);

    // WorldMatrix = this.wvp.Multiply( WorldMatrix, this.viewMatrix);
    // this.wvp = this.wvp.Multiply( WorldMatrix, this.projMatrix);

    this.wvp = this.wvp.Multiply( this.projMatrix, this.viewMatrix);
    this.wvp = this.wvp.Multiply( this.wvp, WorldMatrix );

    //console.timeEnd("Matrices");
  };

  this.Convert2D = function( point )
  {
    var w = 1;
    var value = new Point();
    var scale = 0.5; // w / point.z;
    value.x = Round(point.x / scale + _canvas.width * 0.5);
    value.y = Round(-point.y / scale + _canvas.height * 0.5);
    value.z = Round(point.z);

    return value;
  };

  this.Draw = function () {
    // draw game frame
    //check whether browser supports getting canvas context
    if (_canvas && _canvas.getContext) {
      _canvasContext = _canvas.getContext('2d');
      _canvasContext.fillStyle = "rgb(0,0,0)";
      _canvas.width = _canvas.width; // clears

      _canvasContext.fillRect(0, 0, _canvas.width, _canvas.height);

      for( var i in this.polygons )
      {
        var poly = this.polygons[i];

        poly.Draw(_canvasContext, this.wvp);
      }
    }
  };
}
