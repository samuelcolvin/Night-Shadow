/*
Copyright (c) 2012 Samuel Colvin. All rights reserved.

Released under the creative commons Attribution-NonCommercial-ShareAlike 3.0 license (http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode)

Source available at www.scolvin.com/nightshadow/source.

You are free:
to Share — to copy, distribute and transmit the work
to Remix — to adapt the work

Under the following conditions:
Attribution — You must attribute the work in the manner specified by the author or licensor (but not in any way that suggests that they endorse you or your use of the work).
Noncommercial — You may not use this work for commercial purposes.
Share Alike — If you alter, transform, or build upon this work, you may distribute the resulting work only under the same or similar license to this one.

With the understanding that:
Waiver — Any of the above conditions can be waived if you get permission from the copyright holder.
Public Domain — Where the work or any of its elements is in the public domain under applicable law, that status is in no way affected by the license.
Other Rights — In no way are any of the following rights affected by the license:
Your fair dealing or fair use rights, or other applicable copyright exceptions and limitations;
The author's moral rights;
Rights other persons may have either in the work itself or in how the work is used, such as publicity or privacy rights.
Notice — For any reuse or distribution, you must make clear to others the license terms of this work. The best way to do this is with a link to this web page.

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING AND TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THIS EXCLUSION MAY NOT APPLY TO YOU.
*/

var width;
var height;
var Clocks;
var tzones;
var dn_map;
var datetime;
var user_zone;
var _gaq = _gaq || [];
var new_zones = true;
var reverse_geo;
var reverse_geo_finished = false;
var max_clocks = 6;

addEventListener('submit', send, false);function send(evt){evt.preventDefault();}

function start(){
	start_analytics();
	datetime = new DateTime(true);
	tzones = new TimeZones(function(){
		update();
		reverse_geo = new ReverseGeo();
		Clocks = new ClockSet();
		get_location(draw_clocks_pins);
	});
}

function start_analytics(){
	_gaq.push(['_setAccount', 'UA-28196400-1']);
	_gaq.push(['_trackPageview']);
	(function() {
		var ga = document.createElement('script'); 
		ga.type = 'text/javascript'; 
		ga.async = true;
		ga.src = 'https://ssl.google-analytics.com/ga.js'
		if (is_chrome_app()) ga.src = 'js/ga.js';
		var s = document.getElementsByTagName('script')[0]; 
		s.parentNode.insertBefore(ga, s);
	})();
	_gaq.push(['_trackEvent', 'app', 'type', app_type()]);
}

function update(func){
	if (typeof func == 'undefined')
		func = stor_get_im_type();
	else
		stor_set_im_type(func);
	btn_off();
	width = innerWidth;
	height = Math.round(width/2);
	if(height>innerHeight){
		height = innerHeight;
		width = height*2;
	}
	dn_map = new DayNightMap();
	dn_map[func]();
	if (typeof Clocks != 'undefined')
		draw_clocks_pins();
}

function draw_clocks_pins(){
	function draw_clock_pin(zone, z){
		if (new_zones)
			_gaq.push(['_trackEvent', 'app', 'clock_stamp', zone.stamp]);
		Clocks.setup(zone);
		if (zone.lat != '' && zone.lng != ''){
			Pins.insert(zone.lat, zone.lng, z);
		}
	}
	
	Clocks.clear();
	Pins.clear();
	if (stor_check_empty())
		draw_clock_pin(user_zone, 0);
	else{
		for (var i = 1;i<= max_clocks;i++){
			var id = 'c' + i;
			if (!stor_check(id)){
				break;
			}
			var zone = stor_get(id);
			draw_clock_pin(zone, i - 1);
		}
	}
	new_zones = false;
}

function btn_on(){
	document.getElementById('button').style.opacity = 1;
	document.getElementById('button').style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
}

function btn_off(){
	document.getElementById('button').style.opacity = 0.5;
	document.getElementById('button').style.backgroundColor = 'rgba(255, 255, 255, 0)';
}
