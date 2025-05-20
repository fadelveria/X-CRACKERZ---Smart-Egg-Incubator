#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// Fungsi-fungsi yang dideklarasikan agar dikenal lebih awal
void setupWiFi();
void reconnectMQTT();
void callback(char* topic, byte* payload, unsigned int length);
void readSensorData();
void controlIncubator();
void updateDisplay();
void publishDataToMQTT();
void triggerAlert();


// Define constants for pins
#define DHT_PIN 15      // DHT22 sensor pin
#define DHT_TYPE DHT22  // Using DHT22 sensor
#define HEATER_RELAY_PIN 13 // Relay control pin for heater
#define RED_LED_PIN 2   // LED indicator for heating (red)
#define BLUE_LED_PIN 4  // LED indicator for humidity (blue)
#define BUZZER_PIN 12   // Buzzer pin for alerts

// Define temperature and humidity thresholds for hatching
#define TEMP_MIN 37.3  // Minimum temperature (Celsius)
#define TEMP_MAX 38.0  // Maximum temperature (Celsius)
#define HUM_MIN 55.0   // Minimum humidity (%)
#define HUM_MAX 65.0   // Maximum humidity (%)

// WiFi credentials
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MQTT Broker settings
const char* mqtt_server = "test.mosquitto.org";
const int mqtt_port = 1883;
const char* topic_temp = "smartincubator/temperature";
const char* topic_humidity = "smartincubator/humidity";
const char* topic_status = "smartincubator/status";
const char* topic_control = "smartincubator/control";
const char* client_id = "smart_egg_incubator_01";

// Create instances
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient espClient;
PubSubClient client(espClient);
LiquidCrystal_I2C lcd(0x27, 16, 2);  // Set the LCD address (usually 0x27) for a 16x2 display

// Global variables
float temperature = 0;
float humidity = 0;
bool heaterState = false;
unsigned long lastSensorReadTime = 0;
unsigned long lastMqttPublishTime = 0;
const long sensorReadInterval = 2000;    // Read sensor every 2 seconds
const long mqttPublishInterval = 10000;  // Publish data every 10 seconds
bool isAbnormal = false;
bool simulateHighTemp = false; // For testing purposes

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Initialize LCD
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Incubator");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  
  // Initialize pins
  pinMode(HEATER_RELAY_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BLUE_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Turn off heater initially
  digitalWrite(HEATER_RELAY_PIN, HIGH); // Relay module is active LOW
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(BLUE_LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Connect to WiFi
  setupWiFi();
  
  // Set MQTT server
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  Serial.println("Smart Egg Incubator initialized!");
  delay(2000);
  lcd.clear();
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }
  
  // Check MQTT connection
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // Read sensor data at regular intervals
  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorReadTime >= sensorReadInterval) {
    lastSensorReadTime = currentMillis;
    readSensorData();
    controlIncubator();
    updateDisplay();
  }
  
  // Publish data to MQTT broker at regular intervals
  if (currentMillis - lastMqttPublishTime >= mqttPublishInterval) {
    lastMqttPublishTime = currentMillis;
    publishDataToMQTT();
  }
  
  // Check for simulated high temperature (for testing)
  if (simulateHighTemp) {
    temperature = 39.5;  // Simulate high temperature
    controlIncubator();
    updateDisplay();
  }
}

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("");
    Serial.println("WiFi connection failed, operating in offline mode");
  }
}

void reconnectMQTT() {
  // Loop until we're reconnected
  int attempts = 0;
  while (!client.connected() && attempts < 5) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect(client_id)) {
      Serial.println("connected");
      // Once connected, subscribe to control topic
      client.subscribe(topic_control);
      
      // Publish initial status
      String status = "Smart Egg Incubator online!";
      client.publish(topic_status, status.c_str());
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
    attempts++;
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  // Handle messages received via MQTT
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
  
  if (String(topic) == topic_control) {
    DynamicJsonDocument doc(256);
    deserializeJson(doc, message);
    
    if (doc.containsKey("simulate_high_temp")) {
      simulateHighTemp = doc["simulate_high_temp"].as<bool>();
      Serial.print("Setting simulate high temp to: ");
      Serial.println(simulateHighTemp);
    }
    
    // Add more control parameters as needed
  }
}

void readSensorData() {
  // Read temperature and humidity data from sensor
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();
  
  // Check if any reads failed
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println(F("Failed to read from DHT sensor!"));
    temperature = 0;
    humidity = 0;
    return;
  }
  
  Serial.print(F("Temperature: "));
  Serial.print(temperature);
  Serial.print(F("°C, Humidity: "));
  Serial.print(humidity);
  Serial.println(F("%"));
}

void controlIncubator() {
  // Control the heater based on temperature reading
  if (temperature < TEMP_MIN) {
    // Turn on heater
    digitalWrite(HEATER_RELAY_PIN, LOW);  // Relay is active LOW
    digitalWrite(RED_LED_PIN, HIGH);      // Turn on red LED
    heaterState = true;
    isAbnormal = false;
  } else if (temperature > TEMP_MAX) {
    // Turn off heater
    digitalWrite(HEATER_RELAY_PIN, HIGH); // Relay is active LOW (off)
    digitalWrite(RED_LED_PIN, LOW);       // Turn off red LED
    heaterState = false;
    
    // Check if temperature is too high (abnormal condition)
    if (temperature > TEMP_MAX + 1.0) {
      isAbnormal = true;
      triggerAlert();
    } else {
      isAbnormal = false;
    }
  }
  
  // Control humidity indicator
  if (humidity < HUM_MIN || humidity > HUM_MAX) {
    // Humidity out of range
    digitalWrite(BLUE_LED_PIN, HIGH);
    
    // Check if humidity is seriously out of range
    if (humidity < HUM_MIN - 10 || humidity > HUM_MAX + 10) {
      isAbnormal = true;
      triggerAlert();
    }
  } else {
    digitalWrite(BLUE_LED_PIN, LOW);
  }
}

void triggerAlert() {
  // Sound the buzzer for alerts
  digitalWrite(BUZZER_PIN, HIGH);
  delay(500);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Also send an alert via MQTT
  String alertMsg = "{\"alert\":true,\"temperature\":" + String(temperature) + 
                   ",\"humidity\":" + String(humidity) + "}";
  client.publish(topic_status, alertMsg.c_str());
}

void updateDisplay() {
  // Update LCD display with current readings
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(temperature, 1);
  lcd.print((char)223); // Degree symbol
  lcd.print("C");
  
  lcd.setCursor(0, 1);
  lcd.print("Hum: ");
  lcd.print(humidity, 1);
  lcd.print("%");
  
  // Show heater status
  lcd.setCursor(13, 0);
  if (heaterState) {
    lcd.print("HTR");
  }
  
  // Show alert if conditions are abnormal
  if (isAbnormal) {
    lcd.setCursor(13, 1);
    lcd.print("ALT");
  }
}

void publishDataToMQTT() {
  if (!client.connected()) {
    return;
  }
  
  // Create JSON document for temperature
  DynamicJsonDocument tempDoc(128);
  tempDoc["value"] = temperature;
  tempDoc["unit"] = "C";
  tempDoc["heater"] = heaterState;
  tempDoc["time"] = millis() / 1000;
  
  // Create JSON document for humidity
  DynamicJsonDocument humDoc(128);
  humDoc["value"] = humidity;
  humDoc["unit"] = "%";
  humDoc["time"] = millis() / 1000;
  
  // Serialize JSON to strings
  String tempJson, humJson;
  serializeJson(tempDoc, tempJson);
  serializeJson(humDoc, humJson);
  
  // Publish data
  client.publish(topic_temp, tempJson.c_str());
  client.publish(topic_humidity, humJson.c_str());
  
  Serial.println("Data published to MQTT broker");
}