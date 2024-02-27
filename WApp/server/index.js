// index.js
const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const app = express();
const port = 3000;
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

app.use(cors());

app.get("/", (req, res) => {
    res.send("<h1>Server Side !</h1>");
});

server.listen(3000, () => {
    console.log("Listening on *:3000");
});

// Define allSessionsObject globally
const allSessionsObject = {};

// Function to delete a WhatsApp session
const deleteWhatsappSession = (id) => {
    const sessionDirectoryName = `session-${id}`;
    const sessionDirectoryPath = path.join(__dirname, './SessionStore', sessionDirectoryName);

    if (fs.existsSync(sessionDirectoryPath)) {
        // Use fs.rmdirSync() to remove the directory
        fs.rmdirSync(sessionDirectoryPath, { recursive: true });
        console.log(`Session ${id} deleted.`);
    } else {
        console.log(`Session ${id} not found.`);
    }
};

// Function to create a WhatsApp session
const createWhatsappSession = (id, socket) => {
    // const savedSessions = new Map(); // Map to store session data
    const client = new Client({
        puppeteer: { headless: true },
        authStrategy: new LocalAuth({ 
            clientId: id,
            dataPath: 'SessionStore' 
        })
    });

    // Listen for QR code event
    client.on('qr', (qr) => {
        console.log("QR RECEIVED", qr);
        socket.emit('qr', { qr });
    });

    // Listen for authenticated event
    client.on('authenticated', () => {
        console.log("AUTHENTICATED");
    });

    // Listen for ready event
    client.on('ready', () => {
        console.log("Client is ready");
        allSessionsObject[id] = client;
        io.emit('ready', { id, message: 'Client is ready!' });
    });

    client.initialize();
};

// Socket.IO connection event
io.on("connection", (socket) => {
    console.log("a user connected", socket?.id);
    // Listen for disconnect event
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });

    socket.on('Connected', (data) => {
        console.log('connected to the server', data);
        socket.emit('hello', 'Hello from server');
    });

    // Listen for createSession event
    socket.on('createSession', (data) => {
        console.log(data);
        const { id } = data;
        createWhatsappSession(id, socket);
    });

    // Listen for deleteSession event
    socket.on('deleteSession', (id) => {
        console.log(`Deleting session ${id}`);
        deleteWhatsappSession(id);
    });


    // Listen for sendMessage event
    socket.on('sendMessage', (data) => {
        console.log('sendMessage', data);
        const { formattedContactNumber, textMessage } = data;
    
        // Find the client associated with the session ID
        const client = allSessionsObject[data.id];
        if (client) {
            client.sendMessage(formattedContactNumber, textMessage).then((response) => {
                console.log('Message sent successfully:', response);
                // You can emit a confirmation event here if needed
            })
            .catch((error) => {
                console.error('Error sending message:', error);
                // You can emit an error event here if needed
            });
        } 
        else {
            console.error('Client not found for session ID:', data.id);
            // You can emit an error event here if needed
        }
    });

});
