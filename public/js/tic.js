var DOM = React.DOM,
    div = DOM.div,
    button = DOM.button,
    table = DOM.table,
    tr = DOM.tr,
    td = DOM.td;

var App = React.createClass({
    getInitialState: function() {
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


    win: function(score) {
        var i;
        for (i = 0; i < this.props.wins.length; i += 1) {
            if ((score) === this.props.wins[i]) {
                return true;
            }
        }
        return false;
    },

    set: function(indicator) {
        var td = this.refs[indicator];

        if (td.props.children.length !== 0) {
            return;
        }

        this.props.tiles[indicator] = this.props.turn;
        this.props.moves += 1;
        this.props.score[this.props.turn] += indicator;

        this.setState(this.props);

        if (this.win(this.props.score[this.props.turn])) {
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
        } else if (this.props.moves === Math.pow(this.props.size, 2)) {
            console.log("Game is tied!");
            endGame('Tied');
        } else {
            this.props.turn = this.props.turn === "X" ? "O" : "X";
            move(this.props);
        }
    },

    render: function() {
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
    React.render( < App size = {
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
        }
        />, document.getElementById('game'));
    }