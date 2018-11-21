'use strict'

const omx = require('omx-interface');
const Finder = require('./finder.js');
const Menu = require('./menu.js');
const homedir = require('os').homedir();

const VOLUME_INITIAL = .5,
      VOLUME_REDUCED = 0.05,
      VOLUME_INCREMENT = 0.2,
      VOLUME_DECREMENT = 0.25,
      VOLUME_SMALL_DECREMENT = 0.15;

function Player(client) {
	this.client = client;
  this.sessionId = null;
  this.options = {
    audioOutput: 'local',
    blackBackground: true
  };
  this.menu = new Menu(homedir);
  this.finder = new Finder(client, homedir);
  this.videos = this.finder.getTitles();
  this.videoIndex = 0;
  this.volume = VOLUME_INITIAL;
  this.playing = false;
  this.paused = false;
  this.muted = false;
  this.actualVolume = omx.getCurrentVolume;
  this.methods = {
    'listSongs': this.titleScreen.bind(this),
    'playSong': this.findSong.bind(this),
    'playArtist': this.findSong.bind(this),
    'speakerInterrupt': this.pause.bind(this),
    'resumeMusic': this.play.bind(this),
    'volumeUp': this.volumeUp.bind(this),
    'volumeDown': this.volumeDown.bind(this),
    'nextSong': this.playNextVideo.bind(this),
    'previousSong': this.playPreviousVideo.bind(this),
    'toggleMute': this.toggleMute.bind(this),
    'quit': omx.quit
  };
}

Player.prototype.start = function() {
    this.menu.writeTitles(this.videos)
      .then(() => {
        this.titleScreen();
        this.menu.removeLoading();
      });
};

Player.prototype.titleScreen = function () {
  if (this.playing) {
    omx.quit();
    this.playing = false;
    this.paused = false;
    this.muted = false;
  }
  this.menu.removeMenu();
  this.menu.showMenu();
  this.videoIndex = 0;
};

Player.prototype.findSong = function (message) {
  let value,
      video;

  try {
    value = message.slots[0].value.value.toLowerCase();
  } catch (e) {
    console.log('error with the song name');
    return ;
  }
  video = this.videos
          .find((item) => item.artist == value || item.title == value);
  if (!video)
    return ;
  this.videoIndex = video.index;
  this.readSong();
};

Player.prototype.readSong = function () {
  if (this.playing)
    omx.quit();
  console.log('reading ' + this.videos[this.videoIndex].path);
  omx.open(this.videos[this.videoIndex].path, this.options);
  omx.setVolume(this.volume);
  this.muted = false;
  this.playing = true;
  this.paused = false;
};

Player.prototype.pause = function () {
  if (!(this.playing && !this.paused))
    return ;
  omx.togglePlay();
  this.paused = true;
};

Player.prototype.play = function () {
  if (!(this.playing && this.paused))
    return ;
  omx.togglePlay();
  this.paused = false;
};

Player.prototype.playNextVideo = function () {
  if (!this.playing)
    return ;
  if (this.videoIndex + 1 >= this.videos.length) {
    this.titleScreen();
    return ;
  }
  this.videoIndex++;
  this.readSong();
};

Player.prototype.playPreviousVideo = function () {
  if (!this.playing)
    return ;
  if (this.videoIndex == 0) {
    omx.setPosition(0);
    return ;
  }
  this.videoIndex--;
  this.readSong();
};

Player.prototype.volumeDown = function () {
  console.log('volume down');
  if (!this.playing) {
    return ;
  } else if (this.muted) {
    this.toggleMute();
    return ;
  }
  if (this.volume <= VOLUME_REDUCED)
    this.volume = 0;
  else if (this.volume <= .25)
    this.volume = Math.round((this.volume - VOLUME_SMALL_DECREMENT) * 100)
                  / 100;
  else
    this.volume = Math.round((this.volume - VOLUME_DECREMENT) * 100)
                  / 100;
  this.volume = this.volume < 0 ? 0 : this.volume;
  omx.setVolume(this.volume);
};

Player.prototype.volumeUp = function () {
  console.log('volume up');
  if (!this.playing) {
    return ;
  } else if (this.muted) {
    this.toggleMute();
    return ;
  }
  if (this.volume >= 0.95)
    this.volume = 1 ;
  else
    this.volume = Math.round((this.volume + VOLUME_INCREMENT) * 100) / 100;
  omx.setVolume(this.volume);
};

Player.prototype.toggleMute = function () {
  if (!this.playing)
    return ;
  console.log('toggling mute');
  if (!this.muted) {
    omx.setVolume(0);
    this.muted = true;
  } else {
    omx.setVolume(this.volume);
    this.muted = false;
  }
};

Player.prototype.listenOn = function () {
  console.log('temporary decreasing volume to hear query');
  if (!(this.playing && !this.muted))
    return ;
  else if (this.volume > VOLUME_REDUCED) {
    omx.setVolume(VOLUME_REDUCED);
  }
};

Player.prototype.listenOff = function () {
  if (this.actualVolume() == VOLUME_REDUCED && !this.muted) {
    omx.setVolume(this.volume);
    console.log('normal volume back');
  }
  console.log('end of action');
};

Player.prototype.logInfo = function () {
  console.log('--------');
  console.log(`playing: ${this.playing}`);
  console.log(`paused: ${this.paused}`);
  console.log(`player.volume: ${this.volume}`);
  console.log(`omx actual volume: ${this.actualVolume()}`);
  console.log(`muted: ${this.muted}`);
  console.log('--------');
};

module.exports = Player;
