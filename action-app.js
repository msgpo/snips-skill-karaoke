#!/usr/bin/node

console.log('It launched!!!');
const mqtt = require('mqtt'),
      Player = require('./player.js');

const client  = mqtt.connect('mqtt://localhost',
                            { port: 1883 }),
      player = new Player(client);

client.on('connect', () => {
  client.subscribe('hermes/hotword/default/detected',
                    (err) => console.log)
  .subscribe('hermes/dialogueManager/sessionEnded',
            (err) => console.log)
  .subscribe('hermes/intent/speakerInterrupt',
            (err) => console.log)
  .subscribe('hermes/intent/resumeMusic',
            (err) => console.log)
  .subscribe('hermes/intent/volumeUp',
            (err) => console.log)
  .subscribe('hermes/intent/volumeDown',
            (err) => console.log)
  .subscribe('hermes/intent/nextSong',
            (err) => console.log)
  .subscribe('hermes/intent/previousSong',
            (err) => console.log)
  .subscribe('hermes/intent/toggleMute',
            (err) => console.log)
  .subscribe('hermes/intent/playSong',
            (err) => console.log)
  .subscribe('hermes/intent/playArtist',
            (err) => console.log)
  .subscribe('hermes/intent/listSongs',
            (err) => console.log);
})

.on('message', function (topic, data) {
  let message,
      payload,
      action;

  message = JSON.parse(data);
  console.log(`received a message on topic ${topic}`);
  action = topic.split('/').pop();
  console.log(`action is ${action}`);
  if (action == 'detected') {
    player.listenOn();
  } else if (action == 'sessionEnded') {
    player.listenOff();
  } else {
    payload = `{ "sessionId": "${message.sessionId}" }`;
    action = player.methods[action];
    if (action)
      action(message);
    client.publish('hermes/dialogueManager/endSession', payload);
  }
  setTimeout(player.logInfo.bind(player), 500);
});

player.start();
