/* Cell component */
var Cell = React.createClass({
    render: function () {
        var myFontSize = parseInt((10 / this.props.size)*2, 10) + 'em';
        var myStyle = {
            'fontSize': myFontSize
        };
        return (
            <td onClick={this._onClick} style={myStyle} width={100 / this.props.size + '%'} height={100 / this.props.size + '%'}>
                {this.props.data}
            </td>
        );
    },

    _onClick: function () {
        if (typeof this.props.onTurnPlayed === 'function') {
            this.props.onTurnPlayed(this.props.turn, this.props.rowNum, this.props.colNum);
        }
    }
});

/* Row component */
var playerMarker;
var playerMarker_name;
var Row = React.createClass({
    render: function () {
        var cells = [];
        var i;

        for (i = 0; i < this.props.size; i++) {
            cells.push(<Cell {...this.props} data={this.props.data[i]} key={i} colNum={i} />);
        }

        return (
            <tr>
                {cells}
            </tr>
        );
    }
});


/* Tic Tac Toe component */
var TicTacToe = React.createClass({
    propTypes: {
        size: React.PropTypes.number.isRequired,
        data: React.PropTypes.array.isRequired,
        onTurnPlayed: React.PropTypes.func,
        onRestart: React.PropTypes.func
    },

    getDefaultProps: function () {
        return {
            markerOne: 'X',
            markerTwo: 'O'
        };
    },

    render: function () {
        var rows = [];
        var i;
        var his ;
        for (i = 0; i < this.props.size; i++) {
            rows.push(<Row {...this.props} data={this.getMappedData(this.props.data[i]) } key={i} rowNum={i}/>);
        }
        var winner = this.props.winnerData.winner;
        return (
            <div>
                <h1>Tic Tac Toe</h1>
                <table>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
                <div id = "playerHistory" className="player_history">Last Winner was: {winner}</div>
                <div id="overlay" className="overlay"><label>Enter your Board grid size: </label><input type="number" id="board_size"  onChange={this._grid_size}></input></div>
                <div id="overlay_turn" className="overlay_turn"><b>Wait for your turn</b></div>
                <div className="information">
                    <div className="information_box">
                        <label>Player 1: </label>
                        <span className="marker">X</span>
                        <span id="turn_marker_X" className="turn_marker">&#x2713; </span>
                    </div>
                    <div className="information_box">
                        <label>Player 2: </label>
                        <span className="marker">O</span>
                        <span id="turn_marker_O" className="turn_marker">&#x2713; </span>
                    </div>
                </div>
                <span className="player_info">You are playing with <b id="player_marker">X</b></span>
                <div className="player_info_name"><label>Enter your name: </label><input id="player_marker_name"></input></div>                
                <div className="popup" id="popup">
                    <div className="content">
                        <div id="popupContent">You Won...</div>
                        <table>
                          <tr>
                           <td><button id="share" onClick={this._share_status}>Share your status</button><br></br></td>

                           <td><button id="restartGame" className="restartGame" onClick={this._restartGame}>Restart Game</button></td>
                          </tr>
                        </table>
                    </div>
                    <div className="fade"></div>
                </div>
            </div>
        );
    },

    _restartGame: function () {
        if (typeof this.props.onRestart === 'function') {
            this.props.onRestart();
        }
    },
    _grid_size: function() {
        var numSize = parseInt($("#board_size").val());
        if (numSize < 3){
            numSize = 3;
        }
            $.ajax({
              url: "/setSize",
              type: 'POST',
              data: {
                 "result":{
                    'size': numSize
                 }
              },
              success: function(data){
                console.log(data);
              },
              error:function(err){
                // console.log('error result ',data);
              }
            });


            setTimeout(function(){
                 $('#board_size').slideUp('slow').fadeOut(function() {
                     window.location.reload();
                 });
            }, 50);

    },
    _share_status: function() {
        if ($("#player_marker_name").val() === "")
        {
         var player_name = $("#player_marker_name").text();
        }
        else {
          var player_name = $("#player_marker_name").val();
        };
        $.ajax(
            {
                url: "/status",
                type: 'POST',
                data: {
                    "result":{
                        'winner': player_name,
                        'date': new Date()
                    }
                },
                success: function(data){
                    console.log(data);  
                },
                error:function(err){
                    //    console.log('error result ',data);
                }
            });
    },

    getMappedData: function (data) {
        var hash = {
            0: null,
            1: this.props.markerOne,
            2: this.props.markerTwo
        };

        return data.map(function (data) {
            return hash[data];
        });
    }
});

/* Main app component */
var App = React.createClass({
    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {
        this.socket = io();
        this._bindEvents();

        // Kick off game on load
        this.socket.emit('game:start');
            var _this = this;
            $.ajax(
            {
                url: "/history",

                type: 'get',
                success: function(data){
                    _this.setState({winnerData: data});
                    // console.log(data);
                    document.createElement
                    if (!$("#playerHistory")) {
                        console.log("div not found..");

                    }
                    $("#playerHistory").text("temporary text..")
                },
                error:function(data){
                    //    console.log('error result ',data);
                }
            });
    },

    componentWillUnmount: function() {
        this.socket.disconnect();
    },

    render: function () {
        return (this.state.data
            ? <TicTacToe
                size={this.state.size}
                winnerData={this.state.winnerData}
                turn={2}
                data={this.state.data}
                onTurnPlayed={this._onTurnPlayed}
                onRestart={this._onRestartGame} />
            : null);
    },

    _onTurnPlayed: function (turn, rowNum, colNum) {
        this.socket.emit('game:play:turn', this.state.marker, rowNum, colNum);
    },

    _onRestartGame: function() {
        this.socket.emit('game:restart');
    },

    _bindEvents: function() {
        var self = this;
        var  activePlayerMarker;

        this.socket.on('game:started', function (options) {
            if (document.getElementById('overlay')) {
                document.getElementById('overlay').style.display = 'none';
            }

            self.setState({
                data: options.data,
                size: options.size || self.state.size,
                marker: options.marker || self.state.marker,
                marker_name: options.marker_name || self.state.marker_name
            });

            document.getElementById('player_marker').innerHTML = options.marker;
            document.getElementById('player_marker_name').innerHTML = options.marker_name;
            $("#player_marker_name").change(function() {
                var player_name = $("#player_marker_name").val();
            });
            playerMarker = options.marker;
            playerMarker_name = options.marker_name;
        });

        this.socket.on('game:start:limit:exceeded', function () {
            alert('No slot available to play! Please check after some time :D');
        });

        this.socket.on('game:played:turn', function (updatedData) {
            self.setState({ data: updatedData });

            // Check for the winner
            self.socket.emit('game:check:winner', updatedData);
        });

        this.socket.on('game:played:turn:change', function (marker, oppmarker) {
            var turnOverlay = document.getElementById('overlay_turn');
            document.getElementById('turn_marker_' + marker).style.display = 'none';
            document.getElementById('turn_marker_' + oppmarker).style.display = 'inline-block';
            turnOverlay.style.display = (playerMarker === marker) ? 'block' : 'none';
        });

        this.socket.on('game:start:player:onhold', function () {
            document.getElementById('overlay').style.display = 'block';
        });

        this.socket.on('game:start:ready', function (options) {
            document.getElementById('overlay').style.display = 'none';
            document.getElementById('turn_marker_' + options.activeMarker).style.display = 'inline-block';
            activePlayerMarker = options.activeMarker;
            if (playerMarker !== activePlayerMarker) {
                document.getElementById('overlay_turn').style.display = 'block';
            }
        });

        this.socket.on('game:result', function (looser, winner) {
            var result = playerMarker === looser ? 'You loose...' : 'You Won...';
            if (playerMarker === looser) {
              $("#share").hide()
            }
            document.getElementById('popup').style.display = 'block';
            document.getElementById('popupContent').innerHTML = result;
        });

        this.socket.on('game:tie', function () {
            var result = 'Game Tie... ';
            document.getElementById('popup').style.display = 'block';
            document.getElementById('popupContent').innerHTML = result;
        });

        this.socket.on('game:restart:done', function() {
            window.location.reload();
        });
    }
});

ReactDOM.render(
    <App />,
    document.getElementById('content')
);
