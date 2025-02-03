const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const users = new Set(); // Track connected users
const rooms = new Map(); // Track chat rooms and their users

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        handleMessage(ws, data);
    });

    ws.on('close', () => {
        handleDisconnect(ws);
    });
});

function handleMessage(ws, data) {
    switch (data.type) {
        case 'join':
            handleJoin(ws, data.username);
            break;
        case 'createRoom':
            handleCreateRoom(ws, data.roomName);
            break;
        case 'joinRoom':
            handleJoinRoom(ws, data.room, data.username);
            break;
        case 'message':
            handleChatMessage(ws, data.room, data.username, data.message);
            break;
        // case 'leaveRoom':
        //     handleLeaveRoom(ws, data.room, data.username);
        //     break;
    }
}

function handleJoin(ws, username) {
    if (users.has(username)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Username already taken' }));
    } else {
        ws.username = username;
        users.add(username);
        ws.send(JSON.stringify({ type: 'joinSuccess', username }));
        broadcastRooms();
    }
}

function handleCreateRoom(ws, roomName) {
    if (!rooms.has(roomName)) {
        rooms.set(roomName, new Set());
        broadcastRooms();
    }
}

function handleJoinRoom(ws, room, username) {
    if (rooms.has(room)) {
        rooms.get(room).add(username);
        ws.room = room;
        broadcastRoomUsers(room);
        broadcastMessages(room, `${username} joined the room`);
    }
}

// function handleLeaveRoom(ws, room, username) {
//     if (rooms.has(room)) {
//         rooms.get(room).delete(username);
//         broadcastRoomUsers(room);
//         broadcastMessages(room, `${username} left the room`);
//     }
// }

function handleChatMessage(ws, room, username, message) {
    if (message.trim()) {
        broadcastMessages(room, `${username}: ${message}`);
    }
}

function handleDisconnect(ws) {
    users.delete(ws.username);
    rooms.forEach((usersInRoom, room) => {
        if (usersInRoom.has(ws.username)) {
            usersInRoom.delete(ws.username);
            broadcastRoomUsers(room);
            broadcastMessages(room, `${ws.username} left the room`);
        }
    });
}

function broadcastRooms() {
    const roomList = Array.from(rooms.keys());
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({ type: 'updateRooms', rooms: roomList }));
    });
}

function broadcastRoomUsers(room) {
    const usersInRoom = Array.from(rooms.get(room) || []);
    wss.clients.forEach((client) => {
        if (client.room === room) {
            client.send(JSON.stringify({ type: 'updateUsers', users: usersInRoom }));
        }
    });
}

function broadcastMessages(room, message) {
    wss.clients.forEach((client) => {
        if (client.room === room) {
            client.send(JSON.stringify({ type: 'message', message, timestamp: new Date().toLocaleTimeString() }));
        }
    });
}