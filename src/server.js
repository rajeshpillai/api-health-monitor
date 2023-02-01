const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const axios = require("axios");

io.on('connection', (socket) => {
  console.log('a client connected');

  // emit the latest API status when a client connects
  socket.emit('apiStatus', apiStatus);
});

let apiStatus = {};
const apiEndpoints = [
  { id: 1, name: 'API 1', endpoint: 'https://api1.com/status' },
  { id: 2, name: 'API 3', endpoint: 'https://jsonplaceholder.typicode.com/todos/1'},
  { id: 3, name: 'API 4', endpoint: 'https://jsonplaceholder.typicode.com/posts/1'},
  { id: 4, name: 'API 5', endpoint: 'https://api2.com/status' },
];

const checkApiStatus = () => {
  apiEndpoints.forEach(api => {
    const { id, name,  endpoint } = api;
    console.log(`Checking ${name}...`);

    const start = Date.now();
    axios
      .get(endpoint)
      .then(response => {
        const responseTime = Date.now() - start;
        if (response.status >= 200 && response.status < 300) {
          apiStatus[id] = {
            id: id, 
            name: name,
            status: '💚',
            endpoint: endpoint,
            responseTime: responseTime,
            lastHealthy: new Date()
          };
        } else {
          apiStatus[id] = {
            id: id, 
            name: name,
            status: '❤️',
            endpoint: endpoint,
            responseTime: responseTime
          };
        }
        io.emit('apiStatus', apiStatus);
      })
      .catch(error => {
        apiStatus[id] = {
          id: id, 
          name: name,
          status: '❤️',
          endpoint: endpoint,
          error: error.message
        };
        io.emit('apiStatus', apiStatus);
      });
  });
};

const MONITORING_FREQUENCY = 5 * 1000; // check API status every 5 seconds

setInterval(() => {
  checkApiStatus();
}, MONITORING_FREQUENCY);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
