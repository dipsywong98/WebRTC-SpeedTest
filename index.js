var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

global.Blob = require("blob-polyfill").Blob;
global.FileReader = require("./filereader");
global.File = false;

const peerjs = require("peerjs-nodejs");
const { ExpressPeerServer } = require("peer");

global.postMessage = (...arg) => console.log(arg);

var str2ab = require("string-to-arraybuffer");
var ab2str = require("arraybuffer-to-string");

var BufferFactory = () => "";

var protobuf = require("protobufjs");
protobuf.load("./static/message.proto", (err, root) => {
  if (!!err) {
    console.log(err);
    return;
  }
  var Message = root.lookupType("Message");
  var message = Message.create({ content: "hello world" });
  var buffer = Message.encode(message).finish();
  console.log(buffer, buffer.length);
  console.log(Message.decode(buffer).content);
  BufferFactory = content =>
    Message.encode(Message.create({ content })).finish();
});

const PORT = 7648;

//https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid(length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

//https://stackoverflow.com/questions/11725691/how-to-get-a-microtime-in-node-js
const now = unit => {
  const hrTime = process.hrtime();

  switch (unit) {
    case "milli":
      return hrTime[0] * 1000 + hrTime[1] / 1000000;

    case "micro":
      return hrTime[0] * 1000000 + hrTime[1] / 1000;

    case "nano":
      return hrTime[0] * 1000000000 + hrTime[1];

    default:
      return hrTime[0] * 1000000000 + hrTime[1];
  }
};

http.listen(PORT, () => {
  console.log("listening on " + PORT);
});

// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/index.html");
// });

app.use("/", express.static("static"));

io.on("connection", function(socket) {
  console.log(socket.id + " connected socketio");
  socket.on("test", data => {
    let cnt = 0;
    let start = now("milli");
    while (1) {
      socket.emit("msg", cnt + makeid(100));
      cnt++;
      if (now("milli") - start > 1000) break;
    }
    console.log(`delivered ${cnt} messages`);
    socket.emit("cnt", cnt);
  });
});

app.use("/peer", ExpressPeerServer(http, { debug: true }));

let peer = peerjs("server", { host: "localhost", port: PORT, path: "/peer" });
peer.on("connection", conn => {
  conn.serialization = "none";

  let buf = BufferFactory(makeid(100));
  global.File = buf.constructor;
  setTimeout(() => {
    conn.send(buf);
    conn.send("hello");
  }, 1000);

  conn.on("data", data => {
    if (data === "test") {
      let cnt = 0;
      let start = now("milli");
      // while (1) {
      let buf = BufferFactory(cnt + makeid(100));
      global.File = buf.constructor;
      conn.send(buf);
      // conn.send(cnt + makeid(100));
      // cnt++;
      // if (now("milli") - start > 1000) break;
      // }
      // console.log(`delivered ${cnt} messages`);
    }
    console.log(data);
  });
});
