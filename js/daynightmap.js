/*
Copyright (c) 2012 Samuel Colvin. All rights reserved.

Released under the creative commons Attribution-NonCommercial-ShareAlike 3.0 license (http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode). See main.js for details.

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING AND TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THIS EXCLUSION MAY NOT APPLY TO YOU.
*/
var daynightmap_stopper = 0;
var dn_day, dn_night, dn_month;
function DayNightMap(){
	this.canvas = document.getElementById('map');
	var ctx = this.canvas.getContext("2d");
	this.canvas.setAttribute('width', width);
	this.canvas.setAttribute('height', height);
	var solid, date;
	var filenames={};
	running = false;
	// var t1;
	
	this.get_array = function(new_date) {
		date = new_date;
		var ddc = new DuskDawnCurve();
		return ddc.curve;
	}

	this.daynight = function() {
		clearInterval(daynightmap_stopper);
		draw();
		if (datetime.rate > 0){
			var rate = !datetime.real && datetime.rate != 1 ? 1000 : 60000;
			daynightmap_stopper = setInterval(draw, rate);
		}
	}
	
	this.day = function(){
		draw_simple('day');
	}
	
	this.night = function(){
		draw_simple('night');
	}
	
	function draw_simple(name){
		date = datetime.get_date();
		set_filenames();
		clearInterval(daynightmap_stopper);
		if (typeof night != 'undefined'){
			if (name == 'day') ctx.drawImage(day, 0, 0, width, height); 
			else ctx.drawImage(night, 0, 0, width, height); 
		}
		else
			load_image(filenames[name], function (isday, img) { ctx.drawImage(img, 0, 0, width, height); });	
	}
	
	function set_filenames(){
		dn_month = datetime.month();
		filenames['day'] = context_image_dir('month' + dn_month + '.jpg');
		filenames['night'] = context_image_dir('night.jpg');
	}

	function load_image(src, onload) {
		var img = new Image;
		img.onload = function(){
			isday = this.src.indexOf('night.jpg') == -1
			img = this;
			onload(isday, img);
		}
		img.src = src;
		return img;
	}
	
	function draw(){
		// t1 = new Date();
		if (running) return;
		running = true;
		date = datetime.get_date();
		solid = DuskDawnCurve();
		
		var new_canvas = document.createElement('canvas');
		var buffer = new_canvas.getContext('2d');
		new_canvas.width = width;
		new_canvas.height = height;

		var night_canvas = document.createElement('canvas');
		var daynight = night_canvas.getContext('2d');
		night_canvas.width = width;
		night_canvas.height = height * 2;
		var loaded_images = 0;
		if (typeof night != 'undefined' && dn_month == datetime.month()){
			godraw(false, night);
			godraw(true, day);
		}
		else{
			set_filenames();
			load_image(filenames['day'], godraw);
			load_image(filenames['night'], godraw);
		}
		
		function godraw(isday, img){
			if (isday){
				daynight.drawImage(img, 0, 0, width, height);
				day = img;
			}
			else{
				daynight.drawImage(img, 0, height, width, height);
				night = img;
			}
			if (loaded_images == 0){
				if (!is_chrome_app())
					ctx.drawImage(img, 0, 0, width, height);
				loaded_images++;
				return;
			}
			var day_pix, delta, north, boundary, light, rgb, xx, yy;
			var daytime = true;
			var dusk = 8;
			var step =  40;
			ctx.clearRect(0, 0, width, height);
			
			for (var x = 0; x < width; x +=  step) {
				for (var s in solid)
					if (Math.round(solid[s].x) == x + Math.ceil(step/2)) {
						boundary = solid[s].y; 
						break;
					}
				for (var y = 0; y < height; y +=  step) {
					north = boundary - (y + Math.ceil(step/2));
					daytime = (north > 0 && summer) || (north < 0 && !summer);
					if (close(x, y, step + dusk)){
						day_pix = daynight.getImageData(x, y, step, step).data;
						rgb = daynight.getImageData(x, y + height, step, step);
						delta00 = get_delta(x, y);
						delta10 = get_delta(x + step, y);
						delta01 = get_delta(x, y + step);
						delta11 = get_delta(x + step, y + step);
						for (var z = 0; z < rgb.data.length; z += 4) {
							xx = (z % (step * 4) / 4) / step;
							yy = (Math.floor(z/(step * 4))) / step;
							delta = (1 - xx) * (1 - yy) * delta00 + xx * (1 - yy) * delta10
								+ (1 - xx) * yy * delta01 + xx * yy * delta11;
							light = 0.5 - delta / dusk / 2;
							light = light > 1 ? 1 : light;
							light = light < 0 ? 0 : light;
							for (var zz = z; zz < z + 4; zz++) {
								rgb.data[zz] = light * day_pix[zz] + (1 - light) * rgb.data[zz];
							}
						}
					}
					else if (daytime){
						rgb = daynight.getImageData(x, y, step, step);	
					}
					else{
						rgb = daynight.getImageData(x, y + height, step, step);
					}
					ctx.putImageData(rgb, x, y);
				}
			}
			new_canvas = null;
			night_canvas = null;
			running = false;
			// var t2 = new Date();
			// diff = t2 - t1;
			// alert(diff+'ms');
		}
	}
	
	function close(x, y, d){
		for (s in solid){
			if (Math.abs(solid[s].x - x) < d && Math.abs(solid[s].y - y) < d)
				return true;
		}
		return false;
	}
	
	function get_delta(x, y){
		if (x < Math.round(solid[0].x))
			var s = 0;
		else if (x > Math.round(solid[solid.length - 1].x))
			var s = solid.length - 1;
		else
			for(var s = x; s < solid.length - 1; s++)
				if (Math.round(solid[s].x) == x) break;
		var min = solid[s].y - y;
		var sign = min == 0 ? 1 : min / Math.abs(min);
		if (summer) sign *= -1;
		min *= min;
		var dx, dy, d;
		for(var xi = 0; xi < solid.length; xi++){
			if (xi < 0 || xi >= solid.length) continue;
			dy = solid[xi].y - y;
			dx = solid[xi].x - x;
			d = dx * dx + dy * dy;
			if (d < min) {
				min = d;
			}
		}
		return Math.sqrt(min) * sign;
	}

	function DuskDawnCurve() {
		this.summer = true;
		var utils = new Utils();
		
		var time = cal_to_jd('CE', date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), 
							date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
		var sunpos = new sunposition(time, false);
		if (sunpos.dec < 0.0)
			summer = false;
		var sunlong = utils.fixangle(180 + (sunpos.ra - (gmst(time) * 15)));
		var noon = Math.floor(sunlong * (width / 360));
		
		var curve = projillum(noon);
		curve.sort(compare_points);
		curve = steps(5);
		return solid_line();
		
		function projillum(noon) {
			var i, ilon, ilat, xt;
			var m, x, y, z, lon, lat, s, c;
			var ftf = true;
			var lilon = 0;
			var lilat = 0;
			s = Math.sin(-utils.dtr(sunpos.dec));
			c = Math.cos(-utils.dtr(sunpos.dec));
			var curve1 = [];
			for (var th = -(Math.PI / 2); th <=  Math.PI / 2 + 0.001; th +=  Math.PI / 100) {
				x = -s * Math.sin(th);
				y = Math.cos(th);
				z = c * Math.sin(th);
				lon = (!y && !x) ? 0 : utils.rtd(Math.atan2(y, x));
				lat = utils.rtd(Math.asin(z));
				ilat = Math.floor(height - (lat + 90) * (height / 180));
				ilon = Math.floor(lon * (width / 360));
				if (ftf) {
					lilon = ilon;
					lilat = ilat;
					ftf = false;
				}
				else {
					if (lilat == ilat) {
						curve1.push(pnt(2 * ((!ilon) ? 1 : ilon), (height - 1) - ilat));
					}
					else {
						m = ((ilon - lilon)) / (ilat - lilat);
						for (i = lilat; i !== ilat; i +=  utils.sgn(ilat - lilat)) {
							xt = (lilon + Math.floor((m * (i - lilat)) + 0.5));
							curve1.push(pnt(2 * ((!xt) ? 1 : xt), (height - 1) - i));
						}
					}
					lilon = ilon;
					lilat = ilat;
				}
			}
			var bothsides = [ -1, 1 ];
			var curve = [];
			for (var i = 0; i < curve1.length; i++) {
				for (var ii = 0; ii < bothsides.length; ii++) {
					var side = bothsides[ii];
					x = (noon + curve1[i].x / 2 * side + width) % width;
					if (x >=  0 && x < width) {
						curve.push(pnt(x, curve1[i].y));
						if (curve.length >= 2){
							var diff = curve[curve.length - 1].y - curve[curve.length - 2].y;
							if (Math.abs(diff)>5){
								console.log('x: '+curve[curve.length - 1].x + ', diff: '+diff);
							}
						}
					}
				}
			}
			return curve;
		}
		
		function steps(step) {
			var test = step * step;
			for (var i = 0; i < curve.length - 1;) {
				var dx = curve[i].x - curve[i + 1].x;
				var dy = curve[i].y - curve[i + 1].y;
				if (Math.sqrt(dx * dx + dy * dy) < test) {
					curve.splice(i + 1,1);
				}
				else if(dy > height * 0.9){
					curve[i].y -= height;
				}
				else if(dy < - height * 0.9){
					curve[i + 1].y -= height;
				}
				else {
					i++;
				}
			}
			return curve;
		}
		
		function solid_line() {
			var solid = [];
			var beh = 0;
			var inf = 0;
			var incr;
			for (var x = 0; x < width;) {
				if (curve[0].x > x) {
					solid.push(pnt(x, curve[0].y));
					x++;
				}
				else if (curve[curve.length - 1].x < x) {
					solid.push(pnt(x, curve[curve.length - 1].y));
					x++;
				}
				else if (curve[inf].x == x) {
					interp(curve[inf].x, curve[inf].y);
					beh = inf;
					inf++;
					if (inf < curve.length){
						while (curve[inf].x == curve[beh].x){
							incr = (curve[inf].y + curve[beh].y) / Math.abs(curve[inf].y + curve[beh].y);
							for(var yy = curve[beh].y; yy != Math.round(curve[inf].y); yy += incr){
								solid.push(pnt(x, yy));
							}
							beh = inf;
							inf++;
							if (inf == curve.length) break;
						}
					}
					x++;
				}
				else {
					interp(curve[inf].x, curve[inf].y);
					x = curve[inf].x;
				}
			}
			return solid;
		
			function interp(x2, y2){
				if (solid.length == 0){
					var x1 = curve[0].x;
					var y1 = curve[0].y;
				}
				else{
					var x1 = solid[solid.length - 1].x;
					var y1 = solid[solid.length - 1].y;
				}
				var dx = x2 - x1;
				var dy = y2 - y1;
				incr = Math.cos(Math.atan(dy / dx));
				for(var xx = x1 + incr; xx <= x2; xx += incr){
					solid.push(pnt(xx, y1 + dy / dx * (xx - x1)));
				}
			}
		}
		
		function gmst(jd) {
			var t, theta0;
			t = ((Math.floor(jd + 0.5) - 0.5) - 2415020) / utils.julianCentury;
			theta0 = 6.6460656 + 2400.051262 * t + 2.581E-05 * t * t;
			t = (jd + 0.5) - Math.floor(jd + 0.5);
			theta0 +=  (t * 24) * 1.002737908;
			theta0 = (theta0 - 24 * Math.floor(theta0 / 24));
			return theta0;
		}
		
		function compare_points(a, b) {
			if (a ==  null) {
				if (b ==  null) return 0;
				return -1;
			}
			else {
				if (b ==  null) {
					return 1;
				}
				var retval = a.x - b.x;
				if (!!retval) {
					return retval;
				}
				return a.y - b.y;
			}
		}
		
		//from http://www.onlineconversion.com/julian_date.htm, thanks online conversion people.
		function cal_to_jd(era, y, m, d, h, mn, s)
		{
			var jy, ja, jm;
			if( y == 0 ) {
				alert("There is no year 0 in the Julian system!"); return 0;
			}
			if( y == 1582 && m == 10 && d > 4 && d < 15 ) {
				alert("The dates 5 through 14 October, 1582, do not exist in the Gregorian system!"); return 0;
			}
			if( era == "BCE" ) y = -y + 1;
			if( m > 2 ) {
				jy = y;
				jm = m + 1;
			} else {
				jy = y - 1;
				jm = m + 13;
			}
			var intgr = Math.floor( Math.floor(365.25*jy) + Math.floor(30.6001*jm) + d + 1720995 );
			//check for switch to Gregorian calendar
			var gregcal = 15 + 31*( 10 + 12*1582 );
			if( d + 31*(m + 12*y) >= gregcal ) {
				ja = Math.floor(0.01*jy);
				intgr += 2 - ja + Math.floor(0.25*ja);
			}
			//correct for half-day offset
			var dayfrac = h/24.0 - 0.5;
			if( dayfrac < 0.0 ) {
				dayfrac += 1.0;
				--intgr;
			}
			//now set the fraction of a day
			var frac = dayfrac + (mn + s/60.0)/60.0/24.0;
			//round to nearest second
			var jd0 = (intgr + frac)*100000;
			var jd  = Math.floor(jd0);
			if( jd0 - jd > 0.5 ) ++jd;
			return jd/100000;
		}
	}

	function sunposition(jd, apparent) {
		var utils = new Utils();
		var t = (jd - 2415020) / utils.julianCentury;
		var t2 = t * t;
		var t3 = t2 * t;
		var l = utils.fixangle(279.69668 + 36000.76892 * t + 0.0003025 * t2);
		var m = utils.fixangle(358.47583 + 35999.04975 * t - 0.00015 * t2 - 3.3E-06 * t3);
		var e = 0.01675104 - 4.18E-05 * t - 1.26E-07 * t2;
		var ea = kepler(m, e);
		var v = utils.fixangle(2 * utils.rtd(Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(ea / 2))));
		var theta = l + v - m;
		var eps = obliqeq(jd);
		if (apparent) {
			var omega = utils.fixangle(259.18 - 1934.142 * t);
			theta = theta - 0.00569 - 0.00479 * Math.sin(utils.dtr(omega));
			eps +=  0.00256 * Math.cos(utils.dtr(omega));
		}
		this.slong = theta;
		this.rv = (1.0000002 * (1 - e * e)) / (1 + e * Math.cos(utils.dtr(v)));
		this.ra = utils.fixangle(utils.rtd(Math.atan2(Math.cos(utils.dtr(eps)) * Math.sin(utils.dtr(theta)), Math.cos(utils.dtr(theta)))));
		this.dec = utils.rtd(Math.asin(Math.sin(utils.dtr(eps)) * Math.sin(utils.dtr(theta))));

		function obliqeq(jd) {
			var J2000 = 2451545;
			var oterms = [ as(-4680.93), as(-1.55), as(1999.25), as(-51.38), as(-249.67), as(-39.05), as(7.12), as(27.87), as(5.79), as(2.45) ];
			var eps = 23 + (26 / 60) + (21.448 / 3600), u, v;
			var i;
			v = u = (jd - J2000) / (utils.julianCentury * 100);
			if (Math.abs(u) < 1) {
				for (i = 0; i < 10; i++) {
					eps +=  oterms[i] * v;
					v *= u;
				}
			}
			return eps;
		}

		function kepler(m, ecc) {
			var e, delta;
			var EPSILON = 1E-06;
			e = m = utils.dtr(m);
			do {
				delta = e - ecc * Math.sin(e) - m;
				e -=  delta / (1 - ecc * Math.cos(e));
			} while (Math.abs(delta) > EPSILON);
			return e;
		}

		function as(x) {
			return x / 3600;
		}
	}
	
	function pnt(x, y){
		return {'x': x, 'y': y};
	}

	 function Utils() {
		this.julianCentury = 36525;
		this.dtr = function(x) {
			return x * (Math.PI / 180);
		}

		this.rtd = function(x) {
			return x / Math.PI * 180;
		}

		this.sgn = function(x) {
			return (x < 0) ? -1 : ((x > 0) ? 1 : 0);
		}

		this.fixangle = function(a) {
			return a - 360 * Math.floor(a / 360);
		}
	}
}