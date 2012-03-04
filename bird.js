(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());



function Bird(canvas, x, y, w, h) {
	this.x = x || 0;
	this.y = y || 0;
	
	this.canvas = canvas;
	
	this.width = w || canvas.width;
	this.height = h || canvas.height;
	
	this.ctx = this.canvas.getContext('2d');
}

Bird.prototype = {
	
	colors: {
		body: '50, 50, 50, 1',
		wing: '0, 0, 0, 1'
	},
	
	body: [],
	originalBody: [],
	
	wings: {
		left: [],
		right: []
	},
	
	updateRate: 0.002,
	
	speedChangeOnFrame: 100,
	
	variableSpeed: false,
	
	wingWidth: 75,
	wingPinch: 10,
	wingTipLength: 100,
	wingLength: 10,
	
	wingOffsetY: 0,
	
	bodyMovement: 5,
	
	
	/**
	*	Creates the point coordinates used by drawBody().
	*	For now, just creates a triangle.
	*/
	makeBody: function(x, y, w, h) {
		var i = 0,
			pointOffset = 0;
		
		this.originalBody.push({
			x: x,
			y: y
		});
		
		this.originalBody.push({
			x: x + w,
			y: y + (h/2)
		});
		
		this.originalBody.push({
			x: x,
			y: y + h
		});
		
		this.body.push({
			x: x,
			y: y
		});
		
		this.body.push({
			x: x + w,
			y: y + (h/2)
		});
		
		this.body.push({
			x: x,
			y: y + h
		});
		
	},
	
	/**
	*	Updates the body position
	*/
	updateBody: function(dt) {
		dt *= this.updateRate;
		
		this.body[0].y = -Math.sin(dt) * this.bodyMovement + this.originalBody[0].y;
		this.body[1].y = -Math.sin(dt) * this.bodyMovement + this.originalBody[1].y;
		this.body[2].y = -Math.sin(dt) * this.bodyMovement + this.originalBody[2].y;
	},
	
	/**
	*	Draws the body. Loops through the points in the body Array, creates
	*	lines between each point, then fills it.
	*/
	drawBody: function() {
		
		this.ctx.fillStyle = 'rgba(' + this.colors.body + ')';
		
		this.ctx.beginPath();
		this.ctx.moveTo(this.body[0].x, this.body[0].y);
		
		for(var i = 1, il = this.body.length; i < il; ++i) {
			this.ctx.lineTo(this.body[i].x, this.body[i].y);
		}
		
		this.ctx.fill();
	},
	
	
	
	/**
	*	Creates a wing. Essentially a triangle split horizontally down the middle
	*	thus creating a quadrilateral and a triangle that hinge where they join.
	*	Coordinates created running clockwise along each polygon.
	*/
	makeWing: function(side) {
		var wing = this.wings[side],
			baseX1 = this.x + (this.width / 2) - (this.wingWidth / 2),
			baseX2 = this.x + (this.width / 2) + (this.wingWidth / 2),
			baseY = this.y + (this.height / 2);
		
		// Make the 'base'. The two coordinates where the wing joins the body.
		// These two coordinates should probably never change.
		wing.push({
			x: baseX1,
			y: baseY
		});
		wing.push({
			x: baseX2,
			y: baseY
		});
		
		// Finish the quadrilateral. These two points are also used to draw the
		// triangle's base.
		wing.push({
			x: baseX2 - this.wingPinch,
			y: baseY - this.wingLength
		});
		wing.push({
			x: baseX1 + this.wingPinch,
			y: baseY - this.wingLength
		});
		
		// Add the triangle point. 
		wing.push({
			x: this.x + (this.width/2),
			y: baseY - this.wingLength - this.wingTipLength
		});
	},
	
	/**
	*	Updates a wing
	*/
	updateWing: function(side, dt) {
		var wing = this.wings[side],
			baseX1 = this.x + (this.width / 2) - (this.wingWidth / 2),
			baseX2 = this.x + (this.width / 2) + (this.wingWidth / 2),
			baseY = this.y + (this.height / 2);
		
		var leftRightIncrement = side === 'left' ? 0.5 : 0.5;
		
		dt *= this.updateRate;
		
		// Update the base positions
		wing[0].y = -Math.sin(dt) * this.bodyMovement + baseY;
		wing[1].y = -Math.sin(dt) * this.bodyMovement + baseY;
		
		// Update mid positions
		// left mid pos
		wing[2].y = Math.sin(dt) * (this.wingLength+10) + baseY - this.wingLength;
		wing[2].x = Math.cos(dt + leftRightIncrement) * 1 + (baseX2 - this.wingPinch);
		
		// right mid pos
		wing[3].y = Math.sin(dt) * (this.wingLength+10) + baseY - this.wingLength;
		wing[3].x = Math.cos(dt + leftRightIncrement) * 1 + (baseX1 + this.wingPinch);
		
		
		// Update the wing tip position
		wing[4].y = Math.sin(dt + leftRightIncrement) * this.wingTipLength + (baseY - this.wingLength);
		wing[4].x = Math.cos(dt + leftRightIncrement) * 20 + (this.x + (this.width/2));
		
	},
	
	/**
	*	Draws a wing...
	*/
	drawWing: function(side) {
		var wing = this.wings[side];
		
		this.ctx.fillStyle = 'rgba(' + this.colors.wing + ')';
		
		this.ctx.beginPath();
		this.ctx.moveTo(wing[0].x, wing[0].y);
		
		for(var i = 1;i < 4; ++i) {
			this.ctx.lineTo(wing[i].x, wing[i].y);
		}
		this.ctx.closePath();
		this.ctx.fill();
		
		// Draw the triangle
		this.ctx.beginPath();
		this.ctx.moveTo(wing[4].x, wing[4].y);
		
		for(var i = 4; i >= 2; --i) {
			this.ctx.lineTo(wing[i].x, wing[i].y);
		}
		
		this.ctx.fill();
	},
	
	
	render: function() {
		var that = this,
			frames = 0;
			
		
		function loop(now) {
			that.updateWing('left', now);
			that.updateBody(now);
			that.updateWing('right', now);
			
			that.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
			
			that.ctx.fillRect(0, 0, that.canvas.width, that.canvas.height);
			
			that.drawWing('left');			
			that.drawBody();
			that.drawWing('right');
			++frames;
			
			// FIXME: Check whether the bird has finished a flap cycle before changing updateRate.
			if(frames > that.speedChangeOnFrame && that.variableSpeed) {
				frames = 0;
				that.updateRate = Math.min(Math.random() / 10, 0.03);
				that.speedChangeOnFrame = Math.random() * 100;
			}
		}
		
		
		(function anim(dt) {
			window.requestAnimationFrame(anim);
			loop(dt);
		}());
		
	},
	
	/**
	*	Creates all the required elements.
	*/
	init: function() {
		this.makeBody(this.x, this.y, this.width, this.height);
		
		this.drawBody();
		this.makeWing('right');
		this.drawWing('right');
		this.makeWing('left');
		this.drawWing('left');
	}
};


function main() {
	var bird = new Bird(document.getElementById('myCanvas'), 200, 100, 200, 50);
	bird.init();
	bird.render();
}