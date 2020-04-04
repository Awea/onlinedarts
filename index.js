var express=require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
app.use(express.static('static/'));
var ejs = require('ejs');
// set the view engine to ejs
app.set('view engine', 'ejs');
var Game = require('./game.js')
var Rooms = require('./rooms.js')

// On va passer des templates au client
fs = require('fs')
var roomTemplates = {
  tableState0: fs.readFileSync(__dirname + '/views/partials/table-state-0.ejs', 'utf-8'),
  tableState2: fs.readFileSync(__dirname + '/views/partials/table-state-2.ejs', 'utf-8'),
}
var homeTemplates = {
  cardRoom: fs.readFileSync(__dirname + '/views/partials/card-room.ejs', 'utf-8'),
}

var rooms = new Rooms;
rooms.createNewRoom("test","")

// Les vues

app.get('/', function(req, res){
  res.render('home', {rooms: rooms.toClient(), templates: homeTemplates});
});

app.get('/room/:roomId', function(req, res){
  var room = rooms.getRoomById(req.params.roomId)
  if (room == undefined){
    res.redirect('/');
  }else{
  res.render('room', {room:room.toClient(), game: room.game, templates: roomTemplates});
  }
});


// sockets

io.on('connection', function(socket){
  socket.join('home');
  io.emit('update-rooms', rooms.toClient());

  socket.on('join-room', function(roomId){
    var room = rooms.getRoomById(roomId)
    if (room == undefined){
      return false
    }
    socket.join(room.id)
    io.emit('update-game', room.game);
  });

  // home

  socket.on('create-room', function(datas){
    var room = rooms.createNewRoom(datas.roomName, datas.password)
    io.emit('update-rooms', rooms.toClient());
  });


  // game things
  // all io.emit will pass game object. This way we are clear game state is always same for all clients
  socket.on('new-player', function(datas){
    var room = rooms.getRoomById(datas.roomId)
    if (room == undefined){
      return false
    }
    room.game.createPlayer(datas.playerName);
    io.to(room.id).emit('change-players', room.game);
  });

  socket.on('remove-player', function(datas){
    var room = rooms.getRoomById(datas.roomId)
    if (room == undefined){
      return false
    }
    room.game.removePlayer();
    io.to(room.id).emit('change-players', room.game);
  });

  socket.on('start-game', function(datas){
    var room = rooms.getRoomById(datas.roomId)
    if (room == undefined){
      return false
    }
    room.game.startGame()
    io.to(room.id).emit('change-game-state', room.game);
  });

  socket.on('valide-volee', function(datas){
    var room = rooms.getRoomById(datas.roomId)
    if (room == undefined){
      return false
    }
    var darts = datas.darts
    var game = room.game
    if (game.state !== 2){
      return false
    }
    game.scoreVolee(darts)
    if (game.state == 3){
      // game is finished!
      io.emit('change-game-state', game);
    } else {
      game.activePlayer = game.getNextPlayer()
      io.emit('update-game', game);
    }
  });

  socket.on('cancel-volee', function(datas){
    var room = rooms.getRoomById(datas.roomId)
    if (room == undefined){
      return false
    }
    game.cancelVolee()
    io.emit('update-game', room.game)
  });

  socket.on('new-game', function(datas){
    var room = rooms.getRoomById(datas.roomId)
    if (room == undefined){
      return false
    }
    room.game = new Game()
    io.emit('change-game-state', room.game)
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
http.listen(port);
