const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const soketio = require("socket.io");

const io = soketio(server);

app.set('view engine', 'ejs');
app.set(express.static(path.join(__dirname, 'public',)));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
