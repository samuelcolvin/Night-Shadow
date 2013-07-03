/*
Copyright (c) 2012 Samuel Colvin. All rights reserved.

Released under the creative commons Attribution-NonCommercial-ShareAlike 3.0 license (http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode). See main.js for details.

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING AND TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THIS EXCLUSION MAY NOT APPLY TO YOU.
*/
var clocks;
var spinner;
var selected_index;
var selected_index_before;
var custom_zones;
var special_key_user = 1000;

function load_clock_settings(){
		selected_index_before = {};
		selected_index = {};
		custom_zones = {};
		custom_zones_before = {};
		clocks = 0;
		if (stor_check_empty()){
			clocks++;
			var id = 'c1';
			selected_index[id] = special_key_user;
			document.getElementById(id+'_div').style.display = 'block';
			for(var i = 2;i<= max_clocks;i++){
				var id = 'c' + i;
				document.getElementById(id+'_div').style.display = 'none';				
			}
		}
		else{
			for(var i = 1;i<= max_clocks;i++){
				var setto = 'none';
				var id = 'c' + i;
				if (stor_check(id)){
					clocks++;
					setto = 'block';
					var settings = stor_get(id);
					selected_index[id] = settings['index'];
					if (selected_index[id] == -1) {
						if (settings.dynamic) 
							selected_index[id] = special_key_user;
						else {
							custom_zones[id] = settings;
							document.getElementById(id + '_tb_search').value = settings.place;
							enable_search_select(id, 'search');
						}
					}
				}
				document.getElementById(id+'_div').style.display = setto;
			}
		}
		fill_selects();
		if (clocks == 1)
			document.getElementById('remove_clock').style.color = '#888';
}

function create_clocks_buttons(){
	var save = create_button('save()', 'Save')
	var buttons = [save];
	return buttons;
}
	
function create_button(func, text){
	var btn = document.createElement('input');
	btn.setAttribute('type', 'button');
	btn.setAttribute('onclick', func);
	btn.setAttribute('value', text);
	return btn;
}

var current_id;
var searching = false;
function search(id){
	try{
		if (!searching){
			searching = true;
			spinner = new Spinner(id + '_spinner',20);
			current_id = id;
			request_zone(document.getElementById(id + '_tb_search').value, found_zone, failed);
		}
	}
	catch(error){
		searching = false;
		failed(error);
	}
}

function found_zone(zone){
	if (typeof zone ==  'string'){
		failed(zone);
		return;
	}
	try{
		selected_index[current_id] = -1;
		custom_zones[current_id] = zone;
		set_clock_settings(current_id, zone);
		spinner.stop();
		searching = false;
	}
	catch(error){
		failed(error);
	}
}

function failed(error){
	alert(error);
	searching = false;
	if (typeof spinner != 'undefined'){
		spinner.stop();
	}
}

function fill_selects(){
	var options = new Array();
	var option = null;
	var zones = tzones.getzones()
	for(key in zones)
	{
		option = {'key': key, 'tz': zones[key].tz};
		option['text'] = zones[key].place + ', ' + zones[key].country + ' (' + zones[key].tz_str() + ')';
		options.push(option);
	}
	options.sort( function (a,b){
		return parseFloat(a.tz)-parseFloat(b.tz);
	});
	option = {'key': special_key_user};
	option['text'] = 'Your Location: ' + user_zone.place + ', ' + user_zone.country + ' (' + user_zone.tz_str() + ')';
	options.splice(0,0,option);	
	
	option = {'key': 0, 'text': ''};
	options.splice(0,0,option);
	var the_option;
	var the_text;
	for(var i = 1;i<= max_clocks;i++){
		var id = 'c' + i;
		var id_select = id+'_select';
		var select = document.getElementById(id_select);
		select.options.length = 0;
		for(o in options)
		{
			the_option = document.createElement('option');
			the_text = document.createTextNode(options[o]['text']);
			the_option.appendChild(the_text);
			the_option.setAttribute('value', options[o]['key']);
			select.appendChild(the_option);
		}
		if (typeof selected_index[id] !=  'undefined' && selected_index[id] !=  -1){
			select.value = selected_index[id];
			sel_changed(id);
		}
	}
}

function add_clock(){
	if (clocks<max_clocks){
		clocks++;
		document.getElementById('c'+clocks+'_div').style.display = 'block';
	}
	if (clocks == max_clocks){
		document.getElementById('add_clock').style.color = '#888';
	}
	document.getElementById('remove_clock').style.color = '#fff';
}

function remove_clock(){
	var id = 'c'+clocks;
	if (clocks>1){
		document.getElementById(id+'_div').style.display = 'none';
		selected_index[id] = 0;
		custom_zones[id] = null;
		selected_index_before[id] = 0;
		custom_zones_before[id] =  null;
		document.getElementById(id+'_select').value = 0;
		clocks--;
	}
	if (clocks == 1)
		document.getElementById('remove_clock').style.color = '#888';
	document.getElementById('add_clock').style.color = '#fff';
}

function sel_changed(id){
	var v = document.getElementById(id + '_select').value;
	selected_index[id] = parseInt(v);
	if (parseInt(v) == special_key_user){
		var zone = user_zone;
	}
	else{
		zone = tzones.getzone(v);
	}
	set_clock_settings(id, zone);
}

function set_clock_settings(clock, zone){
	if(typeof zone ==  'undefined'){
		var place = '';
		var tz = '';
		var country = '';
		var dst = '';
		var comment = '';
		var loc = '';
		var source = '';
	}
	else{
		var place = zone.place;
		var tz = zone.tz_str();
		var country = zone.country;
		var dst = zone.dst_str();
		if (dst !=  '-'){
			dst+= ' (' + zone.dst_range() + ')';
		}
		var comment = zone.comment;
		var loc = "Lat: " + parseFloat(zone.lat).toFixed(3) + ", Long: " + parseFloat(zone.lng).toFixed(3);
		var source = zone.origin;
	}
	document.getElementById(clock+'_place').innerHTML = place;
	document.getElementById(clock+'_timezone').innerHTML = tz;
	document.getElementById(clock+'_country').innerHTML = country;
	document.getElementById(clock+'_dst').innerHTML = dst;
	document.getElementById(clock+'_dst').title = dst;
	document.getElementById(clock+'_comment').innerHTML = comment;
	document.getElementById(clock+'_comment').title = comment;
	document.getElementById(clock+'_location').innerHTML = loc;
	document.getElementById(clock+'_source').innerHTML = source;
}

function save(){
	for(var i = 1;i<= max_clocks;i++){
		var id = 'c' + i;
		if (typeof selected_index[id] !=  'undefined' && selected_index[id] != 0){
			var v = selected_index[id];
			if (v == special_key_user) 
				 var zone = 'user_zone';
			else{
				if (v == -1) 
					var zone = custom_zones[id];
				else 
					var zone = tzones.getzone(v);
			}
			stor_add2(id, zone);
		}
		else
			stor_removefrom(id);
	}
	new_zones = true;
	draw_clocks_pins();
	close_settings();
}

var selected_index_before;
var custom_zones_before;
function enable_search_select(id, type){
	if (type ==  'select' && document.getElementById(id + '_select').disabled){
		document.getElementById(id + '_tb_search').disabled = true;
		document.getElementById(id + '_btn_search').disabled = true;
		document.getElementById(id + '_select').disabled = false;
		document.getElementById(id + '_rd_select').checked = true;
		if (selected_index[id] ==  -1){
			document.getElementById(id + '_select').value = 0;
			set_clock_settings(id);
		}
		else{
			document.getElementById(id + '_select').value = selected_index_before[id];
			set_clock_settings(id, tzones.getzone(selected_index_before[id]));
		}
	}
	else if (type ==  'search' && document.getElementById(id + '_tb_search').disabled){
		selected_index_before[id] = document.getElementById(id + '_select').value;
		if (selected_index[id] ==  -1){
			custom_zones_before[id] =  custom_zones[id];
		}
		document.getElementById(id + '_select').value = 0;
		document.getElementById(id + '_select').disabled = true;
		document.getElementById(id + '_tb_search').disabled = false;
		document.getElementById(id + '_btn_search').disabled = false;
		document.getElementById(id + '_rd_search').checked = true;
		set_clock_settings(id, custom_zones[id]);
	}
}

function Spinner(canvas_name, size){
	var rate = 70;
	var angles = [-Math.PI/8, 7 * Math.PI/8];
	var so2 = size/2;
	var line_width = 2;
	var speed = 0.15;
	var max_speed = 1;
	var arc = Math.PI/4;
	var canvas_sp = document.getElementById(canvas_name);
	canvas_sp.width = size;
	canvas_sp.height = size;
	var ctx_sp = canvas_sp.getContext('2d');
	this.stopper = setInterval(spin, rate);
	
	function spin(){
		ctx_sp.clearRect(0,0,size,size);
		speed *= 1.03;
		speed = speed > max_speed ? max_speed : speed;
		angles[0]+= speed;
		angles[1]+= speed;
		
		for(a in angles){
			ctx_sp.beginPath();
			ctx_sp.lineWidth = line_width;
			ctx_sp.arc(so2, so2, so2 - line_width, angles[a], angles[a] + arc, false)
			ctx_sp.strokeStyle = "#fff";
			ctx_sp.stroke();
		}
	}
	
	this.stop = function(){
		clearInterval(this.stopper);
		ctx_sp.clearRect(0,0,size,size);
	}
}