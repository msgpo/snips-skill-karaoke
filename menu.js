const spawn = require('child_process').spawn,
	PImage = require('pureimage'),
      fs = require('fs');

const NB_OF_TITLES = 17,
			TITLES_PER_COLUMN = 11,
			TITLES_X_CENTER_LEFT = 510,
			TITLES_X_CENTER_RIGHT = 1365,
      TITLES_Y_OFFSET = 255,
      TITLES_Y_GAP = 65,
      FONT = 'apercu_mono',
      FONT_POINT_SIZE = 31,
			CHARACTER_LENGTH_ESTIMATED = 20,
			TITLES_LENGTH_THRESHOLD = 40,
			FONT_POINT_SIZE_REDUCED = 26,
			CHARACTER_LENGTH_REDUCED = 17;

function Menu(homeDir) {
	this.image = null;
	this.context = null;
	this.font = null;
  this.imageProcess = null;
  this.loadingProcess = null;
	this.homeDir = homeDir;
	this.menuPath = homeDir + '/karaoke_menu/menu.jpg';
	this.loadingPath = homeDir + '/snips-skill-karaoke/loading.jpg';
	if (!fs.existsSync(homeDir + '/karaoke_menu'))
		fs.mkdirSync(homeDir + '/karaoke_menu');
	this.showLoading();
}

Menu.prototype.writeTitles = async function(videos) {
	try {
		this.image = await PImage.decodeJPEGFromStream(fs.createReadStream(this.homeDir + '/snips-skill-karaoke/blank_menu.jpg'));
		this.context = this.image.getContext('2d');
		this.font = await PImage.registerFont('./' + FONT + '.ttf', FONT);
		await new Promise((resolve) => {
			this.font.load(() => {
				this.context.fillStyle = '#374FF5';
				this.context.font = FONT_POINT_SIZE + 'pt ' + FONT;
				for (let i = 0; i < videos.length && i < NB_OF_TITLES; i++)
					this.writeSingleTitle(i >= TITLES_PER_COLUMN, i % TITLES_PER_COLUMN, videos[i]);
				resolve();
			});
		});
		await PImage.encodeJPEGToStream(this.image, fs.createWriteStream(this.menuPath));
		console.log("Menu created");
	} catch (e) {
		console.log('error in the menu creation' + e);
	}
}

Menu.prototype.writeSingleTitle = function (secondCol, position, video) {
	let yOffset = TITLES_Y_OFFSET + TITLES_Y_GAP * position,
			name,
			charLength,
			fontSize;

	name = video.title + ' - ' + video.artist;
	name = name.split(' ').map((item) => {
		return (item.charAt(0).toUpperCase() + item.slice(1));
	}).join(' ');
	if (name.length > TITLES_LENGTH_THRESHOLD) {
		fontSize = FONT_POINT_SIZE_REDUCED;
		charLength = CHARACTER_LENGTH_REDUCED;
	} else {
		fontSize = FONT_POINT_SIZE;
		charLength = CHARACTER_LENGTH_ESTIMATED;
	}
	xOffset = secondCol ? TITLES_X_CENTER_RIGHT : TITLES_X_CENTER_LEFT;
	xOffset -= name.length * charLength / 2;
	this.context.font = `${fontSize}pt '${FONT}'`
	this.context.fillText(name, xOffset, yOffset);
};

Menu.prototype.showMenu = function () {
console.log('opening ' + this.menuPath);
  this.imageProcess = spawn('fim', [this.menuPath, '-q', '--autowindow']);
};

Menu.prototype.removeMenu = function () {
  if (this.imageProcess) {
    console.log('cleaning the image');
    this.imageProcess.kill();
  }
};

Menu.prototype.showLoading = function () {
	this.loadingProcess = spawn('fim', [this.loadingPath, '-q', '--autowindow']);
	if (!this.loadingProcess)
		console.log('Error with the loading image');
};

Menu.prototype.removeLoading = function () {
	this.loadingProcess.kill();
};

module.exports = Menu;
