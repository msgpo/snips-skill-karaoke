const fs = require('fs');

const regEx = /^[A-Za-z1-9\. '&]* - [A-Za-z1-9\. '&]*\.mp4$/;

function Finder(client, homedir) {
	this.videoPath = homedir + '/karaoke_videos';
	this.videos = null;
	this.client = client;
	if (!fs.existsSync(this.videoPath))
		fs.mkdirSync(this.videoPath);
		fs.chmodSync(this.videoPath, 0777);
}

Finder.prototype.importTitles = function () {
	this.videos = fs.readdirSync(this.videoPath)
		.reduce((list, element, index) => {
			let video = {};

			if (regEx.test(element)) {
				video.path = this.videoPath + '/' + element;
				video.index = index;
				element = element.slice(0, -4).toLowerCase().split(' - ');
				video.artist = element[0].trim();
				video.title = element[1].trim();
				list.push(video);
			} else {
				console.log(`rejected ${element}`);
			}
			return (list);
		}, []);
};

Finder.prototype.injectTitles = function () {
	let payload = { "operations": [["add"]] },
		addition = {};

	addition.song_name = [];
	addition.artist_name = [];
	for (var i = 0; i < this.videos.length; i++) {
		addition.song_name.push(this.videos[i].title);
		addition.artist_name.push(this.videos[i].artist);
	}
	payload.operations[0].push(addition);
	payload = JSON.stringify(payload);
	console.log(payload);
	this.client.publish('hermes/injection/perform', payload);
};

Finder.prototype.getTitles = function () {
	this.importTitles();
	this.injectTitles();
	return this.videos;
};

module.exports = Finder;
