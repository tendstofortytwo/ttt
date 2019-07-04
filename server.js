const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('client'));

const boardSize = 3;

let rooms = {};

io.on('connection', socket => {
	console.log('user connected');

	var playerRoom = null;

	socket.on('join room', (room, cb) => {
		playerRoom = room;
		socket.join(room);
		console.log('room joined', room);
		if(!rooms[room]) {
			let newRoom = {
				x: socket.id,
				o: null,
				board: [],
				turn: null
			};

			console.log('creating new room', room);

			for(var i = 0; i < boardSize; i++) {
				newRoom.board[i] = [];
				for(var j = 0; j < boardSize; j++)
					newRoom.board[i][j] = null;
			}

			rooms[room] = newRoom;
		
			cb('x');
		}

		else if(!rooms[room].o && socket.id !== rooms[room].x) {
			console.log('joining as o');

			rooms[room].o = socket.id;
			cb('o');
		}

		else {
			console.log('joining as spec');
			cb('spectator');
		}
	});

	socket.on('get room info', room => sendRoomInfo(room));

	socket.on('disconnect', () => {
		removeFromRoom(socket.id, playerRoom);
		console.log('user disconnected');
	});

	function removeFromRoom(id, room) {
		if(rooms[room]) {
			if(rooms[room].x === id) room.x = null;
			else if(rooms[room].o === id) room.o = null;
		}
	}

	function sendRoomInfo(room) {
		console.log('sending room info', room);

		// using socket.in(room) excludes the sender

		if(rooms[room]) {
			io.in(room).emit('room info', rooms[room]);
		}

		else {
			io.in(room).emit('room info', null);
		}
	}
});

http.listen(8042, () => console.log('Server listening on port 8042'));
