// 
// EvolutionSnake
// Copyright 2013 Edward Addley
//


// comment

var Face = {
	NORTH : 0,
	SOUTH : 1,
	EAST  : 2,
	WEST  : 3,
	MAX   : 4
};

var TILE_SIZE					= 16.0;
var MAX_SNAKE_LENGTH	= 100;
var START_TURN_TIME		= 0.18;
var TURN_TIME					= START_TURN_TIME;
var SCREEN_WIDTH			= 320;
var SCREEN_HEIGHT			= 280;

function Snake(PosX, PosY)
{
	this.Body						= new Array(MAX_SNAKE_LENGTH);
	this.Body[0]				= { x: PosX, y: PosY };
	this.Length					= 1;
	this.Facing					= Face.SOUTH;
	this.NextFacing			= Face.SOUTH;
	this.MovementTimer	= 1.0;
	this.Colour					= "rgb(0,0,0)";
}

Snake.prototype.CollideWithSelf = function (x, y) {
	// Search through entire body to see whether we collide
	for (var i = 1; i < this.Length; i++) {
		if(this.Body[i].x == x && this.Body[i].y == y) {
			return true;
		}
	}

	// No collision
	return false;
};

Snake.prototype.Update = function( delta ) {
	// Update movement after a certain amount of time

	this.MovementTimer = this.MovementTimer - delta;

	if(this.MovementTimer <= 0.0)
	{
		this.MovementTimer = TURN_TIME;

		// Finalise the next facing
		this.Facing = this.NextFacing;

		// The head moves while underneath it, a body/tail is left behind
		var AheadClear = document.theGame.IsTileClear(this.Body[0].x, this.Body[0].y, this.Facing);

		if(AheadClear === false) {
			// What is it? Food? Power Up? Passenger?
			var ItemId = document.theGame.GetItemAheadAt(this.Body[0].x, this.Body[0].y, this.Facing);

			// Clear the tile
			document.theGame.ClearItemAheadAt(this.Body[0].x, this.Body[0].y, this.Facing);

			// Food - Increase body length
			if(ItemId == 1) {

				// Extend body
				// Note: Body part position is set below as body parts move along
				if (this.Length < MAX_SNAKE_LENGTH)
					this.Length++;

				document.theGame.score += 10;
				document.theGame.AddRandomApple();
				document.getElementById('eat_sound').play();

				TURN_TIME -= 0.01;
				if(TURN_TIME <= 0)
					TURN_TIME = 0.01;
			}
			else
			{
				if (ItemId !== 0) {
					console.log("ItemId not known - add in case for it.");
					console.assert(0);
				}
			}
		}

		// Move body parts along
		for( var i = this.Length - 1; i >= 1; i--) {
			// Each item in the arrow hasn't been inited yet so init now
			if (this.Body[i] === undefined)
				this.Body[i] = {};

			this.Body[i].x = this.Body[i - 1].x;
			this.Body[i].y = this.Body[i - 1].y;
		}

		// Set new position
		switch(this.Facing)
		{
			case Face.NORTH:
				this.Body[0].y--;
				if (this.Body[0].y < 0)
					this.Body[0].y = document.theGame.gridh - 1;
				break;

			case Face.SOUTH:
				this.Body[0].y++;
				if (this.Body[0].y >= document.theGame.gridh)
					this.Body[0].y = 0;
				break;

			case Face.WEST:
				this.Body[0].x--;
				if (this.Body[0].x < 0)
					this.Body[0].x = document.theGame.gridw - 1;
				break;

			case Face.EAST:
				this.Body[0].x++;
				if (this.Body[0].x >= document.theGame.gridw)
					this.Body[0].x = 0;
				break;
		}

		// Check if we've now collided with our self
		if (this.CollideWithSelf(this.Body[0].x, this.Body[0].y)) {
			// Game Over
			document.theGame.GameOver();
		}
	}
};

Snake.prototype.Draw = function( _canvasContext ) {
	var CameraPos = document.theGame.cameraPos;
	var x = this.Body[0].x * TILE_SIZE + CameraPos.x;
	var y = this.Body[0].y * TILE_SIZE + CameraPos.y;

	var BODY_WIDTH = TILE_SIZE;
	var BODY_HEIGHT = BODY_WIDTH;

	var MIN_WIDTH = 5;
	var MIN_HEIGHT = MIN_WIDTH;

	// Head
	_canvasContext.fillStyle = this.Colour;
	_canvasContext.fillRect(x, y, TILE_SIZE, TILE_SIZE);

	// Body
	for (var i = 1; i < this.Length-1; i++) {
		var scale = 1 - (i / (this.Length-1));
		var w = BODY_WIDTH * scale;
		var h = BODY_HEIGHT * scale;
		x = this.Body[i].x * TILE_SIZE + CameraPos.x + (TILE_SIZE - w) * 0.5;
		y = this.Body[i].y * TILE_SIZE + CameraPos.y + (TILE_SIZE - h) * 0.5;
		// _canvasContext.fillStyle = "rgb(127,0,0)";
		_canvasContext.fillRect(x, y, w, h);
	}

	// Tail
	if (this.Length > 1) {
		x = this.Body[this.Length-1].x * TILE_SIZE + CameraPos.x + (TILE_SIZE - MIN_WIDTH) * 0.5;
		y = this.Body[this.Length-1].y * TILE_SIZE + CameraPos.y + (TILE_SIZE - MIN_HEIGHT) * 0.5;
		// _canvasContext.fillStyle = "rgb(127,0,0)";
		_canvasContext.fillRect(x, y, MIN_WIDTH, MIN_HEIGHT);
	}
};

function Item(_type, _x, _y) {
	this.type = _type;
	this.x = _x;
	this.y = _y;
}

function Game() {
	this.mouse = { x: 0, y:0 };
	this.cameraPos = { x: 0, y:0 };
	this.player = new Snake(0, 0);
	this.itemList = [];

	this.score = 0;
	this.highscore = 0;

	this.gridw = Math.floor(SCREEN_WIDTH / TILE_SIZE);
	this.gridh = Math.floor(SCREEN_HEIGHT / TILE_SIZE);
	this.grid = Array(this.gridw * this.gridh);

	this.date = new Date();
	this.startTime = this.date.getTime();
	this.deltaTime = 0;
	this.currentTime = this.startTime;

	this.frame = 0;
	this.fps = 0;

	this.OurStorage = localStorage;

	var _canvas;
	var _canvasContext;

	var GameState = {
		Start    : 0,
		Main     : 1,
		GameOver : 2,
		Max      : 3
	};

	var _scoreElement;
	var _highscoreElement;

	this.currentState = GameState.Start;

	this.Initialise = function () {
		// initialise all game variables

		_canvas = document.getElementById('gameCanvas');
		_canvas.width = SCREEN_WIDTH;
		_canvas.height = SCREEN_HEIGHT;

		// Stupid CSS styles in text
		document.onresize = function () {
			var ratio = (SCREEN_WIDTH / SCREEN_HEIGHT);
			var width = window.innerHeight * ratio;

			if( width > window.innerWidth) {
				_canvas.style.height = (window.innerWidth * ratio) + 'px';
				_canvas.style.width = window.innerWidth + 'px';
			}
			else {
				_canvas.style.width = width + 'px';
				_canvas.style.height = (window.innerHeight - 44) + 'px';
			}
		};
		document.onresize();

		_canvasContext = _canvas.getContext("2d");

		//_canvas.contentEditable = true;

		this.cameraPos.x = 0;
		this.cameraPos.y = 0;

		// Set up event handlers
		_canvas.onkeydown = this.KeyCheck;
		_canvas.focus();

		// TODO: Check for whether touch is present on all devices/browsers
		// TEST
		if( 'ontouchstart' in document.documentElement) {
			_canvas.ontouchstart = this.TouchStart;
		}
		else {
			document.onmousedown = this.MouseDownCheck;
			//document.onmouseup = this.MouseUpCheck;
		}

		// Check for localStorage available for local scores
		if( typeof(Storage) !== undefined) {
			if(localStorage !== undefined) {
				this.OurStorage = localStorage;
			}
			else {
				if(window.localStorage !== undefined) {
					this.OurStorage = window.localStorage;
				}
			}
		}

		if(this.OurStorage !== undefined) {
			if(this.OurStorage.highscore === undefined) {
				this.OurStorage.highscore = "0";
			} else {
				this.highscore = Number(this.OurStorage.highscore);
			}
		}

		this._scoreElement = document.getElementById('score_stat');
		this._highscoreElement = document.getElementById('highscore_stat');

		// Set up game world
		// for(var i = 0; i < this.gridh * this.gridw; i++)
		// {
		//   this.grid[i] = {};
		//   this.grid[i].typeId = Math.floor(Math.random() * 2 + 0.5);
		//   // this.grid[i].itemId = Math.floor(Math.random() + 0.5);
		//   this.grid[i].itemId = 0;
		// }

		this.AddRandomApple();
	};

	this.AddRandomApple = function () {
		// var i = Math.floor(Math.random() * ((this.gridh - 1) * (this.gridw - 1)));
		// this.grid[i].itemId = 1;
		var item = new Item(1, Math.floor(Math.random() * (this.gridh - 1)), Math.floor(Math.random() * (this.gridh - 1)));
		this.itemList.push(item);
	};

	this.GameOver = function () {
		document.getElementById('death_sound').play();
		this.currentState = GameState.GameOver;
		if(this.score > this.highscore) {
			this.highscore = this.score;

			// Check for localStorage available for local scores
			if(this.OurStorage !== undefined) {
				this.OurStorage.highscore = this.highscore;
			}
		}
	};

	this.Reset = function () {
		this.currentState = GameState.Main;
		this.score = 0;
		var hw = Math.floor(this.gridw * 0.5);
		var hh = Math.floor(this.gridh * 0.5);
		this.player = new Snake(hw, hh);
		TURN_TIME = START_TURN_TIME;

		document.getElementById('start_sound').play();
	};

	this.StartGame = function () {
		this.Reset();
	};

	this.GameLoop = function () {
		var Game = document.theGame;
		window.requestAnimFrame(Game.GameLoop);
		var date = new Date();
		var time = date.getTime();
		Game.deltaTime = (time - Game.currentTime) / 1000;
		Game.currentTime = time;

		Game.Update(Game.deltaTime);
		Game.Draw();

		// Game.frame++;
		// time = date.getTime();
		// Game.fps = Game.frame / ((time - Game.startTime) / 1000);
	};

	this.Update = function (delta) {
		// update game variables, handle user input, perform calculations etc.
		this._scoreElement.innerText = this.score;
		this._highscoreElement.innerText = this.highscore;


		if (this.currentState == GameState.Main) {
			this.player.Update(delta);
		}
		else {
			if (this.currentState == GameState.Start || this.currentState == GameState.GameOver) {
				// wait for a key to be pressed
			}
		}
	};

	this.Draw = function () {
		// draw game frame
		//check whether browser supports getting canvas context
		if (_canvas) {

			_canvasContext.fillStyle = "rgb(80,80,80)";
			_canvasContext.fillRect(0, 0, _canvas.width, _canvas.height);

			// Draw items
			var radius = (TILE_SIZE - 10) * 0.5;
			_canvasContext.fillStyle = "rgb(255,0,0)";

			for(i = 0; i < this.itemList.length; i++ ) {
				_canvasContext.beginPath();
				_canvasContext.arc(this.itemList[i].x * TILE_SIZE + TILE_SIZE * 0.5, this.itemList[i].y * TILE_SIZE + TILE_SIZE * 0.5, radius, 0, 2*Math.PI);
				_canvasContext.fill();
			}

			// Draw player
			this.player.Draw(_canvasContext);

			_canvasContext.font = "bold 16px sans-serif";
			_canvasContext.textAlign = "center";

			// FPS
			// _canvasContext.fillStyle = "rgb(0,0,0)";
			// var Delta = 'Delta ' + this.deltaTime;
			// _canvasContext.fillText(Delta, 10, 10);
			// var FPS = 'FPS ' + this.fps;
			// _canvasContext.fillText(FPS, 10, 20);


			// Score
			// var LocalScore = 'Score: ' + this.score;
			// _canvasContext.fillText(LocalScore, 10, SCREEN_HEIGHT - 15);
			// var LocalHighScore = 'Highscore: ' + this.highscore;
			// _canvasContext.fillText(LocalHighScore, 10, SCREEN_HEIGHT - 30);


			// TODO Centre
			_canvasContext.fillStyle = "rgb(0,0,0)";
			_canvasContext.font = "bold 18px sans-serif";
			if (this.currentState == GameState.Start) {
				_canvasContext.fillText("Press a key to start", _canvas.width * 0.5, _canvas.height * 0.5);
				_canvasContext.fillStyle = "rgb(255,255,255)";
				_canvasContext.fillText("Press a key to start", _canvas.width * 0.5 + 2, _canvas.height * 0.5 + 2);
			} else if (this.currentState == GameState.GameOver) {
				_canvasContext.textBaseline = "bottom";
				_canvasContext.fillText("GAMEOVER!", _canvas.width * 0.5, _canvas.height * 0.5);
				_canvasContext.textBaseline = "top";
				_canvasContext.fillText("Press a key to start", _canvas.width * 0.5, _canvas.height * 0.5);
				
				_canvasContext.fillStyle = "rgb(255,0,0)";
				_canvasContext.textBaseline = "bottom";
				_canvasContext.fillText("GAMEOVER!", _canvas.width * 0.5 + 2, _canvas.height * 0.5 + 2);
				_canvasContext.fillStyle = "rgb(255,255,255)";
				_canvasContext.textBaseline = "top";
				_canvasContext.fillText("Press a key to start", _canvas.width * 0.5 + 2, _canvas.height * 0.5 + 2);
			}
		}
	};

	this.GetDirection = function() {
		return this.player.Facing;
	};

	this.SetDirection = function( face ) {
		this.player.NextFacing = face;
	};

	this.GetPositionAhead = function (x, y, facing) {
		console.assert(x >= 0);
		console.assert(x < this.gridw);
		console.assert(y >= 0);
		console.assert(y < this.gridh);

		// TODO Assert facing

		var FaceMod = {};
		FaceMod[Face.NORTH] = { x: 0, y: -1};
		FaceMod[Face.SOUTH] = { x: 0, y: 1};
		FaceMod[Face.WEST] = { x: -1, y: 0};
		FaceMod[Face.EAST] =  { x: 1, y: 0};

		var NewPosition = {
			x: x + FaceMod[facing].x,
			y: y + FaceMod[facing].y
		};


		// Wrap
		if (NewPosition.x >= this.gridw)
			NewPosition.x = 0;
		if (NewPosition.x < 0)
			NewPosition.x = this.gridw - 1;
		if (NewPosition.y >= this.gridh)
			NewPosition.y = 0;
		if (NewPosition.y < 0)
			NewPosition.y = this.gridh - 1;

		return NewPosition;
	};

	this.IsTileClear = function (x, y, facing) {

		var pos = this.GetPositionAhead(x, y, facing);

		for(var i = 0; i < this.itemList.length; i++) {
			if (this.itemList[i].x  == pos.x && this.itemList[i].y == pos.y)
				return false;
		}

		return true;
	};

	this.GetItemAheadAt = function (x, y, facing) {

		var pos = this.GetPositionAhead(x, y, facing);

		for(var i = 0; i < this.itemList.length; i++) {
			if (this.itemList[i].x  == pos.x && this.itemList[i].y == pos.y)
				return this.itemList[i].type;
		}

		return 0;
	};

	this.ClearItemAheadAt = function (x, y, facing) {

		var pos = this.GetPositionAhead(x, y, facing);

		for(var i = 0; i < this.itemList.length; i++) {
			if (this.itemList[i].x  == pos.x && this.itemList[i].y == pos.y)
				this.itemList.splice(i,1);
		}
	};

	this.PointerInput = function (x, y) {
		if(document.theGame.currentState == GameState.Main) {
			var PreviousFace = document.theGame.GetDirection();
			var posx = x;
			var posy = y;
			if(Math.abs(posy) < Math.abs(posx)) {
				if(posx < 0) {
					if(PreviousFace != Face.EAST) {
						document.theGame.SetDirection(Face.WEST);
					}
				}
				else {
					if(PreviousFace != Face.WEST) {
						document.theGame.SetDirection(Face.EAST);
					}
				}
			}
			else {
				if(posy < 0) {
					if(PreviousFace != Face.SOUTH) {
						document.theGame.SetDirection(Face.NORTH);
					}
				}
				else {
					if(PreviousFace != Face.NORTH) {
						document.theGame.SetDirection(Face.SOUTH);
					}
				}
			}
		}
		else {
			document.theGame.StartGame();
		}
	};

	this.TouchStart = function (event) {
		event.preventDefault();

		var posx = event.changedTouches[0].pageX - window.innerWidth * 0.5;
		var posy = event.changedTouches[0].pageY - window.innerHeight * 0.5;

		document.theGame.PointerInput(posx, posy);
		// _canvas.focus();
	};

	this.MouseDownCheck = function (event)
	{
		var posx = event.pageX - window.innerWidth * 0.5;
		var posy = event.pageY - window.innerHeight * 0.5;

		document.theGame.PointerInput(posx, posy);

		_canvas.focus();
		return false;
	};

	this.MouseUpCheck = function (event)
	{
		return false;
	};

	this.KeyCheck = function (event) {
		var KeyID = event.keyCode;
		var Self = document.theGame;

		event.stopPropagation();
		event.preventDefault();

		if (Self.currentState == GameState.Main) {

			var PreviousFace = Self.GetDirection();

			switch (KeyID) {
				case 49: // 1
				break;

				case 87: // W
				if(PreviousFace != Face.SOUTH)
					Self.SetDirection(Face.NORTH);
				break;

				case 65: // A
				if(PreviousFace != Face.EAST)
					Self.SetDirection(Face.WEST);
				break;

				case 68: // D
				if(PreviousFace != Face.WEST)
					Self.SetDirection(Face.EAST);
				break;

				case 83: // S
				if(PreviousFace != Face.NORTH)
					Self.SetDirection(Face.SOUTH);
				break;
			}
		}
		else { //if (this.currentState == GameState.Start || this.currentState == GameState.GameOver) {
			Self.StartGame();
		}
	};

	return false;
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function () {
	return window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function (callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();

// Set initial on finish loading function
window.onload = function () {

	document.theGame = new Game();
	document.theGame.Initialise();

	window.requestAnimFrame(document.theGame.GameLoop);
};

// Error handling
window.onerror = function (message, location, line) {
	alert(message + line);
	console.error(message + " : " + line);
	//debugger;
};


