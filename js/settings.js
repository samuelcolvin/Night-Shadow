/*
Copyright (c) 2012 Samuel Colvin. All rights reserved.

Released under the creative commons Attribution-NonCommercial-ShareAlike 3.0 license (http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode). See main.js for details.

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING AND TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THIS EXCLUSION MAY NOT APPLY TO YOU.
*/
var settings_group;

function settings(){
	settings_group = new Settings();
	change_tab(1);
	var setwin = document.getElementById('settings_window');
	var h = 472
	setwin.style.height = h + 'px';
	setwin.style.display = 'block';
	if (h > window.height)
		setwin.style.marginTop = '0px';
	else
		setwin.style.marginTop = '100px';
	document.getElementById('fade').style.display = 'block';
	document.body.style.overflow = 'auto';
	_gaq.push(['_trackEvent', 'app', 'settings', 'opened']);
}

function change_tab(totab){
	for (var i = 1; i<= settings_group.total_tabs; i++){
		var tab_a = document.getElementById('tab_' + i);
		var tab_li = document.getElementById('tab_li_' + i);
		var the_body = document.getElementById('settings_' + i);
		if (i ==  totab){
			tab_a.className = 'tab_selected';
			tab_li.style.zIndex = settings_group.total_tabs;
			the_body.style.display = 'block';
			settings_group['load_tab_' + i]();
			_gaq.push(['_trackEvent', 'app', 'settings', 'tab ' + i]);
		}
		else{
			settings_group['unload_tab_' + i]();
			if (i == 1){
				if (totab ==  2){ tab_a.className = 'tab_shadow_right'; }
				else{ tab_a.className = 'tab_shadow_none'; }
			}
			else if (i ==  totab-1){ tab_a.className = 'tab_shadow_both'; }
			else{ tab_a.className = 'tab_shadow_left'; }
			the_body.style.display = 'none';
			tab_li.style.zIndex = settings_group.total_tabs-i;
		}
	}
}

var settings_time;
function Settings(){
	this.total_tabs = 3;
	this.load_tab_1 = function(){
		add_buttons(create_clocks_buttons());
		load_clock_settings();
	}
	this.unload_tab_1 = function(){
	}
	this.load_tab_2 = function(){
		settings_time = new SettingsTime();
		add_buttons(settings_time.create_time_buttons());
	}
	this.unload_tab_2 = function(){
		if (typeof settings_time !=  'undefined'){
			settings_time.clear();
		}
	}
	this.load_tab_3 = function(){
		About.setup();
		add_buttons([]);
	}
	this.unload_tab_3 = function(){
	}

	function add_buttons(buttons){
		var holder = document.getElementById('bottom_buttons');
		while (holder.hasChildNodes()){
		  holder.removeChild(holder.firstChild);
		}
		for(b in buttons){
			buttons[b].className = 'button_basic unselectable';
			holder.appendChild(buttons[b]);
		}
		var cancel = document.createElement('input');
		cancel.setAttribute('type', 'button');
		cancel.setAttribute('onclick', 'close_settings()');
		cancel.setAttribute('value', 'Cancel');
		cancel.className = 'button_basic unselectable';
		holder.appendChild(cancel);
	}
}

var on_settings_window=false;
function maybe_close(){
	if (!on_settings_window)
		close_settings();
}

function close_settings(){
	for (var i = 1; i<= settings_group.total_tabs; i++){
			settings_group['unload_tab_' + i]();		
	}	
	document.getElementById('settings_window').style.display = 'none';
	document.getElementById('fade').style.display = 'none';
	document.body.style.overflow = 'hidden';
}