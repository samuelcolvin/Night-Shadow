/*
Copyright (c) 2012 Samuel Colvin. All rights reserved.

Released under the creative commons Attribution-NonCommercial-ShareAlike 3.0 license (http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode). See main.js for details.

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING AND TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THIS EXCLUSION MAY NOT APPLY TO YOU.
*/

function load_json(url, onload, onerror){
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType('application/json');
	xobj.open('GET', url);
	xobj.onload = function () {
		var data = JSON.parse(this.responseText);
		onload(data);
	};
	xobj.onerror = onerror;
	xobj.send(null);
}

function is_chrome_app(){
	if (typeof chrome == 'undefined')
		return false;
	else
		return chrome.app.getDetails() != null;
}

function app_type(){
	if (is_chrome_app()) return 'CHROME WEB APP';
	else return 'WEB APP';
}

var context_data_dir = 'data/'
var context_tools_dir = 'server_only/'

function context_image_dir(name){
	if (is_chrome_app() || name=='night.jpg')
		return 'earth-images/' + name;
	else
		return context_tools_dir + 'this_month.cgi';
// 		return '/tools/resized.cgi?w=' + width + '&n=' + name
}

function context_load_local_json(name, onload, onerror){
	var url = context_data_dir + name
	if (is_chrome_app())
		url = chrome.extension.getURL(url);
	return load_json(url, onload, onerror);
}

var stor_image_type_id = 'image_type';

function stor_get_im_type(){
	var defult = 'daynight';
	if (!stor_check(stor_image_type_id))
		return defult;
	else
		return localStorage[stor_image_type_id];
}

function stor_set_im_type(setto){
	localStorage[stor_image_type_id] = setto;
}

function stor_check_empty(){
	for(var i = 1;i<= max_clocks;i++){
		var id = 'c' + i;
		if (stor_check(id))
			return false;
	}
	return true;
}

function stor_get(id){
	var zone = JSON.parse(localStorage[id]);
	if (zone == 'user_zone')
		return user_zone;
	else
		return tzones.create_zone(zone);
}

function stor_add2(id, zone){
	localStorage[id] = JSON.stringify(zone);
}

function stor_removefrom(id){
	localStorage.removeItem(id);
}

function stor_check(id){
	return localStorage[id] != null;
}