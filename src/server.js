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
  { name: 'API 1', endpoint: 'https://api1.com/status' },
  { name: 'API 3', endpoint: 'https://jsonplaceholder.typicode.com/todos/1'},
  { name: 'API 4', endpoint: 'https://jsonplaceholder.typicode.com/posts/1'},
  { name: 'API 5', endpoint: 'https://api2.com/status' },
];

const checkApiStatus = () => {
  apiEndpoints.forEach(api => {
    const { name, endpoint } = api;
    console.log(`Checking ${name}...`);

    const start = Date.now();
    axios
      .get(endpoint)
      .then(response => {
        const responseTime = Date.now() - start;
        if (response.status >= 200 && response.status < 300) {
          apiStatus[name] = {
            status: 'healthy',
            endpoint: endpoint,
            responseTime: responseTime,
            lastHealthy: new Date()
          };
        } else {
          apiStatus[name] = {
            status: 'unhealthy',
            endpoint: endpoint,
            responseTime: responseTime
          };
        }
      })
      .catch(error => {
        apiStatus[name] = {
          status: 'unhealthy',
          endpoint: endpoint,
          error: error.message
        };
      });
  });
};

const MONITORING_FREQUENCY = 5 * 1000; // check API status every 60 seconds
setInterval(() => {
  checkApiStatus();

  // emit the updated API status to all connected clients
  io.emit('apiStatus', apiStatus);
  console.log({apiStatus});

}, MONITORING_FREQUENCY);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
