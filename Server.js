var express = require('express');
var app = express();
var sv = require('http').createServer(app);
var io = require('socket.io').listen(sv);

sv.listen(process.env.PORT || 5000);


var userList = [];
var typingUsers = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/welcome.html');
    console.log('Socketio SV running...');
});

io.sockets.on('connection', function(socket){
  console.log('a Anonymous connected');
  var addedUser = false;



  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  socket.on('chatMessage', function(clientNickname, message){
    var currentDateTime = new Date().toLocaleString();
    delete typingUsers[clientNickname];
    console.log(message);
    socket.emit('newChatMessage', clientNickname, message, currentDateTime);
  });
  socket.on("startType", function(clientNickname){
    console.log("User " + clientNickname + " is writing a message...");
    typingUsers[clientNickname] = 1;
    var typingDetails = {
      nickName : clientNickname,
      isTyping : true
    }
    socket.emit("userTypingUpdate", typingDetails);
  });
  socket.on("stopType", function(clientNickname){
    console.log("User " + clientNickname + " has stopped writing a message...");
    delete typingUsers[clientNickname];
    var typingDetails = {
      nickName : clientNickname,
      isTyping : false
    }
    socket.emit("userTypingUpdate", typingDetails);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

  socket.on('new message', function (data) {
// emit new message
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

});
