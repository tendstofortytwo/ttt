var socket = io();

var roomName = 'testroom1';

var playerType = null;

function join(room) {
	socket.emit('join room', room, type => {
		playerType = type;
		console.log(type);

		socket.emit('get room info', room);
	});

	socket.on('room info', room => {
		console.log(room);
	});
}

join(roomName);