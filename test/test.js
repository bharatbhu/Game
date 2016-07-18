var should = require('should');
var io = require('socket.io-client');
var socketURL = 'http://localhost:3000';

var options = {
    transports: ['websocket'],
    'force new connection': true
};

describe("Tic Tac Toe Server", function () {
    var player1 = io.connect(socketURL, options);
    var player2 = io.connect(socketURL, options);
    it('should start the game', function (done) {
        
        player1.on('connect', function () {
            player1.emit('game:start');
        });

        player1.on('game:started', function (options) {
            options.should.have.property('data', [[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
            options.should.have.property('size', 3);
            options.should.have.property('marker', 'X');

            // Player2 joins
            player2.on('connect', function () {
                player2.emit('game:start');

            });

            player2.on('game:started', function (options) {
                options.should.have.property('data', [[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
                options.should.have.property('size', 3);
                options.should.have.property('marker', 'O');                
            });
        });
            done();
    });

});