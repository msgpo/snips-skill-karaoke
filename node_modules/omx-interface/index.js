var exec = require('child_process').exec;
var path = require('path');

var defaults, progressHandler;

function setDefault ()	{
	defaults = {
		path:{
			value:'',
			time:new Date(),
			valid:false
		},
		position:{
			value:false,
			time:new Date(),
			valid:false
		},
		duration:{
			value:0,
			time:new Date(),
			valid:false
		},
		volume:{
			value:1.0,
			time:new Date(),
			valid:false
		},
		isPlaying:{
			value:0,
			time:new Date(),
			valid:false
		}
	};

	return defaults;
}

var cache = setDefault();

dbus = "bash "+__dirname+"/dbus.sh ";

function checkProgressHandler() {
	if (progressHandler) {
		clearInterval(progressHandler);
		console.log('progressHandler cancelled');
	}
}

var playTryCount = 0;
var play = function() {
	checkProgressHandler();
	exec(dbus + 'getplaystatus',function(error, stdout, stderr) {
		if(error && (playTryCount < 3)){
			playTryCount++;
			play();
		} else if(error) {
			playTryCount = 0;
		} else {
			playTryCount = 0;
			if (stdout.indexOf("Paused")>-1) {
				togglePlay();
				cache.isPlaying.value = 1;
				cache.isPlaying.time = new Date();
				cache.isPlaying.valid = true;
			}
		}
	});
}

var pauseTryCount = 0;
var pause = function() {
	exec(dbus + 'getplaystatus',function(error, stdout, stderr) {
		if(error && (stopTryCount < 3)){
			pauseTryCount++;
			pause();
		} else if(error) {
			pauseTryCount = 0;
		} else {
			pauseTryCount = 0;
			if (stdout.indexOf("Playing")>-1) {
				togglePlay();
 				cache.isPlaying.value = 0;
 				cache.isPlaying.time = new Date();
 				cache.isPlaying.valid = true;
			}
		}
	});
}

var stopTryCount = 0;
var stop = function() {
	exec(dbus + 'stop',function(error, stdout, stderr) {
		if(error && (stopTryCount < 3)){
			stopTryCount++;
			stop();
		} else if(error) {
			stopTryCount = 0;
		} else {
			stopTryCount = 0;
			cache = defaults;
		}
	});
	checkProgressHandler();
}

var quitTryCount = 0;
var quit = function() {
	checkProgressHandler();
	exec(dbus + 'quit',function(error, stdout, stderr) {
		if(error && (quitTryCount < 3)){
			quitTryCount++;
			quit();
		} else if(error) {
			quitTryCount = 0;
		} else {
			quitTryCount = 0;
			cache = defaults;
		}
  });
}

var togglePlayTryCount = 0;
var togglePlay = function() {
	exec(dbus + 'toggleplay',function(error, stdout, stderr) {
		if(error && (togglePlayTryCount < 4)){
			togglePlayTryCount++;
			togglePlay();
		} else {
			togglePlayTryCount = 0;
		}
  });
}

var volumeUpTryCount = 0;
var volumeUp = function() {
	exec(dbus + 'volumeup',function(error, stdout, stderr) {
		if(error && (volumeUpTryCount < 4)){
			volumeUpTryCount++;
			volumeUp();
		} else {
			volumeUpTryCount = 0;
		}
  });
}

var volumeDownTryCount = 0;
var volumeDown = function() {
	exec(dbus + 'volumedown',function(error, stdout, stderr) {
		if(error && (volumeDownTryCount < 4)){
			volumeDownTryCount++;
			volumeDown();
		} else {
			volumeDownTryCount = 0;
		}
  });
}

var seekTryCount = 0;
var seek = function(offset) { //seek offset in seconds; relative from current position; negative values will cause a jump back;
	exec(dbus + 'seek '+Math.round(offset*1000000),function(error, stdout, stderr) {
		if(error && (seekTryCount < 4)){
			seekTryCount++;
			seek(offset);
		} else {
			seekTryCount = 0;
			update_position();
		}
  });
}

var setPositionTryCount = 0;
var setPosition = function(position) { //position in seconds from start; //positions larger than the duration will stop the player;
	exec(dbus + 'setposition '+Math.round(position*1000000),function(error, stdout, stderr) {
		if(error && (setPositionTryCount < 4)){
			setPositionTryCount++;
			setPosition(position);
		} else {
			setPositionTryCount = 0;
			update_position();
		}
  });
}

var setVolumeTryCount = 0;
var setVolume = function(volume) { //volume should be set from 0.0 to 1.0; Above 1.0 is depreciated;
	exec(dbus + 'setvolume '+volume,function(error, stdout, stderr) {
		if(error && (setPositionTryCount < 4)){
			setVolumeTryCount++;
			setVolume(volume);
		} else {
			setVolumeTryCount = 0;
			update_volume();
		}
  });
}

var toggleSubtitlesTryCount = 0;
var toggleSubtitles = function() {
	exec(dbus + 'togglesubtitles',function(error, stdout, stderr) {
		if(error && (toggleSubtitlesTryCount < 4)){
			toggleSubtitlesTryCount++;
			toggleSubtitles(position);
		} else {
			toggleSubtitlesTryCount = 0;
		}
  });
}

var hideSubtitlesTryCount = 0;
var hideSubtitles = function() {
	exec(dbus + 'hidesubtitles',function(error, stdout, stderr) {
		if(error && (hideSubtitlesTryCount < 4)){
			hideSubtitlesTryCount++;
			hideSubtitles(position);
		} else {
			hideSubtitlesTryCount = 0;
		}
  });
}

var showSubtitlesTryCount = 0;
var showSubtitles = function() {
	exec(dbus + 'showsubtitles',function(error, stdout, stderr) {
		if(error && (showSubtitlesTryCount < 4)){
			showSubtitlesTryCount++;
			showSubtitles(position);
		} else {
			showSubtitlesTryCount = 0;
		}
  });
}

var setVisibility = function(visible) {
	var command = visible ? 'unhidevideo' : 'hidevideo';
	exec(dbus + command, function(err, stdout, stderr) {
		console.log('result of setVisible:', command, ': error?', err);
	});
}

var setAlpha = function(alpha) {
	exec(dbus + 'setalpha ' + alpha, function(err, stdout, stderr) {
		console.log('result of setAlpha; error?', err);
	});
}

var update_position = function() {
	exec(dbus + 'getposition',function(error, stdout, stderr) {
		if (error) return false;
		var position = parseInt(stdout);
		cache.position.value = position;
		cache.position.time = new Date();
		cache.position.valid = true;
  });
}

var update_status = function() {
	exec(dbus + 'getplaystatus',function(error, stdout, stderr) {
		if (error) return false;
		cache.isPlaying.value = ((stdout.indexOf("Playing")>-1) ? 1 : 0);
 		cache.isPlaying.time = new Date();
		cache.isPlaying.valid = true;
  });
}

var update_duration = function() {
	exec(dbus + 'getduration',function(error, stdout, stderr) {
		if (error) return false;
    	var duration = Math.round(Math.max(0,Math.round(parseInt(stdout.substring((stdout.indexOf("int64")>-1 ? stdout.indexOf("int64")+6:0)))/10000)/100));
		cache.duration.value = duration;
		cache.duration.time = new Date();
		cache.duration.valid = true;
  });
}

var update_volume = function() {
	exec(dbus + 'getvolume',function(error, stdout, stderr) {
		if (error) return false;
    	var volume = parseFloat(stdout);
		cache.volume.value = volume;
		cache.volume.time = new Date();
		cache.volume.valid = true;
  });
}

var getCurrentPosition = function(){
	if((new Date()-cache.position.time)/1000 > 2) {
		cache.position.valid = false;
	}
	if(!cache.position.valid) {
		update_position();
	}
	if(cache.position.value > 0) {
		return Math.round(Math.max(0,Math.min(Math.round((cache.position.value + getCurrentStatus()*((new Date())-cache.position.time)*1000)/1000000),getCurrentDuration())));
	} else {
		return 0;
	}
}

var getCurrentStatus = function(){
	if((new Date()-cache.isPlaying.time)/1000 > 2) {
		cache.isPlaying.valid = false;
	}
	if(!cache.isPlaying.valid) {
		update_status();
	}
	return cache.isPlaying.value;
}

var getCurrentDuration = function(){
	if(cache.duration.value <= 0) {
		cache.duration.valid = false;
	}
	if(!cache.duration.valid) {
		update_duration();
	}
	return cache.duration.value;
}

var getCurrentVolume = function(){
	if(!cache.volume.valid) {
		update_volume();
	}
	return cache.volume.value;
}

var onProgress = function(callback){
	console.log('add new progress handler')
	progressHandler = setInterval(function(){
		if(getCurrentStatus()){
			callback({position:getCurrentPosition(), duration:getCurrentDuration()});
		}
	},1000);
}

/*
end_called = false;
var onEnd = function(callback){
	setInterval(function(){
		if (cache.duration.valid && cache.position.value > cache.duration.value) {
			callback();
			end_called = true;
		}
	},1000);
}
*/

var open = function (path, options) {
	var settings = options || {};
	var args = [];
	var command = 'omxplayer';

	cache = setDefault();

	cache.path.value = path;
	cache.path.valid = true;

	args.push('"'+path+'"');

	if (['hdmi','local','both'].indexOf(settings.audioOutput) != -1) {
		args.push('-o');
		args.push(settings.audioOutput);
	}

	if (settings.blackBackground !== false) { // defaults to true
		args.push('-b');
	}

	if (settings.disableKeys === true) { //defaults to  false
		args.push('--no-keys')
	}

	if (settings.disableOnScreenDisplay === true) { //defaults to  false
		args.push('--no-osd')
	}

	if (settings.disableGhostbox === true) { //defaults to  false
		args.push('--no-ghost-box');
	}

	if (settings.loop === true) { // defaults to false
		args.push('--loop');
	}

	if (settings.subtitlePath && settings.subtitlePath != "" ){
		args.push('--subtitles');
		args.push('"'+settings.subtitlePath+'"');
	}

	if (settings.startAt){
		args.push('--pos');
		args.push(''+settings.startAt+'');
	}
	if (settings.layer){
		args.push('--layer');
		args.push(settings.layer);
	}
	args.push('--dbus_name');
	args.push('org.mpris.MediaPlayer2.omxplayer');

  exec(command+' '+args.join(' '), function(error, stdout, stderr) {
		console.log('exec callback start');
		update_duration();
		console.log('update duration done');
		setTimeout( function() {
			checkProgressHandler();
		}, 1000);
  	console.log(stdout);
  });

  update_duration();

};


module.exports.open = open;
module.exports.play = play;
module.exports.pause = pause;
module.exports.stop = stop;
module.exports.quit = quit;
module.exports.togglePlay = togglePlay;
module.exports.volumeUp = volumeUp;
module.exports.volumeDown = volumeDown;
module.exports.seek = seek;
module.exports.setPosition = setPosition;
module.exports.setVolume = setVolume;
module.exports.toggleSubtitles = toggleSubtitles;
module.exports.hideSubtitles = hideSubtitles;
module.exports.showSubtitles = showSubtitles;
module.exports.setVisibility = setVisibility;
module.exports.setAlpha = setAlpha;
module.exports.getCurrentPosition = getCurrentPosition;
module.exports.getCurrentDuration = getCurrentDuration;
module.exports.getCurrentVolume = getCurrentVolume;
module.exports.getCurrentStatus = getCurrentStatus;
module.exports.onProgress = onProgress;
