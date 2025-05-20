# Smart Egg Incubator - IoT Based

## Deskripsi Proyek
Simulasi ini merepresentasikan Smart Egg Incubator berbasis IoT yang dijelaskan dalam proposal. Sistem ini menggunakan ESP32 sebagai kontroler utama untuk memantau dan mengatur suhu serta kelembapan dalam inkubator telur secara otomatis. Data dapat dipantau secara real-time melalui koneksi MQTT.

## Komponen yang Digunakan
- ESP32 DevKit V1: Mikrokontroler utama dengan konektivitas WiFi
- DHT22: Sensor untuk memantau suhu dan kelembapan
- Relay Module: Mengontrol elemen pemanas
- LED (merah dan biru): Indikator suhu dan kelembapan
- Buzzer: Untuk memberikan peringatan
- LCD 16x2 dengan I2C: Untuk menampilkan status dan data secara lokal

## Fitur Utama
1. **Monitoring Otomatis**: Memantau suhu dan kelembapan secara real-time
2. **Kontrol Suhu**: Mengatur elemen pemanas untuk menjaga suhu pada rentang ideal (37.3°C - 38.0°C)
3. **Indikator Kelembapan**: Memantau kelembapan pada rentang ideal (55% - 65%)
4. **Konektivitas IoT**: Mengirim data ke cloud melalui MQTT untuk pemantauan jarak jauh
5. **Sistem Peringatan**: Memberikan peringatan jika kondisi menjadi abnormal
6. **Display Lokal**: Menampilkan informasi aktual pada LCD

## Cara Menjalankan Simulasi
1. Buka proyek ini di VSCode dengan ekstensi Wokwi
2. Jalankan simulasi dengan menekan tombol "Start Simulation"
3. Pantau data pada Serial Monitor dan simulasi visual Wokwi

## Pengujian Fitur
- Untuk mensimulasikan kondisi suhu tinggi, kirim pesan MQTT ke topic `smartincubator/control` dengan payload:
  ```json
  {"simulate_high_temp": true}
  ```
- Untuk kembali ke pembacaan normal:
  ```json
  {"simulate_high_temp": false}
  ```

## Konfigurasi
Beberapa nilai yang dapat dikonfigurasi dalam kode:
- Ambang batas suhu: `TEMP_MIN` dan `TEMP_MAX`
- Ambang batas kelembapan: `HUM_MIN` dan `HUM_MAX`
- Pengaturan MQTT: `mqtt_server`, `topic_temp`, dll.

## Lisensi
Proyek ini dibuat oleh Hasan Fadhli Robbi (2340506080) untuk tujuan pembelajaran.

---

*Catatan: Untuk implementasi nyata, diperlukan beberapa penyesuaian seperti kalibrasi sensor, pengujian dalam kondisi lingkungan yang sebenarnya, dan penanganan daya yang lebih baik.*