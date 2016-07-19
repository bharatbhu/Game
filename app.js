var path = require('path');
var bodyParser = require('body-parser');
var express = require('express');
var data = require('./data.json');
var config = require('./config.json');
/* Server part code */
var app = express();
var fs=require('fs');
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
var server = app.listen(3000);
console.log('Server listening on port 3000: http://localhost:3000');

/* socket IO available here */
var io = require('socket.io')(server);

app.use(function(req, res, next) {
    // Set permissive CORS header - this allows this server to be used only as
    // an API server in conjunction with something like webpack-dev-server.
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Disable caching so we'll always get the latest comments.
    res.setHeader('Cache-Control', 'no-cache');
    next();
});
/* We get winning status of player and save it to json file. */
app.post('/status', function (req, res) {
     res.status(200);
    if (!!req.body.result) {
   var data=req.body.result;
   fs.writeFile('./data.json', JSON.stringify(data), function (err) {
          if (err) return console.log(err);
    });
   }
    res.json(data);
});

/* We receive the data from json and send it to client to show the winning history.*/
app.get('/history', function (req, res) {
    res.json(readJsonFileSync(data));
    res.status(200);
});

function readJsonFileSync(data, encoding){

    if (typeof (encoding) == 'undefined'){
        encoding = 'utf8';
    }
    var file = fs.readFileSync("./data.json", encoding);
    return JSON.parse(file);
};



/* Game configs */
var SIZE = config.size,
    MARKERS = ['X', 'O'],
    MARKERS_NAME = ['player1', 'player2'],
    currentConnections = 0,
    initialGameState, activeMarker;

function _init() {
    initialGameState = getInitialState(SIZE);
    activeMarker = MARKERS[0];
    activeMarker_name = MARKERS_NAME[0];
}

function getInitialState(size) {
    var i, j, result = [], row;
    for (i = 0; i < size; i++) {
        row = [];
        for (j = 0; j < size; j++) {
            row.push(0);
        }
        result.push(row);
    }
    return result;
};

/** 
 * Kick off app state 
 */
_init();

io.on('connection', function (socket) {
    ++currentConnections;
/** 
 * only 2 players can join the game  at a time 
 */
    socket.on('game:start', function () {
        console.log('in game start');
        if (currentConnections > 2) {
            socket.emit('game:start:limit:exceeded');
            return;
        }

        socket.marker = MARKERS[currentConnections - 1];
        socket.marker_name = MARKERS_NAME[currentConnections - 1];

        socket.emit('game:started', {
            size: SIZE,
            data: initialGameState,
            marker: MARKERS[currentConnections - 1],
            marker_name: MARKERS_NAME[currentConnections - 1],
            activeMarker: activeMarker,
            activeMarker_name: activeMarker_name
        });

        if (currentConnections < 2) {
            socket.emit('game:start:player:onhold');
        } else {
            io.emit('game:start:ready', { activeMarker: activeMarker });
        }

        /* Maintaining log */
        console.log("Player " + currentConnections + " Joined the game.");
    });

    /* Players turn  */
    socket.on('game:play:turn', function (marker, rowNum, colNum) {
        var dataClone, oppmarker;

        if (!initialGameState[rowNum][colNum]) {
            dataClone = initialGameState.slice(0);
            dataClone[rowNum][colNum] = MARKERS.indexOf(marker) + 1;
            oppmarker = getOpponentMarker(marker);

            if (checkWinningState(dataClone, marker)) {
                _init();
                io.emit('game:result', oppmarker, marker);
            }

            // Withdraw game
            if (checkWithdrawGame(dataClone)) {
                onGameTieEvent();
            }

            io.emit('game:played:turn', dataClone);
            io.emit('game:played:turn:change', marker, oppmarker);
        }
    });
    /* Game restared */
    socket.on('game:restart', function() {
        io.emit('game:restart:done');
    });

    /* If Player left the game */
    socket.on('disconnect', function () {
        --currentConnections;
        if (currentConnections === 0) {
            console.log("All Player left the game");
            _init();
        } else if (currentConnections < 2) {
            console.log("Player " + looser + " left the game");
            var looser = socket.marker;
            var winner = getOpponentMarker(socket.marker);
            io.emit('game:result', looser, winner);
        }
    });

    /** 
     * Winning logic we use here to check the status
     */
    function checkWinningState(data, marker) {
        var valueToCheck = MARKERS.indexOf(marker) + 1;
        var result = false;
        var diagonalsArray = [true, true];

        // Check in every row, we converted result undefine to false using !!
        result = data.find(function (row, index) {
            return _every(row, valueToCheck);
        });

        if (result) {
            console.log(result);
            return !!result;
        }

        // Check in every column
        result = data.find(function (row, index) {
            var column = getCol(data, index);
            return _every(column, valueToCheck);
        });
        if (result) {
            return !!result;
        }

        // Check in each diagonal
        result = diagonalsArray.find(function (value, index) {
            var diagonal = getDiagonal(data, index);
            return _every(diagonal, valueToCheck);
        });

        return !!result;
    }

    /**
     * We check here if the game is tie
    */
    function checkWithdrawGame(data) {
        result = data.every(function (row) {
            return row.indexOf(0) === -1;
        });
        return !!result;
    }

    function onGameTieEvent() {
        _init();
        io.emit('game:tie');
    }

    function getCol(matrix, col) {
        var column = [];
        for (var i = 0; i < matrix.length; i++) {
            column.push(matrix[i][col]);
        }
        return column;
    }

    function getDiagonal(matrix, index) {
        var diagonal = [];
        var i = 0, j = matrix.length - 1;
        if (index === 0) {
            for (; i < matrix.length; i++) {
                diagonal.push(matrix[i][i]);
            }
        } else if (index === 1) {
            for (i = 0; i < matrix.length; i++) {
                diagonal.push(matrix[i][j]);
                j--;
            }
        }
        return diagonal;
    }

    function _every(array, valueToCheck) {
        return array.every(function (value) {
            return value === valueToCheck;
        });
    }

    function getOpponentMarker(marker) {
        return marker === MARKERS[0] ? MARKERS[1] : MARKERS[0];
    }
});
