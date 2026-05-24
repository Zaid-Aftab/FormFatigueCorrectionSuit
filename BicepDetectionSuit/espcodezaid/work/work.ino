/*
  RepSense ESP32 — Final Firmware
  --------------------------------
  Chrome connects directly via Web Bluetooth API.
  No Python BLE needed anymore.

  Packet format: "emg_raw,ax,ay,az"
  Example:       "2145,0.12,9.73,0.45"

  For TEST (no sensors): set USE_REAL_SENSORS to 0
  For REAL hardware: set USE_REAL_SENSORS to 1

  Arduino IDE:
    - Board: ESP32 Dev Module
    - Libraries: Adafruit MPU6050, Adafruit Unified Sensor
*/

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ── CONFIG ──────────────────────────────────────────────────────────────────
#define USE_REAL_SENSORS 1  // Real sensors connected
#define DEVICE_NAME      "RepSense"
#define SERVICE_UUID     "12345678-1234-1234-1234-123456789abc"
#define CHAR_UUID        "abcd1234-ab12-ab12-ab12-abcdef123456"
#define EMG_PIN          34

#if USE_REAL_SENSORS
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
Adafruit_MPU6050 mpu;
#endif

BLEServer*         pServer         = nullptr;
BLECharacteristic* pChar           = nullptr;
bool               deviceConnected = false;
bool               oldConnected    = false;
int                counter         = 0;

class ServerCB : public BLEServerCallbacks {
  void onConnect(BLEServer* s) override {
    deviceConnected = true;
    Serial.println("BLE: client connected");
  }
  void onDisconnect(BLEServer* s) override {
    deviceConnected = false;
    Serial.println("BLE: client disconnected");
    BLEDevice::startAdvertising();
  }
};

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("RepSense starting...");

#if USE_REAL_SENSORS
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  Wire.begin(21, 22);
  
  if (!mpu.begin()) {
    Serial.println("MPU6050 error!");
    while(1);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
#endif

  // ── BLE setup ──
  BLEDevice::init(DEVICE_NAME);
  BLEDevice::setMTU(64);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCB());

  BLEService* pService = pServer->createService(SERVICE_UUID);
  pChar = pService->createCharacteristic(
    CHAR_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pChar->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising* pAdv = BLEDevice::getAdvertising();
  pAdv->addServiceUUID(SERVICE_UUID);
  pAdv->setScanResponse(true);
  pAdv->setMinPreferred(0x06);
  pAdv->setMaxPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("Advertising as 'RepSense' — open Chrome and connect");
}

void loop() {
  if (!deviceConnected && oldConnected) {
    delay(500);
    BLEDevice::startAdvertising();
    oldConnected = false;
  }
  if (deviceConnected && !oldConnected) {
    oldConnected = true;
  }

  if (deviceConnected) {
    char buf[64];
    int   emgRaw;
    float ax, ay, az;

#if USE_REAL_SENSORS
    // ── REAL DATA ───────────────────────────────────────────────────────────
    emgRaw = analogRead(EMG_PIN);
    sensors_event_t accel, gyro, temp;
    mpu.getEvent(&accel, &gyro, &temp);
    ax = accel.acceleration.x;
    ay = accel.acceleration.y;
    az = accel.acceleration.z;
#else
    // ── SIMULATED DATA (no sensors) ──────────────────────────────────────────
    //float t = counter * 0.02f;
    //emgRaw = (int)(2000 + 1500 * abs(sin(t)));
    //ax = 0.5f  * sin(t * 0.7f);
    //ay = 9.0f  + 0.8f * cos(t);
    //az = 0.3f  * sin(t * 1.2f);
#endif

    snprintf(buf, sizeof(buf), "%d,%.3f,%.3f,%.3f", emgRaw, ax, ay, az);
    pChar->setValue(buf);
    pChar->notify();
    Serial.println(buf);
    counter++;
  }

  delay(2); // 500Hz
}
