/*
Copyright (c) 2012 Samuel Colvin. All rights reserved.

Released under the creative commons Attribution-NonCommercial-ShareAlike 3.0 license (http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode). See main.js for details.

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING AND TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THIS EXCLUSION MAY NOT APPLY TO YOU.
*/
ClockSet = function(){

	var ctx = null;
	var wh = 75;
	var x = null;
	var zones = [];
	var x = [];
	var stopper = 0;
	var scale_clock;

	this.setup = function(zone){
		zones.push(zone);
		x = [];
		var step = innerWidth/(zones.length)
		scale_clock = Math.sqrt(height / 640);
		scale_clock = scale_clock > 1 ? 1 : scale_clock;
		for (var i = 0;i<zones.length; i++){
			x.push((i + 0.5) * step - wh * scale_clock);
		}
		clearInterval(stopper);
		tickall();
		var rate = 70;
		if (!datetime.real && datetime.rate != 1)
			rate = 1000;
		stopper = setInterval(tickall, rate);
	}

	this.clear = function(){
		for (var i = 0;i<max_clocks;i++){
			var element = document.getElementById('clock'+i);
			element.style.top =  '0px';
			element.style.left =  '0px';
			element.style.display = 'none';
		}
		zones = [];
		x = [];
	}

	function tickall(){
		var y = height - wh * 2 * scale_clock - 20;
		for (var i = 0;i<zones.length;i++){
			tick(zones[i], i, y);
		}
	}

	function tick(zone, x_index, y){
		var date = zone.date()
		
		var sec = date.getSeconds() + date.getMilliseconds() / 1000;
		var min = date.getMinutes();
		var hr  = date.getHours();
		hr = hr>= 12 ? hr-12 : hr;
		
		var element = document.getElementById('clock'+x_index);
		ctx =  element.getContext('2d');
		element.width = wh * 2 * scale_clock;
		element.height = wh * 2 * scale_clock;
		element.style.top =  y +'px';
		element.style.left =  x[x_index] +'px';
		element.style.display = "block";
		
		ctx.scale(scale_clock, scale_clock);
		
		ctx.save();
		
		ctx.translate(wh,wh);
		ctx.clearRect(-wh,-wh,wh,wh);
		
		//box
		var grad = ctx.createLinearGradient(-wh, -wh, -wh, wh);
		var cs = [48,64,8,0];
		grad.addColorStop(0,   'rgb(' + cs[0] + ',' + cs[0] + ',' + cs[0] + ')');
		grad.addColorStop(0.49,'rgb(' + cs[1] + ',' + cs[1] + ',' + cs[1] + ')');
		grad.addColorStop(0.5, 'rgb(' + cs[2] + ',' + cs[2] + ',' + cs[2] + ')');
		grad.addColorStop(1,   'rgb(' + cs[3] + ',' + cs[2] + ',' + cs[3] + ')');
		drawsquare(grad);
		
		var grad2 = ctx.createLinearGradient(-wh, -wh, wh, -wh);
		grad2.addColorStop(0,   "rgba(0, 0, 0, 1)");
		grad2.addColorStop(0.02,"rgba(0, 0, 0, 0)");
		grad2.addColorStop(0.98,"rgba(0, 0, 0, 0)");
		grad2.addColorStop(1,   "rgba(0, 0, 0, 1)");
		drawsquare(grad2);
			
		ctx.rotate(Math.PI/2);
		drawsquare(grad2);
		ctx.rotate(-Math.PI/2);
		
		var radgrad = ctx.createRadialGradient(0,0,99,0,0,103);
		radgrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
		radgrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
		drawsquare(radgrad);
		
		//text
		var timestring = time_short(date);
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';
		ctx.font = '14pt Garamond';
		var pin_y;
		if (datetime.real){
			ctx.fillText(timestring,0,-56);
			pin_y = -60;
		}
		else{
			ctx.fillText(timestring + ' ' + zone.standard_short_date(date),0,-56);
			pin_y = -40;
		}
		ctx.font = '14pt Garamond';
		if (zone.place == ''){
			ctx.fillText(t2str_gmt(zone.actual_offset(date)),0,66)		
		}
		else{
			ctx.fillText(zone.place.substr(0,15) + ' ' + t2str(zone.actual_offset(date)),0,66)
		}
		
		if (zone.lat != '' && zone.lng != ''){
			Pins.draw(ctx, -60, pin_y, 6, x_index);
		}
		
		ctx.rotate(-Math.PI/2);
		var scal = 0.35
		ctx.scale(scal,scal);
		ctx.shadowColor = "black";
		
		//background and border
		ctx.save();
		ctx.beginPath();
		var radgrad2 = ctx.createRadialGradient(0,0,0,0,0,150);
		radgrad2.addColorStop(0, "#fff");
		radgrad2.addColorStop(0.5, "#fff");
		radgrad2.addColorStop(1, "#bbb");
		ctx.fillStyle = radgrad2;
		ctx.lineWidth = 4;
		ctx.arc(0,0,150,0,Math.PI*2,true);
		ctx.fill();
		ctx.stroke();
		
		//ticks
		ctx.strokeStyle = "#444";
		ctx.lineWidth = 6;
		for (var i = 0;i<12;i++){
			ctx.beginPath();
			ctx.rotate(Math.PI/6);
			ctx.moveTo(120,0);
			ctx.lineTo(140,0);
			ctx.stroke();
		}
		ctx.restore();
		
		//hours
		ctx.save();
		ctx.shadowBlur = 6;
		ctx.shadowOffsetX  = 2;
		ctx.shadowOffsetY  = 2;
		ctx.rotate( hr*(Math.PI/6) + (Math.PI/360)*min + (Math.PI/21600)*sec )
		ctx.beginPath();
		ctx.fillStyle = '#000';
		ctx.moveTo(0,10);
		ctx.lineTo(90,0);
		ctx.lineTo(0,-10);
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.arc(0,0,10,0,Math.PI*2,true);
		ctx.fill();
		ctx.restore();
		
		//mintues
		ctx.save();
		ctx.shadowBlur = 6;
		ctx.shadowOffsetX  = 3;
		ctx.shadowOffsetY  = 3;
		ctx.rotate( (Math.PI/30)*min + (Math.PI/1800)*sec )
		ctx.beginPath();
		ctx.fillStyle = '#000';
		ctx.moveTo(0,10);
		ctx.lineTo(125,0);
		ctx.lineTo(0,-10);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
		
		//seconds
		ctx.save();
		ctx.shadowBlur = 6;
		ctx.shadowOffsetX  = 4;
		ctx.shadowOffsetY  = 4;
		ctx.rotate(sec * Math.PI/30);
		ctx.strokeStyle = "#D40000";
		ctx.lineCap = 'round';
		ctx.lineWidth = 8;
		ctx.beginPath();
		ctx.moveTo(-25,0);
		ctx.lineTo(-5,0);
		ctx.stroke();
		ctx.lineWidth = 4;
		ctx.beginPath();
		ctx.moveTo(-5,0);
		ctx.lineTo(110,0);
		ctx.stroke();
		ctx.restore();
		ctx.restore();
	}

	function drawsquare(grad){
		ctx.beginPath();
		var r = 10;
		ctx.fillStyle = grad;
		ctx.moveTo(r, -wh);
		ctx.arcTo(wh,  -wh,  wh,  wh, r);
		ctx.arcTo(wh,   wh, -wh,  wh, r);
		ctx.arcTo(-wh,  wh, -wh, -wh, r);
		ctx.arcTo(-wh, -wh,  wh, -wh, r);
		ctx.closePath();
		ctx.fill();
	}
}