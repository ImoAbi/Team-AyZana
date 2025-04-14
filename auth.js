// EmailJS initialisieren
(function() {
    emailjs.init("YOUR_PUBLIC_KEY"); // Ersetzen Sie dies mit Ihrem Public Key
})();

document.addEventListener('DOMContentLoaded', () => {
    // Prüfen ob wir auf der Login- oder Register-Seite sind
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Prüfen ob der Benutzer bereits eingeloggt ist
    checkAuth();
    
    // Prüfen ob wir auf der Verifizierungsseite sind
    const urlParams = new URLSearchParams(window.location.search);
    const verificationToken = urlParams.get('token');
    
    if (verificationToken) {
        verifyEmail(verificationToken);
    }
});

function handleLogin(e) {
    e.preventDefault();
    console.log('Login-Formular abgesendet');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('Eingegebene Daten:', { email, password });
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('Gespeicherte Benutzer:', users);
    
    const user = users.find(u => u.email === email && u.password === password);
    console.log('Gefundener Benutzer:', user);
    
    if (user) {
        if (!user.verified) {
            alert('BITTE BESTÄTIGEN SIE ZUERST IHRE E-MAIL-ADRESSE.');
            return;
        }
        
        console.log('Login erfolgreich, speichere Benutzer und leite weiter');
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Warte einen kurzen Moment, bevor weitergeleitet wird
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    } else {
        console.log('Login fehlgeschlagen: Falsche E-Mail oder Passwort');
        alert('FALSCHE E-MAIL ODER PASSWORT!');
    }
}

function handleRegister(e) {
    e.preventDefault();
    console.log('Registrierungsformular abgesendet');
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
        alert('DIE PASSWÖRTER STIMMEN NICHT ÜBEREIN!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some(u => u.email === email)) {
        alert('DIESE E-MAIL IST BEREITS REGISTRIERT!');
        return;
    }
    
    const verificationToken = generateToken();
    const verificationLink = `${window.location.origin}/verify.html?token=${verificationToken}`;
    
    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        verified: false,
        verificationToken,
        profile: {
            age: '',
            insurance: '',
            doctor: '',
            pharmacy: '',
            emergencyContact: ''
        }
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Zeige den Verifikationslink an
    alert(`Registrierung erfolgreich!\n\nVerifikationslink: ${verificationLink}`);
    
    // Weiterleitung zur Login-Seite
    window.location.href = 'login.html';
}

function generateToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

function verifyEmail(token) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.verificationToken === token);
    
    if (userIndex !== -1) {
        users[userIndex].verified = true;
        users[userIndex].verificationToken = null;
        localStorage.setItem('users', JSON.stringify(users));
        
        alert('IHRE E-MAIL WURDE ERFOLGREICH VERIFIZIERT! SIE KÖNNEN SICH JETZT ANMELDEN.');
        window.location.href = 'login.html';
    } else {
        alert('UNGÜLTIGER ODER ABGELAUFENER VERIFIKATIONSLINK.');
    }
}

function checkAuth() {
    // Nur auf der Hauptseite prüfen
    if (window.location.pathname.includes('index.html')) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser) {
            window.location.href = 'login.html';
        }
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = passwordInput.nextElementSibling.querySelector('.eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '👁️‍🗨️';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
} 