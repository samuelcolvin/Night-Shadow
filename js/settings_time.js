/*
Copyright (c) 2012 Samuel Colvin. All rights reserved.

Released under the creative commons Attribution-NonCommercial-ShareAlike 3.0 license (http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode). See main.js for details.

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING AND TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THIS EXCLUSION MAY NOT APPLY TO YOU.
*/
function SettingsTime(){
	this.update_dt = function(){
		var dt_parser = new parse_time_date();
		valid_start = dt_parser.valid;
		var time_el = document.getElementById('calc_date_time');
		var str = '';
		rate = 0;
		var radio = document.getElementsByName("rate");
		for(r in radio){
			if (radio[r].checked){
				rate = parseInt(radio[r].value);
				break;
			}
		}
		document.getElementById('calc_rate').innerHTML = rate;
		clearInterval(stopper);
		if (valid_start){
			start_date = dt_parser.the_date;
			str = start_date.toString();
			str = str.substr(0, str.indexOf('GMT')-1);
			datetime_temp.set_time_virtual(start_date, rate);
			live_time();
			stopper = setInterval(live_time, 1000);
		}
		else{
			document.getElementById('live_virtual_time').innerHTML = '';
		}
		document.getElementById('calc_date_time').innerHTML = str;
	}

	this.create_time_buttons = function(){
		var virt = create_button('settings_time.load_virtual()', 'Virtual Time');
		var real = create_button("settings_time.load_real('daynight')", 'Real Time Day & Night');
		var day = create_button("settings_time.load_real('day')", 'Real Time Day');
		var night = create_button("settings_time.load_real('night')", 'Real Time Night');
		var buttons = [day, night, real, virt];
		return buttons;
	}

	this.load_virtual = function(){
		if (!valid_start)
			return
		start_date.setMinutes(start_date.getMinutes() - start_date.getTimezoneOffset() - zone.actual_offset(start_date) * 60);
		datetime.set_time_virtual(start_date, rate);
		close_settings();
		update('daynight');
	}

	this.load_real = function(func){
		datetime.set_time_real();
		close_settings();
		update(func);
	}
	
	this.clear = function(){
		clearInterval(stopper);	
	}

	function live_time(){
		var str = datetime_temp.get_date().toString();
		document.getElementById('live_virtual_time').innerHTML = str.substr(0, str.indexOf('GMT')-1);
	}

	function parse_time_date(){
		var date = document.getElementById('date_input').value;
		var time_element = document.getElementById('time_input');
		var time = time_element.value;
		time = time.toLowerCase().trim();
		var pmadd = time.indexOf('pm') !=  -1;
		time = time.replace('pm', '').replace('am', '');
		var spliton = ':';
		if (time.indexOf(':') !=  -1){}
		else if (time.indexOf(';') !=  -1)
			spliton = ';';
		else if (time.indexOf('-') !=  -1)
			spliton = '-';
		else if (time.indexOf('.') !=  -1)
			spliton = '.';
		else if (time.length == 4)
			time = time.substr(0,2)+':'+time.substr(2);
		
		var time_s = time.split(spliton);
		var hours = i(time_s[0]);
		if (pmadd) { hours += 12; }
		var date_s = date.split('/');
		this.the_date = new Date(i(date_s[2]), i(date_s[1]) - 1, i(date_s[0]), hours, i(time_s[1]));
		if (time_s.length>2)
			this.the_date.setSeconds(parseFloat(time_s[2], 10));
		this.valid = !isNaN(this.the_date.getTime());
		time_element.value = time2str(this.the_date.getHours()) + ':' + time2str(this.the_date.getMinutes());
		if (this.the_date.getSeconds()>0)
			time_element.value += ':' + time2str(this.the_date.getSeconds())
		
		function i(s){
			return parseInt(s, 10)
		}
	}
	
	var stopper;
	var datetime_temp;
	if (stor_check_empty())
		var zone = user_zone;
	else
		var zone = stor_get('c1');
	var date = zone.date();
	var start_date;
	var valid_start;
	var rate;
	document.getElementById('time_input').value = time_short(date);
	document.getElementById('date_input').value = zone.standard_date(date);
	document.getElementById('primary_tz').innerHTML = t2str_gmt(zone.actual_offset(date));
	datetime_temp = new DateTime(false);
	this.update_dt();
}




