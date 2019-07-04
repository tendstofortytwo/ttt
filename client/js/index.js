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

		drawBoard(room.board, room.boardSize);
	});
}

function drawBoard(board, size) {
	const boardEl = document.querySelector('#board');

	empty(boardEl);

	for(var i = 0; i < size; i++) {
		for(var j = 0; j < size; j++) {
			const square = document.createElement('div');
			square.classList.add('square');
			
			if(board[i][j] === 'x') square.innerHTML = '&cross;';
			else if(board[i][j] === 'o') square.innerHTML = '&#9675;'; // circle unicode

			square.setAttribute('id', [i, j].join('-'));

			square.addEventListener('click', e => {
				if(playerType === 'x' || playerType === 'o') {
					var id = square.getAttribute('id').split('-');
					socket.emit('move', roomName, { i: id[0], j: id[1] });
				}
			});

			boardEl.appendChild(square);
		}
	}
}


function empty(el) {
	while (el.firstChild) {
		el.removeChild(el.firstChild);
	}
}
join(roomName);