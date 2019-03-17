var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

global.Blob = require("blob-polyfill").Blob;
global.FileReader = require("./filereader");

const peerjs = require("peerjs-nodejs");
const { ExpressPeerServer } = require("peer");

global.postMessage = (...arg) => console.log(arg);

var str2ab = require("string-to-arraybuffer");
var ab2str = require("arraybuffer-to-string");

const PORT = 7648;

//https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid(length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

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

app.use("/peer", ExpressPeerServer(http));

let peer = peerjs("server", { host: "localhost", port: PORT, path: "/peer" });
peer.on("connection", conn => {
  conn.serialization = "none";
  conn.on("data", data => {
    // console.log(data);
    // console.log(ab2str(data));
    // conn.send(data);
    // conn.send(data);
    // conn.send(123);
    // console.log(str2ab("4567"));
    // conn.send(str2ab("4567"));
    if (data === "test") {
      let cnt = 0;
      let start = now("milli");
      while (1) {
        conn.send(cnt + makeid(100));
        cnt++;
        if (now("milli") - start > 1000) break;
      }
      console.log(`delivered ${cnt} messages`);
      // conn.send({ cnt });
    }
  });
});
