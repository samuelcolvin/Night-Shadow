/*
Copyright (c) 2012 Samuel Colvin. All rights reserved.

Released under the creative commons Attribution-NonCommercial-ShareAlike 3.0 license (http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode). See main.js for details.

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING AND TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THIS EXCLUSION MAY NOT APPLY TO YOU.
*/
function DateTime(test){
	var date = new Date();
	this.user_tz = -date.getTimezoneOffset() / 60;
	this.real = true;
	this.start_virtual;
	this.rate = 1;
	this.start_real;
	About.set('tz', this.user_tz);
	if (test)
		test_time();
	
	this.get_date = function(){
		var date = new Date()
		if (this.real){
			return date;
		}
		var true_elapse = date.getTime() - this.start_real;
		if (this.rate != 1)
			true_elapse = Math.round(true_elapse / 1000) * 1000;
		var mil_new = Math.round(this.start_virtual + true_elapse * this.rate);
		return new Date(mil_new);
	}
	
	this.month = function(){
		return this_month();
	}
	
	this.set_time_virtual = function(start, rate){
		this.start_real = (new Date()).getTime();
		this.start_virtual = start.getTime();
		this.rate = rate;
		this.real = false;
	}
	
	this.set_time_real = function(){
		this.real = true;
		this.start_real = null;
		this.start_virtual = null;
		this.rate = null;	
	}
	
	function this_month(){
		var m = (date.getUTCMonth()+1).toString();
		return m < 10 ? '0' + m : m;
	}
	
	function test_time(){
		var request_start = new Date();
		if (is_chrome_app()){
			load_json('http://developer.yahooapis.com/TimeService/V1/getTime?appid='
				+ yahoo_key + '&output=json&format=ms',
				test_time_difference, 
				error_message);
		}
		else{
			load_json(context_tools_dir + 'local_server_time.cgi',
				test_time_difference, 
				error_message);
		}
		var request_end, requested_time, client_time, error, direction;
		function test_time_difference(result){
			request_end = new Date();
			requested_time = new Date(result.Result.Timestamp);
			client_time = (request_end.getTime() + request_start.getTime())/2;
			error = (requested_time - client_time)/1000;
			direction = error > 0 ? 'slow' : 'fast';
			var time_state = 'right';
			if (Math.abs(error) > 60){
				alert('WARNING: Your computer\'s clock is ' + direction + 
				' by approximatly ' + error_string());
				time_state = 'wrong';
			}
			response_notice();
			_gaq.push(['_trackEvent', 'app', 'time_error', time_state, error]);
		}
		
		function error_message(error){
			About.set('time_error', 'Error contacting server.');
		}
		
		function response_notice(){
			var time_notice;
			var range = (request_end.getTime() - request_start.getTime())/1000;
			if (requested_time > request_start && requested_time < request_end){
				About.set('time_error', 'Accurate to within ' + range.toFixed(1) + 's');
			}
			else{
				About.set('time_error', '~' + error_string() + ' ' + direction);
			}
		}
		
		function error_string(){
			var t = Math.abs(error);
			var inter = Math.floor(t/3600);
			var s = inter > 0 ? inter + 'h, ' : '';
			t = t % 3600;
			inter = Math.floor(t/60);
			s += inter > 0 ? inter + 'm, ' : '';
			t = t % 60;
			s += t > 0.1 ? t.toFixed(1) + 's' : '';
			return s;
		}
	}
}