var canvas = document.getElementById("board");
var ctx = canvas.getContext("2d");
var multiplier = window.innerHeight/990; //easy way to scale to different resolutions
resizeCanvas();
var mainImage = new Image();
mainImage.src = "board.png"; //size: 1600x990
var drawing; //the drawing interval
var heightOfGame = 3/4; //the bottom fourth of the screen is dedicated to the UI
var buttons = []; //array of the UI buttons
var tiles = new Array(60); //1D, not 2D
var updatePerTick = []; //array of functions that need to get updated every tick
var mouse = {
	x: undefined,
	y: undefined,
	clicked: false
};

function nothing() { return; } //all "nothing" functions point to this for easy checking

function linearTo2D(num){
	 return [(num-1)%20 - (((num-1)%20 - 9)*2 - 1) * Math.floor((num-1)%20 / 10), Math.floor((num-1) / 10)]; //every second row has an equal x offset, and the second part is for mirroring of the row after
}

var dice = { //singular of "dice" is allowed to be "dice"
	num: 1,
	randomize: false,
	diceDraw: 0, //draw every so often, not every frame
	maxDiceDraw: 3,
	drawNum: 1,
	circleRadius: 3/32,
	numberTableX: [
		[.5],
		[.25,.75],
		[.25,.5,.75],
		[.25,.75,.25,.75],
		[.25,.75,.5,.25,.75],
		[.25,.75,.25,.75,.25,.75]
	],
	numberTableY: [
		[.5],
		[.25,.75],
		[.75,.5,.25],
		[.25,.25,.75,.75],
		[.25,.25,.5,.75,.75],
		[.25,.25,.5,.5,.75,.75]
	]
};

function diceRoll(){
	if(dice.randomize && !player.hasWon){
		dice.num = Math.floor(Math.random()*6)+1;
	}
}

function diceUpdate(){
	if(!player.hasWon){
		if(dice.randomize){
			player.move();
		}
		dice.randomize = !dice.randomize;
		dice.drawNum = dice.num;
	}
}

function singleDiceRoll(){
	if(!player.hasWon){
		dice.randomize = false;
		dice.num = Math.floor(Math.random()*6)+1;
		dice.drawNum = dice.num;
		player.move();
	}
}

var player = {
	position: 1, //[1,60]
	drawPosition: [0,0],
	willGoTo: 1, //sometimes the dice is rolled before the player has finished moving
	moveTicks: 0,
	maxMoveTicks: 0,
	hasWon: false,
	fastMove: false,
	move: function(amount, fast){
		this.moveTicks = 0;
		if(this.position != this.willGoTo){
			this.position = this.willGoTo;
			this.drawPosition = linearTo2D(this.position);
			tiles[this.position-1].activate();
			this.winCalculate();
		}
		if(fast == undefined){
			this.fastMove = false;
		}else{
			this.fastMove = fast;
		}
		if(amount == undefined){
			if(this.position + dice.num <= 60){
				this.willGoTo += dice.num;
			}
		}else{
			if(amount <= 60){
				this.willGoTo = amount;
			}
		}
		this.maxMoveTicks = 10;
	},
	winCalculate: function(){
		if(this.position == 60){
			this.hasWon = true;
			congrats.show = true;
		}
	},
	resetStuff: function(){
		this.position = 1;
		this.drawPosition = linearTo2D(1);
		this.willGoTo = 1;
		this.moveTicks = 0;
		this.maxMoveTicks = 0;
		this.hasWon = false;
		this.fastMove = false;
	},
	draw: function(){
		//I think past me hacked their way into figuring out where the player should be drawn and never updated this because this project wasn't wanted anymore
		ctx.beginPath();
		if(this.maxMoveTicks == 0){
			ctx.arc(((this.drawPosition[0] + .5)*118 + 9) * multiplier, ((5 - (this.drawPosition[1] - .5))*118 + 18) * multiplier, 118/4 *multiplier, 0, 2*Math.PI);
		}else{
			if(this.fastMove){
				ctx.arc(((this.drawPosition[0] + (linearTo2D(this.willGoTo)[0] - linearTo2D(this.position)[0]) * (this.moveTicks/this.maxMoveTicks) + .5)*118 + 9) * multiplier,
				        ((5 - (this.drawPosition[1] + (linearTo2D(this.willGoTo)[1] - linearTo2D(this.position)[1]) * (this.moveTicks/this.maxMoveTicks) - .5))*118 + 18) * multiplier,
				        118/4 * multiplier, 0, 2*Math.PI);
			}else{
				ctx.arc(((linearTo2D(this.position)[0] + (linearTo2D(this.position+1)[0] - linearTo2D(this.position)[0]) * (this.moveTicks/this.maxMoveTicks) + .5)*118 + 9) * multiplier,
				        ((5 - (this.drawPosition[1] + (linearTo2D(this.position+1)[1] - linearTo2D(this.position)[1]) * (this.moveTicks/this.maxMoveTicks) - .5))*118 + 18) * multiplier,
				        118/4 * multiplier, 0, 2*Math.PI);
			}
		}
		ctx.fillStyle = "#000000";
		ctx.fill();
	}
};

function playerUpdate(){
	if(player.willGoTo != player.position){
		player.moveTicks++;
		if(player.moveTicks >= player.maxMoveTicks){
			if(player.fastMove){
				player.position = player.willGoTo;
			}else{
				player.position++;
			}
			player.drawPosition = linearTo2D(player.position);
			player.moveTicks = 0;
			if(player.position == player.willGoTo){
				player.maxMoveTicks = 0;
				tiles[player.position-1].activate();
				player.winCalculate();
			}else if(player.position > player.willGoTo){
				player.position = player.willGoTo;
				player.drawPosition = linearTo2D(player.position);
				tiles[player.position-1].activate();
				player.winCalculate();
			}
		}
	}
}

var congrats = {
	xpos: 5/16,
	ypos: .125,
	width: 11/16 - 5/16,
	height: .875 - .125,
	
	contents: "Congratulations!",
	sizeFont: 24,
	show: false,
	
	normalColor: "#FFFFFF",
	
	draw: function(){
		if(!this.show)
			return;
		
		ctx.beginPath();
		ctx.font = Math.floor(multiplier*this.sizeFont * 200)/200 + "pt Helvetica";
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillStyle = this.normalColor;
		ctx.fillText(this.contents, (this.xpos + this.width/2) * canvas.width, (this.ypos + this.height/2) * (1-heightOfGame) * canvas.height + canvas.height * heightOfGame);
	}
};

function resizeCanvas(){
	if(window.innerHeight/990 <= window.innerWidth/(1600*heightOfGame)){
		multiplier = window.innerHeight/990; //screen is tall
	}else{
		multiplier = window.innerWidth/(1600*heightOfGame); //screen is wide
	}
	canvas.height = 990*multiplier;
	canvas.width = 1600*multiplier*heightOfGame;
}

function UI_Button(x, y, w, h, displayText, sizeOfFont, thingToDo, backColor, selectColor, im){
	//backColor and selectColor are optional
	//x and y are taken as a percentage of the UI bar; w and h are also, but they are endpoints
	this.xpos = x,
	this.ypos = y,
	this.width = w - x,
	this.height = h - y,
	
	this.contents = displayText,
	this.sizeFont = sizeOfFont,
	this.isSelected = false,
	
	this.normalColor = (backColor==undefined ? "#DDDDDD" : backColor),
	this.selectedColor = (selectColor==undefined ? "#BBBBBB" : selectColor),
	this.picture = (im==undefined ? nothing : im), //an algorithmically generated image can exist
	
	this.activate = thingToDo, //what should the button do when it's clicked
	this.isMousedOver = function(){
		return (mouse.x >= this.xpos * canvas.width / multiplier &&
		        mouse.x <= (this.xpos + this.width) * canvas.width / multiplier &&
		        mouse.y >= this.ypos * (1-heightOfGame) * canvas.height / multiplier + canvas.height / multiplier * heightOfGame &&
		        mouse.y <= (this.ypos+this.height) * (1-heightOfGame) * canvas.height / multiplier + canvas.height / multiplier * heightOfGame);
	},
	
	this.draw = function(){
		ctx.beginPath();
		ctx.rect(this.xpos * canvas.width, this.ypos * (1-heightOfGame) * canvas.height + canvas.height * heightOfGame,
		         this.width * canvas.width, this.height * (1-heightOfGame) * canvas.height);
		if(this.isMousedOver() && (!mouse.clicked || this.isSelected)){
			ctx.fillStyle = this.selectedColor;
		}else{
			ctx.fillStyle = this.normalColor;
		}
		ctx.fill();
		
		ctx.beginPath();
		ctx.font = Math.floor(multiplier*this.sizeFont * 200)/200 + "pt Helvetica"; //if no Helvetica, then it defaults to Times New Roman
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillStyle = "#000000";
		ctx.fillText(this.contents, (this.xpos + this.width/2) * canvas.width, (this.ypos + this.height/2) * (1-heightOfGame) * canvas.height + canvas.height * heightOfGame);
		
		this.picture(this.xpos * canvas.width, this.ypos * (1-heightOfGame) * canvas.height + canvas.height * heightOfGame,
		             this.width * canvas.width, this.height * (1-heightOfGame) * canvas.height); //if the button wants to draw its image function, then it can
	}
}

function Tile(num, thingToDo){
	//num is the position: integer in [1,60]
	//thingToDo is the function to do when the player lands of the tile
	this.xpos = linearTo2D(num)[0],
	this.ypos = linearTo2D(num)[1],
	this.activate = (thingToDo==undefined ? nothing : thingToDo)
}

function TilePath(numStart, numEnd){ //not actually a constructor, but it's fine
	return function(){
		if(player.position == numStart){
			player.move(numEnd, true);
		}
	}
}

function diceDraw(x, y, w, h){
	dice.diceDraw = (dice.diceDraw+1) % dice.maxDiceDraw;
	if(dice.diceDraw == 0){
		dice.drawNum = dice.num;
	}
	
	ctx.beginPath();
	ctx.rect(x + 2, y + 2, w - 4, h - 4);
	ctx.fillStyle = "#FFFFFF";
	ctx.fill();
	
	for(var i = 0; i < dice.drawNum; i++){
		ctx.beginPath();
		ctx.arc(x + w*dice.numberTableX[dice.drawNum-1][i], y + h*dice.numberTableY[dice.drawNum-1][i], dice.circleRadius * w, 0, 2*Math.PI);
		ctx.fillStyle = "#000000";
		ctx.fill();
	}
}

function resetEverything(){
	player.resetStuff();
	congrats.show = false;
}

function tick(){
	for(var i = 0; i < updatePerTick.length; i++){
		updatePerTick[i]();
	}
}

function draw(){
	resizeCanvas();
	
	ctx.beginPath();
	ctx.rect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#222222";
	ctx.fill();
	
	ctx.drawImage(mainImage, 0, 0, canvas.width, canvas.height * heightOfGame);
	player.draw();
	
	for(var i = 0; i < buttons.length; i++){
		buttons[i].draw();
	}
	congrats.draw();
}

function main(){
	tick();
	draw();
}

mainImage.onload = function(){
	resizeCanvas();
	drawing = setInterval(main, 20);
	
	for(var i = 0; i < 60; i++)
		tiles[i] = new Tile(i);
	
	tiles[17-1] = new Tile(17, new TilePath(17,  3));
	tiles[27-1] = new Tile(27, new TilePath(27,  9));
	tiles[33-1] = new Tile(33, new TilePath(33, 11));
	tiles[37-1] = new Tile(37, new TilePath(37, 25));
	tiles[49-1] = new Tile(49, new TilePath(49, 15));
	tiles[51-1] = new Tile(51, new TilePath(51, 31));
	tiles[53-1] = new Tile(53, new TilePath(53, 23));
	tiles[55-1] = new Tile(55, new TilePath(55, 47));
	tiles[57-1] = new Tile(57, new TilePath(57, 39));
	tiles[59-1] = new Tile(59, new TilePath(59,  1));
	
	buttons.push(new UI_Button(1/16,  .125,  4/16, .875, "Reset", 24, resetEverything));
	buttons.push(new UI_Button(13/16, .125, 15/16, .625, "",      0,  diceUpdate, "#000000", "#888888", diceDraw));
	buttons.push(new UI_Button(13/16, .625, 15/16, .875, "Roll",  16, singleDiceRoll));
}

updatePerTick.push(diceRoll, playerUpdate);

canvas.addEventListener("mousemove", function(event){
	mouse.x = Math.floor(event.offsetX/multiplier);
	mouse.y = Math.floor(event.offsetY/multiplier);
}, false);

canvas.addEventListener("mousedown", function(event){
	for(var i = 0; i < buttons.length; i++){
		if(buttons[i].isMousedOver()){
			buttons[i].isSelected = true;
			break;
		}
	}
	mouse.clicked = true;
}, false);

canvas.addEventListener("mouseup", function(event){
	for(var i = 0; i < buttons.length; i++){
		if(buttons[i].isSelected && buttons[i].isMousedOver()){
			buttons[i].activate();
		}
		buttons[i].isSelected = false;
	}
	mouse.clicked = false;
}, false);

canvas.oncontextmenu = function() { return false; }

//for slow connections:
ctx.beginPath();
ctx.rect(0, 0, canvas.width,canvas.height);
ctx.fillStyle = "#FFFFFF";
ctx.fill();
ctx.beginPath();
ctx.fillStyle = "#000000";
ctx.fillText("game is loading, you have a slow connection, just wait", window.innerWidth/4, window.innerHeight/4);