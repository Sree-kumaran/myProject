// Update the login form handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            loginSuccess.style.display = 'block';
            loginForm.reset();
            setTimeout(() => {
                loginSuccess.style.display = 'none';
                window.location.href = '/dashboard.html'; // Redirect to dashboard or home page
            }, 2000);
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('An error occurred. Please try again.');
    }
});

// Update the registration form handler
registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert("Passwords don't match!");
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullName, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            registerSuccess.style.display = 'block';
            registrationForm.reset();
            setTimeout(() => {
                registerSuccess.style.display = 'none';
                signUpForm.style.display = 'none';
                signInForm.style.display = 'block';
            }, 2000);
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('An error occurred. Please try again.');
    }
});
