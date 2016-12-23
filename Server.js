// var express = require('express');
// var app = express();
// var sv = require('http').createServer(app);
// var io = require('socket.io').listen(sv);
//
// sv.listen(process.env.PORT || 5000);
//

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');

var userList = [];
var typingUsers = {};

app.get('/', function(req, res){
    res.sendFile(__dirname + '/welcome.html');
});

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

http.listen(5000, function(){
  console.log('Listening on port :5000');
});


io.on('connection', function(clientSocket){
  console.log('Unregistered connected');

  clientSocket.on('disconnect', function(){
    console.log('user disconnected');

    var clientNickname;
    for (var i=0; i<userList.length; i++) {
      if (userList[i]["id"] == clientSocket.id) {
        userList[i]["isConnected"] = false;
        clientNickname = userList[i]["nickname"];
        break;
      }
    }

    delete typingUsers[clientNickname];
    io.emit("userList", userList);
    io.emit("userExitUpdate", clientNickname);
    io.emit("userTypingUpdate", typingUsers);
  });


  clientSocket.on("exitUser", function(clientNickname){
    for (var i=0; i<userList.length; i++) {
      if (userList[i]["id"] == clientSocket.id) {
        userList.splice(i, 1);
        break;
      }
    }
    io.emit("userExitUpdate", clientNickname);
  });


  clientSocket.on("chatMessage", function(clientNickname, message){
    var currentDateTime = new Date().toLocaleString();
    console.log(message);
    delete typingUsers[clientNickname];
    io.emit("userTypingUpdate", typingUsers);
    io.emit('newChatMessage', clientNickname, message, currentDateTime);
  });




  clientSocket.on("chatMessage2", function(message){
    console.log(message);
    // var currentDateTime = new Date().toLocaleString();
    var messObj = JSON.parse(message);
    // console.log(messObj);
    

    // delete typingUsers[clientNickname];
    // io.emit("userTypingUpdate", typingUsers);
    // io.emit('newChatMessage', clientNickname, message, currentDateTime);
  });



  // clientSocket.on('chatMessage', function(clientNickname, message){
  //   var currentDateTime = new Date().toLocaleString();
  //   delete typingUsers[clientNickname];
  //   io.emit("userTypingUpdate", typingUsers);
  //   io.emit('newChatMessage', clientNickname, message, currentDateTime);
  // });
  clientSocket.on("registerWithUserName",function (clientNickname,callback) {
    var userInfo = {};
    var foundUser = false;
    var error = null;
    for (var i=0; i<userList.length; i++) {
      if (userList[i]["nickname"] == clientNickname) {
        userList[i]["isConnected"] = true
        userList[i]["id"] = clientSocket.id;
        userInfo = userList[i];
        foundUser = true;
        error = "The nickname has been taken!... Please pick another."
        console.log(error);
        break;
      }
    }


    if (!foundUser) {
      userInfo["created"] = true
      userInfo["id"] = clientSocket.id;
      userInfo["nickname"] = clientNickname;
      userInfo["isConnected"] = true
      userList.push(userInfo);
    }
    var info = {
        info  : userInfo,
        error: error
    }
    console.log(JSON.stringify(info));

    return callback(info);
  });
  clientSocket.on("findingUsername",function (clientNickname,callback) {
    var isAvailable = true;
    for (var i=0; i<userList.length; i++) {
      if (userList[i]["nickname"] == clientNickname) {
        isAvailable = false;
        break;
      }
    }
    return callback(isAvailable);
  });



  clientSocket.on("connectUser", function(clientNickname) {
    var message = "User " + clientNickname + " was connected.";
    console.log(message);

    var userInfo = {};
    var foundUser = false;
    for (var i=0; i<userList.length; i++) {
      if (userList[i]["nickname"] == clientNickname) {
        userList[i]["isConnected"] = true
        userList[i]["id"] = clientSocket.id;
        userInfo = userList[i];
        foundUser = true;
        break;
      }
    }

    if (!foundUser) {
      userInfo["id"] = clientSocket.id;
      userInfo["nickname"] = clientNickname;
      userInfo["isConnected"] = true
      userList.push(userInfo);
    }

    io.emit("userList", userList);
    io.emit("userConnectUpdate", userInfo)
  });


  clientSocket.on("startType", function(clientNickname){
    console.log("User " + clientNickname + " is writing a message...");
    typingUsers[clientNickname] = 1;
    io.emit("userTypingUpdate", typingUsers);
  });


  clientSocket.on("stopType", function(clientNickname){
    console.log("User " + clientNickname + " has stopped writing a message...");
    delete typingUsers[clientNickname];
    io.emit("userTypingUpdate", typingUsers);
  });

});
