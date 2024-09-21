document.addEventListener('DOMContentLoaded', () => {
    const usernameSpan = document.getElementById('username');
    const profileForm = document.getElementById('profileForm');

    // Fetch and display the current username
    fetch('/api/current-user')
        .then(response => {
            if (!response.ok) throw new Error('Not authorized');
            return response.json();
        })
        .then(data => {
            usernameSpan.textContent = data.username; // Display current username
        })
        .catch(error => {
            console.error('Error fetching user:', error);
            usernameSpan.textContent = 'Error fetching username';
        });

    // Handle form submission to update username
    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newUsername = document.getElementById('newUsername').value;

        try {
            const response = await fetch('/api/update-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: newUsername }),
            });

            if (response.ok) {
                usernameSpan.textContent = newUsername; // Update displayed username
                alert('Username updated successfully!');
            } else {
                alert('Error updating username');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
});
