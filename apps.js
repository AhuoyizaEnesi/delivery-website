// Connect to the server via Socket.IO
const socket = io('http://localhost:5001');

// Fetch users from the backend API and display them
async function loadUsers() {
    try {
        const response = await fetch('http://localhost:5001/api/users');
        const users = await response.json();
        const userList = document.getElementById('users');
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user.username + ' (' + user.role + ')';
            userList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Real-time chat functionality
const messageInput = document.getElementById('messageInput');
const messagesList = document.getElementById('messages');

function sendMessage() {
    const message = messageInput.value;
    const username = "CurrentUser"; // Replace with actual username logic
    socket.emit('message', { username, message });
    messageInput.value = ''; // Clear input after sending
}

socket.on('message', (data) => {
    const li = document.createElement('li');
    li.textContent = `${data.username}: ${data.message}`;
    messagesList.appendChild(li);
});

// Load users on page load
window.onload = loadUsers;

