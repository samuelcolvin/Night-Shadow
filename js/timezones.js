/*
Copyright (c) 2012 Samuel Colvin. All rights reserved.

Released under the creative commons Attribution-NonCommercial-ShareAlike 3.0 license (http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode). See main.js for details.

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING AND TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THIS EXCLUSION MAY NOT APPLY TO YOU.
*/
function TimeZones(then_finally){
	var zones = {};
	var max_index = 0;
	var dst_switches;
	context_load_local_json('dst_switch.json', function (switches){
		dst_switches = switches;
		context_load_local_json('timezones.json', function(newzones){
			recieve_zones(newzones);
		});
	});

	function recieve_zones(newzones) {
		for(key in newzones){
			var k = parseInt(key)
			newzones[key].origin = 'default list';
			newzones[key].dynamic = false;
			zones[k] = new Zone(newzones[key]);
			max_index = k > max_index ? k : max_index;
		}
		then_finally();
	}
	
	this.getzones = function(){
		return zones;
	}
	
	this.getzone = function(v){
		return zones[v];
	}

	this.get_from_name = function(name){
		name = name.toLowerCase();
		for(key in zones)
		{
			if (zones[key].name.toLowerCase() ==  name){
			return zones[key];
			}
		}
	}
	
	this.find_closest = function(lat, longit, tz, code){
		function get_distance(testing){
			var deltax = lat - testing.lat;
			var deltay = longit - testing.lng;
			return deltax * deltax + deltay * deltay;
		}
		
		var newzones = {};
		for (z in zones){
			if (zones[z].tz_now() == tz && zones[z].code == code){
				newzones[z]=zones[z];
			}
		}
		var min = 1E+1000;
		var closest, d;
		for(z in newzones){
			d = get_distance(newzones[z]);
			if (d < min){
				min = d;
				closest = newzones[z];
			}
		}
		return closest;
	}

	function exists(zone){
		for(k1 in zones){
			if (zones[k1].equals(zone)){
				return true;
			}
		}
		return false;
	}
		
	this.create_zone = function(zone_base){
		return new Zone(zone_base);
	}

	function Zone(zone){
		for(key in zone)
			this[key] = zone[key];
		
		if(typeof this.index ==  'undefined')
			this.index = -1;
		else
			this.index = parseInt(this.index);
		
		if (this.dst !=  '-')
			this.switch_str = dst_switches[this.dst_switch_code]['start_end'];
		
		if (this.origin == 'client tz')
			this.stamp = t2str_gmt(this.tz) + ', via ' + this.origin;
		else
			this.stamp = this.country + ', via ' + this.origin;
		
		this.tz_str = function(){
			return t2str_gmt(this.tz);
		}
		
		this.dst_str = function(){
			return t2str_gmt(this.dst);
		}
		
		this.actual_offset = function(date){
			if (this.dst !=  '-'){
				if(test_dst(date, this.switch_str)){
					return this.dst;
				}
			}
			return this.tz;
		}
		
		this.tz_now = function(){
			var date =  datetime.get_date();
			return this.actual_offset(date);
		}
		
		this.standard_date = function(date){
			var month = date.getMonth()+1;
			return time2str(date.getDate()) + '/' + time2str(month) + '/' + date.getFullYear();		
		}
		
		this.standard_short_date = function(date){
			var month = date.getMonth()+1;
			return time2str(date.getDate()) + '-' + time2str(month) + '-' + date.getFullYear();
		}
		
		this.date = function(){
			var date =  datetime.get_date();
			var offset = this.actual_offset(date, this);
			return datewithoffset(datetime.get_date(), offset);
		}
		
		this.dst_range = function(){
			var start = start_dst(this.switch_str);
			var end = end_dst(this.switch_str)
			if (start<end){
				return short_date(start) + ' to ' + short_date(end);
			}
			else{
				return 'ends ' + short_date(end) + ', starts ' + short_date(start);
			}
		}
		
		function short_date(date){
			var month = date.getMonth()+1;
			return day_name(date.getDay()) + ' ' + date.getDate() + '/' + month;
		}
		
		function day_name(day){
			var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];
			return days[day];
		}

		function test_dst(date, switch_str){
			var start = start_dst(switch_str);
			var end = end_dst(switch_str);
			return  (date>start && (date<end || start>end)) || (date<end && start>end);
		}

		function start_dst(switch_str){
			var startend = switch_str.split('/');
			var start = startend[0].split(',');
			return create_limit(start);
		}

		function end_dst(switch_str){
			var startend = switch_str.split('/');
			var end = startend[1].split(',');
			return create_limit(end);
		}

		function create_limit(limit){
			var lim_month = parseInt(limit[0]) - 1;
			var lim_week = parseInt(limit[1]);
			var lim_day = parseInt(limit[2]);
			var lim_hour = parseInt(limit[2]);
			var date = datetime.get_date()
			if (lim_week !=  -1){
					var datelimit = new Date(date.getFullYear(),lim_month,1,lim_hour);
					while(true){
					if (datelimit.getDay() ==  lim_day && Math.ceil(datelimit.getDate()/7) ==  lim_week){
						break;
					}
					datelimit.setDate(datelimit.getDate()+1);
				}
			}
			else{
				var datelimit = new Date(date.getFullYear(),lim_month,1,lim_hour);
				datelimit.setMonth(datelimit.getMonth() + 1);
				while(datelimit.getDay() !=  lim_day){
					datelimit.setDate(datelimit.getDate()+1);
				}
				datelimit.setDate(datelimit.getDate()-7);
			}
			return datelimit;
		}

		this.equals = function(zone){
			diff = false;
			for(k in this){
				if (typeof zone[k] ==  'undefined'){
					return false;
				}
				if (zone[k] !=  this[k]){
					return false;
				}
			}
			return true;
		}
	}
}

function datewithoffset(date, offset){
	date.setMinutes(date.getMinutes() + date.getTimezoneOffset() + offset * 60);
	return date;
}
		
function time_short(date){
	return time2str(date.getHours()) + ":" + time2str(date.getMinutes());
}

function t2str_gmt(t){
	if (t ==  '-'){ return t; }
	return 'GMT'+t2str(t);
}

function t2str(t){
	if (t ==  '-'){ return t; }
	var neg = t<0;
	var h_abs = Math.floor(Math.abs(t));
	var mins = (Math.abs(t) - h_abs) * 60;
	var str = time2str(h_abs);
	if(mins>0)
	{
		str+= ':' + time2str(mins);
	}
	if (neg){
	return '-'+str;
	}
	return '+'+str;
}

function time2str(number){
	if (number > 9){ return number.toString(); }
	else{ return '0' + number; }
}