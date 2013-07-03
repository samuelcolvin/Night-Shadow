/*
Copyright (c) 2012 Samuel Colvin. All rights reserved.

Released under the creative commons Attribution-NonCommercial-ShareAlike 3.0 license (http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode). See main.js for details.

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING AND TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THIS EXCLUSION MAY NOT APPLY TO YOU.
*/
function get_location(after){
	var zone = {};
	zone.tz = datetime.user_tz;
	zone.you = true;
	zone.comment = 'Location Unknown';
	zone.place = '';
	zone.country = 'Unknown';
	zone.code = '';
	zone.name = '';
	zone.dst = '-';
	zone.dst_switch_code = '-';
	zone.lat = '';
	zone.lng = '';
	zone.origin = 'client tz';
	zone.dynamic = true;
	user_zone = tzones.create_zone(zone);
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(geolocation_found, no_geolocation);
	}
	else{
		About.con_log('No geolocation.');
		ip2loc();
	}

	function no_geolocation(error){
		var html5_error = 'unknown error';
		switch(error.code){
			case error.TIMEOUT:
				html5_error = 'Timeout'; break;
			case error.POSITION_UNAVAILABLE:
				html5_error = 'Position unavailable'; break;
			case error.PERMISSION_DENIED:
				html5_error = 'Permission denied'; break;
		}
		About.con_log('Error getting location from HTML5 Geolocation: ' + html5_error);
		ip2loc();
	}
	
	function geolocation_found(position){
		About.con_log('Geolocation found.');
		location_found_get_tz(position.coords.latitude, position.coords.longitude, 'Geolocation', 'Your location based Goelocation coordinates.', true, true)
	}

	function ip2loc(){		
		About.con_log('Attempting to get location from IP address:');
		var ipinfo_key = '1dab15d1883f899e99177a4ef46dad3bfe800fb41ebc94267e3cbbb33a968475';
		load_json('http://api.ipinfodb.com/v3/ip-city/?key=' + ipinfo_key + '&format=json', 
			function(result){
				if (result.statusCode == 'OK') {
					About.con_log('IP location found.');
					About.set('ip', result.ipAddress);
					location_found_get_tz(parseFloat(result.latitude), parseFloat(result.longitude), 'ip2location', 'Your location based on IP address.', false, false)
				}
				else {
					About.con_log('IP to location server error: ' + result.statusCode);
				}
			}, 
			function(error){
				About.con_log('IP to location server error: connection not established.');
				after();
			}
		);
	}
	
	function location_found_get_tz(lat, lng, origin, comment, give_alert, search_close){
		function wait(){
			if(reverse_geo_finished)
				location_found(lat, lng, origin, comment, give_alert, search_close);
			else
				setTimeout(wait,200);
		}
		wait();
	}
		
	function location_found(lat, lng, origin, comment, give_alert, search_close){
		var tz = reverse_geo.get_data(lat, lng);
		About.set('lat', lat.toFixed(3));
		About.set('long', lng.toFixed(3));
		var zone_found;
		if (tz >= 100) {
			zone_found = tzones.getzone(tz - 100);
			if (zone_found.tz_now() != datetime.user_tz) {
				if (give_alert)
					alert('Your Timezone does not match the ' + origin + ' Timezone, your computer\'s time maybe be wrong.')
				About.con_log('Time zone from ' + origin + ' is different from your computer\'s time zone - not using ' + origin + '.');
				after();
				return;
			}
			user_zone = {};
			for (i in zone_found)
				user_zone[i] = zone_found[i];
		}
		else{
			About.con_log('No accurate timezone information available for this latitude and longitude.');
		}
		user_zone.index = -1;
		user_zone.origin = origin;
		user_zone.comment = comment;
		user_zone.dynamic = true;
		user_zone.lat = lat;
		user_zone.lng = lng;
		user_zone = tzones.create_zone(user_zone);
		after();
		load_json('http://api.geonames.org/findNearbyPlaceNameJSON?lat='
		+ lat + '&lng=' + lng + '&username=scolvin', found, not_found);
		
		function found(result){
			if ('status' in result) 
				About.con_log('Unable to convert ' + origin + ' coordinates to a place: ' + result.status.message);
			else {
				user_zone.code = result.geonames[0].countryCode;
				user_zone.country = result.geonames[0].countryName;
				if (search_close) {
					user_zone.place = result.geonames[0].name.replace('City of', '');
				}
				About.set('city', user_zone.place);
				user_zone = tzones.create_zone(user_zone);
				About.con_log('Success finding location from ' + origin + '.');
				after();
			}
		}
		
		function not_found(result){
			about.con_log('Failed to find location information from Geonames.');
		}
	}
}

function ReverseGeo(){
	var data = 0;
	var el_data = document.getElementById('data');
	var el_pos = document.getElementById('live_pos');
	var el_tz = document.getElementById('live_tz');
	var el_time = document.getElementById('live_time');
	var el_palce = document.getElementById('live_place');
	var el_country = document.getElementById('live_county');
	
	context_load_local_json('reverse_geo.json', 
		function (result){
			data = result;
			reverse_geo_finished = true;
			document.getElementById('map').onmousemove = reverse_geo.mouse_moving;
			document.getElementById('map').onmouseout = reverse_geo.clear;
			document.getElementById('data').onmousemove = reverse_geo.mouse_moving;
			for(var i=0; i < 6; i++)
				document.getElementById('pin' + i).onmousemove = reverse_geo.mouse_moving;	
		}
	);
		
	var mouse_cal = false;
	var stopper1 = 0;
	var stopper2 = 0;
	
	this.clear = function(e){
		set_most('', '', '', '', '');
	}
	
	this.get_data = function(lat, lng){
		return data[(Math.round(lng) + 180) * 1000 + Math.round(lat) + 100];
	}
	
	this.mouse_moving = function(e){
		if (mouse_cal) return;
		mouse_calc = true;
		fade_out();
		el_data.style.opacity = 1;
		var x = e.clientX - dn_map.canvas.offsetLeft;
		var y = height - e.clientY;
		var latlng = xy2latlong(x, y);
		var tz = reverse_geo.get_data(latlng[0], latlng[1]);
		var pos = latlng[0].toFixed(2) + 'N,' + latlng[1].toFixed(2) + 'E';
		if (typeof tz != 'undefined'){
			if (tz > 100){
				var zone = tzones.getzone(tz - 100);
				var offset = zone.tz_now();
				var tz = t2str_gmt(offset);
				if (offset != zone.tz)
					tz += ' (DST)'
				set_most(pos, tz, time_short(zone.date()), zone.place, zone.country);
			}
			else
				set_most(pos, t2str_gmt(tz), time_short(datewithoffset(datetime.get_date(), tz)), '', '');
		}
		else
			set_most(pos, '', '', '', '');
		mouse_cal = false;
	}
	
	function fade_out(){
		clearInterval(stopper1);
		clearInterval(stopper2);
		var op=1;
		stopper1 = setTimeout(function(){stopper2 = setInterval(reduce, 70)}, 3000);
		function reduce(){
			if (op < 0){
				clearInterval(stopper2);
				return;
			}
			op -=0.05;
			el_data.style.opacity = op;
		}
	}
	
	function set_most(pos, tz, time, place, country){
		el_pos.innerHTML = pos;
		el_tz.innerHTML = tz;
		el_time.innerHTML = time;
		el_palce.innerHTML = place;
		el_country.innerHTML = country;
	}

	function xy2latlong(x, y){
		var lng = x / width * 360 - 180;
		var lat = (y / height - 0.5) * 180;
		return [lat, lng];
	}
}

yahoo_key = 'dj0yJmk9aHRobXR4dGJZWGhLJmQ9WVdrOWNrUkVUREJQTkdVbWNHbzlNVFV4TWpZd09EQTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD1kMg--'

function request_zone(search_string, success, failure){
	var onload = function(result){
		try{
			if (result.ResultSet.Error ==   0){
				if (result.ResultSet.Found > 0){
					request2zone(result.ResultSet.Results[0], search_string, success);
				}
				else{
					failure('no results found');
				}
			}else{
				failure(result.ResultSet.ErrorMessage);
			}
		}
		catch(error){
			failure(error);
		}
	};
	var onerror = function(error){
		failure('Search Failed: connection not established.');
	};
	load_json(
		'http://where.yahooapis.com/geocode' +
		'?location=' + search_string +
		'&flags=JT' +
		'&appid=' + yahoo_key,
		onload,
		onerror);

	function request2zone(result, search_string, after){
		try {
			var zone = {};
			zone.code = result.countrycode;
			zone.name = result.timezone;
			if(zone.name ==   ''){
				zone.tz = 0;
				zone.dst = '-';
				zone.dst_switch_code = '-';
			}
			else{
				var similar = tzones.get_from_name(zone.name);
				zone.tz = similar.tz;
				zone.dst = similar.dst;
				zone.dst_switch_code = similar.dst_switch_code;
			}
			zone.place = normal_caps(search_string.split(',')[0]);
			zone.country = result.line4;
			zone.lat = result.latitude;
			zone.lng = result.longitude;
			zone.comment = zone.name.replace('/', ', ').replace('_', ' ') + ' (near ' + result.city + ')';
			zone.origin = 'Yahoo PlaceFinder';
			zone.dynamic = false;
			var zone = tzones.create_zone(zone);
			after(zone);
		}
		catch(error) {
			after(error.toString());
		}
	}
}

var Pins = Pins || {};

Pins.insert = function(lat, longit, index){
	pin_size = 4;
	var latlong = {'lat': lat, 'lng': longit};
	latlong = latlong2xy(latlong);
	
	var canvas = document.getElementById('pin'+index);
	canvas.style.display = 'block';
	canvas.width = pin_size*2;
	canvas.height = pin_size*2;
	canvas.style.top = latlong.y + 'px';
	canvas.style.left = latlong.x + 'px';
	
	var ctx = canvas.getContext('2d');
	Pins.draw(ctx, pin_size, pin_size, pin_size, index);

	function latlong2xy(latlong){
		var x = latlong.lng/360-0.5;
		if (x<0)
			x+= 1.0;
		x = dn_map.canvas.offsetLeft+x*width - pin_size;
		latlong['x'] = x;
		var y = latlong.lat/90;
		y = 0.5 - y/2;
		y = y*height - pin_size;
		latlong['y'] = y;
		return latlong;
	}
}
	

Pins.draw = function(ctx, x, y, size, index){
	colors = ['255, 0, 0', '255, 255, 255', '80, 80, 255', '0, 255, 0', '255, 255, 0', '255, 0, 255'];
	ctx.save();
	var c = colors[index];
	var lingrad = ctx.createLinearGradient(x-size, y-size, x+size, y+size);
	lingrad.addColorStop(0.2,   'rgba(' + c + ', 1)');
	lingrad.addColorStop(0.9,   'rgba(' + c + ', 0)');
	var radgrad = ctx.createRadialGradient(y,y,0,x,y,size);
	radgrad.addColorStop(0, 'rgba(' + c + ', 1)');
	radgrad.addColorStop(1, 'rgba(0, 0, 0, 1)');

	ctx.beginPath();
	ctx.fillStyle = radgrad;
	ctx.arc(x,y,size,0,Math.PI*2,true);
	ctx.fill();
	ctx.beginPath();
	ctx.fillStyle = lingrad;
	ctx.arc(x,y,size,0,Math.PI*2,true);
	ctx.fill();
	ctx.restore();
}

Pins.clear = function() {
	for (var i = 0;i<max_clocks;i++){
		var element = document.getElementById('pin'+i);
		element.style.top =  '0px';
		element.style.left =  '0px';
		element.style.display = 'none';
	}
}


function normal_caps(string){
	var newstr='';
	for(cha in string){
		if (cha == 0){
			newstr += string[cha].toUpperCase();
		}
		else{
			if (string[cha - 1] == ' '){
				newstr += string[cha].toUpperCase();				
			}
			else{
				newstr += string[cha].toLowerCase();				
			}
		}
	}
	return newstr;
}