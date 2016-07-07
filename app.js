'use strict';

/**
 * Multiplayer Tic-Tac-Toe game using react and socketio libraries.
 */

var express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    _ = require('underscore'),
    games = [],
    players = [],
    numPlayers = 0,
    gamesCount = 0,
    playersWaiting = [],
    SIZE = 4;
/**
 * CONFIGURING EXPRESS
 */

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
}));
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(methodOverride());

/**
 * ROUTES
 */

app.get('/', function(req, res, next) {
    res.render('app.ejs', {
        title: "Tic Tac Toe"
    });
});

io.on('connection', function(socket) {
    var addedPlayer = false,
        room = null;

    // New player
    socket.on('add player', function(playerName) {
        console.log(playerName + ' added to players list');
        socket.playerName = playerName;

        // Add the client's player name to the global list
        players.push({
            playerName: playerName,
            socketID: socket.id
        });

        ++numPlayers;

        if (playersWaiting.length > 0) {
            // Not available anymore!
            socket.leave('available');
            playersWaiting = _.without(playersWaiting, socket.id);

            // Joining game room
            room = 'game-' + gamesCount;

            socket.emit('join game', room);

            var opponent = io.sockets.connected[playersWaiting.splice(0, 1)];
            opponent.emit('join game', room);
        } else {
            socket.room = 'available';
            socket.join('available');
            playersWaiting.push(socket.id);
            console.log(socket.playerName + ' joined the available room');
        }
    });

    var Wins = function(size) {
        var val = 1,
            cells = [],
            wins = [];
        for (var i = 0; i < size; i++) {
            cells[i] = [];
            for (var j = 0; j < size; j++) {
                cells[i][j] = val;
                val *= 2;
            }
        }

        /* We add here all winning chances value of row, column and diaognal value */
        var rowWins = [],
            colWins = [],
            leftDiagWin = 0,
            rightDiagWin = 0;
        for (i = 0; i < size; i++) {
            rowWins[i] = 0;
            colWins[i] = 0;
            leftDiagWin += cells[i][i];
            rightDiagWin += cells[i][size - i - 1];
            for (j = 0; j < size; j++) {
                rowWins[i] += cells[i][j];
                colWins[i] += cells[j][i];
            }
        }
        return rowWins.concat(colWins, leftDiagWin, rightDiagWin);
    };

    function getTiles() {
        var result = {};
        var i;
        for (var i = 0; i < Math.pow(SIZE, 2); i++) {
            var key = Math.pow(2, i);
            result[key] = "";
        }
        return result;
    }

    // Join Game Room
    socket.on('join room', function(room) {
        console.log(socket.playerName + ' joining ' + room);

        var game = {
            turn: 'X',
            score: {
                X: 0,
                O: 0
            },
            moves: 0,
            size: SIZE,
            tiles: getTiles(),
            wins: Wins(SIZE),
            players: [],
            id: room
        };
        // Leaving room if in one.
        if ('room' in socket) {
            // If leaving from available room, remove player from available list
            if (socket.room === 'available') {
                playersWaiting = _.without(playersWaiting, socket.id);
            }
            socket.leave(socket.room);
        }

        if (room === 'available') {
            // find if there is a player available and join him by creating a game
            if (playersWaiting.length > 0) {
                // Joining game room
                room = 'game-' + gamesCount;
                socket.join(room);
                socket.room = room;
                game.players.push(socket.playerName);
                socket.emit('joined room', game);
                game.id = room;
                games.push(game);
                ++gamesCount;

                var opponent = io.sockets.connected[playersWaiting.splice(0, 1)];
                opponent.emit('join game', room);
            } else {
                playersWaiting.push(socket.id);
                socket.join(room);
                socket.room = room;
            }
        } else {
            var gameFound = false;

            // If game exists, join that game.
            for (var i = 0; i < games.length; i++) {
                if (games[i].id === room) {
                    game = games[i];
                    gameFound = true;
                    break;
                }
            }

            // Add playerName
            game.players.push(socket.playerName);
            socket.join(room);
            socket.room = room;

            if (gameFound) {
                socket.emit('joined room', game);
                io.to(socket.room).emit('joined room', game);
            } else {
                game.id = 'game-' + gamesCount;
                socket.emit('joined room', game);
                io.to(socket.room).emit('joined room', game);
                games.push(game);
                ++gamesCount;
            }
        }
    });

    // Player move
    socket.on('move', function(state) {
        io.to(socket.room).emit('move', state);
    });

    // Leave room
    socket.on('leave room', function() {
        socket.leave(socket.room);
    });

    // End Game
    socket.on('end game', function(result) {
        console.log('Game ended: ' + result);
        io.sockets.in(socket.room).emit('end game', result);
        socket.leave(socket.room);
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
        console.log('*********** Player Left ****************');
        console.log(socket.id + ' | ' + socket.playerName);
        console.log('****************************************');

        // Remove player from available list
        playersWaiting = _.without(playersWaiting, socket.id);

        // If player has joined a room.
        if ('room' in socket) {
            // if available room
            if (socket.room !== 'available') {
                // Remove game from games list
                for (var i = 0; i < games.length; i++) {
                    if (socket.room === games[i].id) {
                        games.splice(i, 1);
                        break;
                    }
                }
                // Tell opponent you left
                io.to(socket.room).emit('player left');
            }
        }

        // Remove player from global players list
        for (var i = 0; i < players.length; i++) {
            if (players[i].playerName === socket.playerName) {
                players.splice(i, 1);
                --numPlayers;
                break;
            }
        }
    });
});


// Starting server
server.listen(3000, function() {
    console.log('Server started at http://localhost:3000');
});