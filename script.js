const socket = new WebSocket('ws://localhost:8080');

const usernameModal = document.getElementById('username-modal');
const usernameInput = document.getElementById('username-input');
const joinButton = document.getElementById('join-button');
const errorMessage = document.getElementById('error-message');
const roomList = document.getElementById('room-list');
const createRoomButton = document.getElementById('create-room');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let username = '';
let currentRoom = '';

// Show username modal on page load
usernameModal.style.display = 'flex';

// Join chat with username
joinButton.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (username) {
        socket.send(JSON.stringify({ type: 'join', username }));
    }
});

// Create new room
createRoomButton.addEventListener('click', () => {
    const roomName = prompt('Enter room name:');
    if (roomName) {
        socket.send(JSON.stringify({ type: 'createRoom', roomName }));
    }
});

// Send message
sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.send(JSON.stringify({ type: 'message', room: currentRoom, username, message }));
        messageInput.value = '';
    }
});

// Handle WebSocket messages
socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case 'joinSuccess':
            usernameModal.style.display = 'none';
            break;
        case 'error':
            errorMessage.textContent = data.message;
            break;
        case 'updateRooms':
            updateRoomList(data.rooms);
            break;
        case 'message':
            displayMessage(data.message, data.timestamp);
            break;
    }
});

function updateRoomList(rooms) {
    roomList.innerHTML = '';
    rooms.forEach((room) => {
        const li = document.createElement('li');
        li.textContent = room;
        li.addEventListener('click', () => {
            currentRoom = room;
            socket.send(JSON.stringify({ type: 'joinRoom', room, username }));
        });
        roomList.appendChild(li);
    });
}

function displayMessage(message, timestamp) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = `<strong>${message}</strong> <span class="timestamp">${timestamp}</span>`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}