var Game = require('./game.js')

function Room(id, name, password){
  this.name = name;
  this.sockets = [];
  this.jitsiUrl = "";
  this.password = password;
  this.game = new Game;
  this.id = id;
  this.toClient = function(){
    return {
      name: this.name,
      game: this.game,
      private: this.password.length > 0,
      id: this.id,
    }
  }

  this.login = function(password, id){
    if (password == this.password){
      this.sockets.push(id);
      return true;
    } else {
      return false;
    }
  }

  this.isAuth = function(id){
    return (this.password.length == 0) || (this.sockets.includes(id))
  }
};

class Rooms extends Array {
  createNewRoom(name, password){
    // create a new room with the given name and password.
    if (this.some(r => r.name == name)){
      // we already have a room with the same name.
      return false;
    }
    var room = new Room(this.length, name, password);
    this.push(room)
    return room;
  }

  toClient(){
    // prepare all rooms to be send to clients
    return this.map(r => r.toClient())
  }

  getRoomById(id){
    return this.find(r => r.id == id)
  }

  getRoomAndCheckAuth(roomId, socketId){
    // try to get room by its id and check if sockit is auth
    // returns the room if both check pass and false otherwise
    var room = this.getRoomById(roomId)
    if ((room != undefined) && (room.isAuth(socketId))){
      return room
    } else {
      return false
    }
  }
}



module.exports = Rooms;
