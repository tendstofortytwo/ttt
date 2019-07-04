const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('client'));

const boardSize = 3;

let rooms = {};

io.on('connection', socket => {
	console.log('user connected');

	let playerRoom = null;

	socket.on('join room', (room, cb) => {
		playerRoom = room;
		socket.join(room);
		console.log('room joined', room);
		if(!rooms[room]) {
			let newRoom = {
				x: socket.id,
				o: null,
				boardSize: boardSize,
				turn: null
			};

			console.log('creating new room', room);

			rooms[room] = newRoom;

			reset(room);
		
			cb('x');
		}

		else if(!rooms[room].x) {
			console.log('joining as x');

			rooms[room].x = socket.id;

			if(rooms[room].x && rooms[room].o) start(room);

			cb('x');			
		}

		else if(!rooms[room].o && socket.id !== rooms[room].x) {
			console.log('joining as o');

			rooms[room].o = socket.id;

			if(rooms[room].x && rooms[room].o) start(room);
			
			cb('o');
		}

		else {
			console.log('joining as spec');
			cb('spectator');
		}
	});

	socket.on('get room info', room => sendRoomInfo(room));

	socket.on('move', (room, move) => {
		if(rooms[room] && // room exists
			rooms[room].x && rooms[room].o && // both players exist
			!rooms[room].board[move.i][move.j]) { // and that square is unoccupied
			if(rooms[room].x === socket.id && rooms[room].turn === 'x') {
				rooms[room].board[move.i][move.j] = 'x';
				rooms[room].turn = 'o';
				checkForCompletion(room, 'x');
				sendRoomInfo(room);
			}

			else if(rooms[room].o === socket.id && rooms[room].turn === 'o') {
				rooms[room].board[move.i][move.j] = 'o';
				rooms[room].turn = 'x';
				checkForCompletion(room, 'o');
				sendRoomInfo(room);
			}
		}
	});

	socket.on('disconnect', () => {
		removeFromRoom(socket.id, playerRoom);
		console.log('user disconnected');
	});

	function removeFromRoom(id, room) {
		if(rooms[room]) {
			if(rooms[room].x === id) rooms[room].x = null;
			else if(rooms[room].o === id) rooms[room].o = null;
		}
	}

	function announce(room, text) {
		io.in(room).emit('announcement', text);
	}

	function start(room) {
		if(rooms[room]) {
			reset(room);
			rooms[room].turn = 'x';
			announce(room, 'Starting match!');
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

	function checkForCompletion(room, lastPlayer) {
		// only the player who just played can win on that move
		const board = rooms[room].board;

		let diagWin = true,
			antiDiagWin = true,
			rows = new Array(boardSize),
			cols = new Array(boardSize);

		for(let i = 0; i < boardSize; i++) {
			rows[i] = true;
			cols[i] = true;
		}

		let fullBoard = true;

		for(let i = 0; i < boardSize; i++) {
			for(let j = 0; j < boardSize; j++) {
				if(!board[i][j]) fullBoard = false;

				if(board[i][j] !== lastPlayer) {
					if(i === j) {
						diagWin = false;
					}
					if(i + j === boardSize - 1) {
						antiDiagWin = false;
					}
					rows[i] = false;
					cols[j] = false;
				}
			}
		}

		let rowWin = rows.indexOf(true) >= 0,
			colWin = cols.indexOf(true) >= 0;

		if(rowWin || colWin || diagWin || antiDiagWin) {
			console.log('winner', lastPlayer);
			announce(room, lastPlayer + ' wins!');
		}

		else if(fullBoard) {
			console.log('draw');
			announce(room, 'Draw!');
		}
	}

	function reset(room) {
		if(rooms[room]) {
			rooms[room].board = [];

			for(let i = 0; i < rooms[room].boardSize; i++) {
				rooms[room].board[i] = [];
				for(let j = 0; j < rooms[room].boardSize; j++) {
					rooms[room].board[i][j] = null;
				}
			}
		}
	}
});

http.listen(8042, () => console.log('Server listening on port 8042'));
