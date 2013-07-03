/*
Copyright (c) 2012 Samuel Colvin. All rights reserved.

Released under the creative commons Attribution-NonCommercial-ShareAlike 3.0 license (http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode). See main.js for details.

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING AND TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THIS EXCLUSION MAY NOT APPLY TO YOU.
*/
var About = About || {};

About.set = function(item, value){
	if(item =='tz')
		value = t2str_gmt(value);
	document.getElementById('user_'+item).innerHTML = value;
}

About.con_log = function(line){
	document.getElementById('user_console').innerHTML += '\n<p>' + line + '</p>';
}

About.setup = function(){
	if (is_chrome_app()){
		document.getElementById('app_name').innerHTML = chrome.app.getDetails().name;
		document.getElementById('app_version').innerHTML = chrome.app.getDetails().version;
	}
	else{
		About.con_log('Web app only: day image will always be this month. Use Chrome web app for varying day image.');
		load_json('manifest.json', onload, function(result){});
		function onload(result){
			document.getElementById('app_name').innerHTML = result.name;
			document.getElementById('app_version').innerHTML = result.version + ' (Standalone Web App)';
		}
	}
}