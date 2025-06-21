'use strict';

let socket;
let isActive = false;
let RotationMatrix = m4.identity();
let lastTimestamp = null;
const E = 0.01;

function connectToSensorServer(ip) {
    if (socket) {
        socket.close();
    }

    const statusElement = document.getElementById('connectionStatus');
    socket = new WebSocket(`ws://${ip.trim()}:8080/sensor/connect?type=android.sensor.orientation`);

    let pingInterval;

    socket.onopen = function() {
        statusElement.textContent = "Connected";
        statusElement.style.color = "green";
        isActive = true;

        pingInterval = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ action: "ping" }));
            }
        }, 5000);
    };

    socket.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.values && Array.isArray(data.values)) {
                processOrientationData(data.values);
            }
        } catch (e) {
            console.error("Error parsing orientation data:", e);
        }
    };

    socket.onerror = function(error) {
        statusElement.textContent = "Connection Error";
        statusElement.style.color = "red";
    };

    socket.onclose = function(event) {
        statusElement.textContent = "Disconnected";
        statusElement.style.color = "red";
        isActive = false;
        clearInterval(pingInterval);
    };
}

function processOrientationData(values) {
    const azimuth = values[0]; 
    const pitch = values[1];   
    const roll = values[2];    

    const z = azimuth * Math.PI / 180;
    const x = pitch   * Math.PI / 180;
    const y = roll    * Math.PI / 180;

    const Rz = m4.zRotation(z);
    const Rx = m4.xRotation(x);
    const Ry = m4.yRotation(y);

    RotationMatrix = m4.multiply(m4.multiply(Rz, Rx), Ry);
}

function getRotationMatrix() {
    return RotationMatrix;
}

function getIsActive() {
    return isActive;
}

function resetRotation() {
    RotationMatrix = m4.identity();
    lastTimestamp = null;
} 