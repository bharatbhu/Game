var DOM = React.DOM,
    div = DOM.div,
    button = DOM.button,
    table = DOM.table,
    tr = DOM.tr,
    td = DOM.td;

var App = React.createClass({
    getInitialState: function () {
        return {
            turn: "X",
            score: {
                X: 0,
                O: 0
            },
            moves: 0,
            wins: this.props.wins
        }
    },


    win: function (score) {
        var i;
        for (i = 0; i < this.props.wins.length; i += 1) {
            if ((score) === this.props.wins[i]) {
                return true;
            }
        }
        return false;
    },

    set: function (indicator) {
        var td = this.refs[indicator];

        if (td.props.children.length !== 0) {
            return;
        }

        this.props.tiles[indicator] = this.props.turn;
        this.props.moves += 1;
        this.props.score[this.props.turn] += indicator;

        this.setState(this.props);

        if (checkWinningState(getWinsArray(this.props.tiles, this.props.size), this.props.turn)) {
            if (this.props.turn === 'X') {
                if (this.props.players[0] === playerName) {
                    endGame(playerName);
                } else {
                    endGame(this.props.players[1]);
                }
            } else {
                if (this.props.players[1] === playerName) {
                    endGame(playerName);
                } else {
                    endGame(this.props.players[0]);
                }
            }
            return;
        } else
        if (this.props.moves === Math.pow(this.props.size, 2)) {
            console.log("Game is tied!");
            endGame('Tied');
        } else {
            this.props.turn = this.props.turn === "X" ? "O" : "X";
            move(this.props);
        }
    },

    render: function () {
        var rows = [],
            indicator = 1;

        for (var i = 0; i < this.props.size; i++) {
            var columns = [];
            for (var j = 0; j < this.props.size; j++) {
                var options = {
                    key: indicator,
                    ref: indicator,
                    className: 'tile',
                    style: {
                        width: '50px',
                        height: '50px',
                        border: '1px solid gray',
                        textAlign: 'center',
                        padding: '0px'
                    }
                };

                if (this.props.turn === 'X') {
                    if (this.props.players[0] === playerName) {
                        options['onClick'] = this.set.bind(this, indicator);
                        options['onTouchStart'] = this.set.bind(this, indicator);
                    }
                } else {
                    if (this.props.players[1] === playerName) {
                        options['onClick'] = this.set.bind(this, indicator);
                        options['onTouchStart'] = this.set.bind(this, indicator);
                    }
                }

                columns.push(td(options, this.props.tiles[indicator]));
                indicator += indicator;
            }
            rows.push(tr({
                className: 'row',
                key: i
            }, columns));
        }

        var xPlayerOptions = {
            className: this.props.turn === 'X' ? 'name active' : 'name',
            id: 'x-player',
            key: 'x-player'
        };

        var oPlayerOptions = {
            className: this.props.turn === 'O' ? 'name active' : 'name',
            id: 'o-player',
            key: 'o-player'
        };

        var divChildren = [
            div(xPlayerOptions, this.props.players[0] ? 'X: ' + this.props.players[0] : 'X: '),
            div(oPlayerOptions, this.props.players[1] ? 'O: ' + this.props.players[1] : 'O: '),
            table({
                className: "ttt",
                key: 'tableKey',
                style: {
                    margin: '0 auto'
                }
            }, rows)
        ];
        return div({
            className: 'ttt-container'
        }, divChildren);
    },
});

function renderTTT(turn, size, score, moves, wins, tiles, players) {
    React.render(< App size = {
        size
    }
        turn = {
            turn
        }
        score = {
            score
        }
        moves = {
            moves
        }
        wins = {
            wins
        }
        tiles = {
            tiles
        }
        players = {
            players
        }/>, document.getElementById('game'));
}


function checkWinningState(data, marker) {
    var valueToCheck = marker === 'X' ? 1 : 2;
    var result = false;
    var diagonalsArray = [true, true];

    // Check in every row
    result = data.find(function (row) {
        return _every(row, valueToCheck);
    });
    if (result) {
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


function getWinsArray(tiles, size) {
    var result = [];
    var i, j = 0, row = [];
    for (var i = 0; i < Math.pow(size, 2); i++) {
        var key = Math.pow(2, i);
        row.push(tiles[key] === '' ? 0 : tiles[key] === 'X' ? 1 : 2);
        j++;

        if (j === size) {
            result.push(row);
            j = 0;
            row = [];
        }
    }
    return result;
}