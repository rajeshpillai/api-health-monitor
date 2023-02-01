const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const axios = require("axios");


const MONITORING_FREQUENCY = 5 * 1000; // check API status every 5 seconds

const StatusIcon = {
  Success: "💚",
  Failure: "💔"
}

io.on('connection', (socket) => {
  console.log('a client connected');

  // emit the latest API status when a client connects
  socket.emit('apiStatus', apiStatus);
});


let apiStatus = {};

const apiEndpoints = [
  { id: 1, name: 'API 1', endpoint: 'http://api1.com/status' },
  { id: 2, name: 'API 2', endpoint: 'https://jsonplaceholder.typicode.com/posts/1'},
  { id: 2.1, name: 'Source API 1', endpoint: 'https://jsonplaceholder.typicode.com/posts/1/comments' },
  { id: 3, name: 'API 3', endpoint: 'https://jsonplaceholder.typicode.com/todos/1'},
  { id: 4, name: 'API 4', endpoint: 'https://jsonplaceholder.typicode.com/posts/1'},
  { id: 5, name: 'API 5', endpoint: 'http://api2.com/status' },
  { id: 6, name: 'API 6', endpoint: 'https://jsonplaceholder.typicode.com/posts/3'},
];

const monitorApi = async () => {
  console.log(`Total API Endpoints ${apiEndpoints.length}`);
  for (let i = 0; i < apiEndpoints.length; i++) {
    const api = apiEndpoints[i];
    const { id, name, endpoint, sources } = api;
    console.log(`Checking ${name}...`);

    const start = Date.now();
    try {
      const response = await axios.get(endpoint);
      const responseTime = Date.now() - start;
      if (response.status >= 200 && response.status < 300) {
        apiStatus[id] = {
          id: id,
          name: name,
          status: StatusIcon.Success,
          endpoint: endpoint,
          responseTime: responseTime,
          lastHealthy: new Date(),
        };

        io.emit('apiStatus', apiStatus);
      } else {
        apiStatus[id] = {
          id: id,
          name: name,
          status: StatusIcon.Failure,
          endpoint: endpoint,
          responseTime: responseTime,
          error: response.status
        };

        io.emit('apiStatus', apiStatus);
      }
    } catch (e) {
        console.log("ERROR: ", e.message);
        apiStatus[id] = {
          id: id,
          name: name,
          status: StatusIcon.Failure,
          endpoint: endpoint,
          error: e.message,
       };
       io.emit('apiStatus', apiStatus);
    }
  }

  setTimeout(() => {
    monitorApi();
  }, MONITORING_FREQUENCY);

}


setTimeout(() => {
  monitorApi();
}, MONITORING_FREQUENCY);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
