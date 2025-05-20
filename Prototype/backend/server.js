const express = require('express');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartIncubator', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Define MongoDB schema and models
const readingSchema = new mongoose.Schema({
  type: String,  // "temperature" or "humidity"
  value: Number,
  unit: String,
  heaterState: Boolean,
  timestamp: { type: Date, default: Date.now }
});

const alertSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  message: String,
  resolved: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

const Reading = mongoose.model('Reading', readingSchema);
const Alert = mongoose.model('Alert', alertSchema);

// Connect to MQTT broker
const mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://test.mosquitto.org:1883');

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('smartincubator/temperature');
  mqttClient.subscribe('smartincubator/humidity');
  mqttClient.subscribe('smartincubator/status');
});

// Handle MQTT messages
mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log(`Received from ${topic}:`, data);
    
    if (topic === 'smartincubator/temperature') {
      // Store temperature reading
      const reading = new Reading({
        type: 'temperature',
        value: data.value,
        unit: data.unit,
        heaterState: data.heater
      });
      await reading.save();
      
      // Emit to connected clients
      io.emit('temperature', data);
    }
    else if (topic === 'smartincubator/humidity') {
      // Store humidity reading
      const reading = new Reading({
        type: 'humidity',
        value: data.value,
        unit: data.unit
      });
      await reading.save();
      
      // Emit to connected clients
      io.emit('humidity', data);
    }
    else if (topic === 'smartincubator/status' && data.alert) {
      // Handle alert
      const alert = new Alert({
        temperature: data.temperature,
        humidity: data.humidity,
        message: `Alert: Temperature: ${data.temperature}°C, Humidity: ${data.humidity}%`
      });
      await alert.save();
      
      // Emit alert to connected clients
      io.emit('alert', alert);
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});

// API routes
app.get('/api/readings', async (req, res) => {
  try {
    const { type, limit = 100 } = req.query;
    let query = {};
    
    if (type) {
      query.type = type;
    }
    
    const readings = await Reading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
      
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const { resolved, limit = 20 } = req.query;
    let query = {};
    
    if (resolved !== undefined) {
      query.resolved = resolved === 'true';
    }
    
    const alerts = await Alert.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
      
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});