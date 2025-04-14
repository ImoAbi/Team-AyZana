document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const medicationForm = document.getElementById('medication-form');
    const enableRemindersBtn = document.getElementById('enable-reminders');
    const disableRemindersBtn = document.getElementById('disable-reminders');
    
    // Profildaten und Medikamente laden
    loadProfile();
    loadMedications();
    loadReminderStatus();
    
    // Formulare absenden
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProfile();
    });

    medicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addMedication();
    });

    // Erinnerungen aktivieren/deaktivieren
    enableRemindersBtn.addEventListener('click', enableReminders);
    disableRemindersBtn.addEventListener('click', disableReminders);

    // Erinnerungen regelmäßig aktualisieren
    setInterval(updateReminders, 60000); // Alle 60 Sekunden

    // Event Listener für den Zeitraum-Selector
    document.getElementById('history-period').addEventListener('change', updateHistory);
    
    // Event Listener für den Export-Button
    document.querySelector('.export-button').addEventListener('click', exportHistory);
    
    // Initiale Anzeige der Historie
    updateHistory();
});

// Profil-Funktionen
function saveProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const profileData = {
        age: document.getElementById('age').value,
        insurance: document.getElementById('insurance').value,
        doctor: document.getElementById('doctor').value,
        pharmacy: document.getElementById('pharmacy').value,
        emergencyContact: document.getElementById('emergency-contact').value
    };
    
    currentUser.profile = profileData;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Aktualisiere auch die Benutzerliste
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    alert('PROFIL ERFOLGREICH GESPEICHERT!');
}

function loadProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Setze den Namen aus dem Benutzerkonto
    document.getElementById('name').value = currentUser.name;
    
    // Lade die Profildaten
    if (currentUser.profile) {
        document.getElementById('age').value = currentUser.profile.age || '';
        document.getElementById('insurance').value = currentUser.profile.insurance || '';
        document.getElementById('doctor').value = currentUser.profile.doctor || '';
        document.getElementById('pharmacy').value = currentUser.profile.pharmacy || '';
        document.getElementById('emergency-contact').value = currentUser.profile.emergencyContact || '';
    }
}

// Medikamenten-Funktionen
function addMedication() {
    const medicationData = {
        name: document.getElementById('med-name').value,
        dosage: document.getElementById('med-dosage').value,
        times: getSelectedTimes(),
        frequency: document.getElementById('med-frequency').value,
        notes: document.getElementById('med-notes').value,
        id: Date.now() // Eindeutige ID für jedes Medikament
    };

    let medications = JSON.parse(localStorage.getItem('medications') || '[]');
    medications.push(medicationData);
    localStorage.setItem('medications', JSON.stringify(medications));

    displayMedications();
    document.getElementById('medication-form').reset();
    alert('MEDIKAMENT ERFOLGREICH HINZUGEFÜGT!');
}

function getSelectedTimes() {
    const times = [];
    const checkboxes = document.querySelectorAll('input[name="morning"], input[name="noon"], input[name="evening"], input[name="night"]');
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            times.push(checkbox.parentElement.textContent.trim());
        }
    });
    
    return times;
}

function loadMedications() {
    displayMedications();
}

function displayMedications() {
    const container = document.getElementById('medications-container');
    const medications = JSON.parse(localStorage.getItem('medications') || '[]');
    
    container.innerHTML = '';
    
    medications.forEach(med => {
        const medElement = document.createElement('div');
        medElement.className = 'medication-item';
        medElement.innerHTML = `
            <h4>${med.name}</h4>
            <p><strong>DOSIERUNG:</strong> ${med.dosage}</p>
            <div class="times">
                ${med.times.map(time => `<span class="time-tag">${time}</span>`).join('')}
            </div>
            <p><strong>HÄUFIGKEIT:</strong> ${getFrequencyText(med.frequency)}</p>
            ${med.notes ? `<p><strong>HINWEISE:</strong> ${med.notes}</p>` : ''}
            <button class="delete-button" onclick="deleteMedication(${med.id})">LÖSCHEN</button>
        `;
        
        container.appendChild(medElement);
    });
}

function getFrequencyText(frequency) {
    const frequencies = {
        'daily': 'TÄGLICH',
        'weekly': 'WÖCHENTLICH',
        'monthly': 'MONATLICH',
        'as-needed': 'NACH BEDARF'
    };
    return frequencies[frequency] || frequency;
}

function deleteMedication(id) {
    if (confirm('SIND SIE SICHER, DASS SIE DIESES MEDIKAMENT LÖSCHEN MÖCHTEN?')) {
        let medications = JSON.parse(localStorage.getItem('medications') || '[]');
        medications = medications.filter(med => med.id !== id);
        localStorage.setItem('medications', JSON.stringify(medications));
        displayMedications();
    }
}

// Erinnerungs-Funktionen
function enableReminders() {
    localStorage.setItem('remindersEnabled', 'true');
    document.getElementById('enable-reminders').style.display = 'none';
    document.getElementById('disable-reminders').style.display = 'block';
    document.getElementById('reminder-status-text').textContent = 'AKTIV';
    document.getElementById('reminder-status-text').style.color = '#4a90e2';
    updateReminders();
}

function disableReminders() {
    localStorage.setItem('remindersEnabled', 'false');
    document.getElementById('enable-reminders').style.display = 'block';
    document.getElementById('disable-reminders').style.display = 'none';
    document.getElementById('reminder-status-text').textContent = 'INAKTIV';
    document.getElementById('reminder-status-text').style.color = '#666';
    clearNextMedications();
}

function loadReminderStatus() {
    const remindersEnabled = localStorage.getItem('remindersEnabled') === 'true';
    if (remindersEnabled) {
        document.getElementById('enable-reminders').style.display = 'none';
        document.getElementById('disable-reminders').style.display = 'block';
        document.getElementById('reminder-status-text').textContent = 'AKTIV';
        document.getElementById('reminder-status-text').style.color = '#4a90e2';
        updateReminders();
    }
}

function updateReminders() {
    if (localStorage.getItem('remindersEnabled') !== 'true') return;

    const medications = JSON.parse(localStorage.getItem('medications') || '[]');
    const now = new Date();
    const currentHour = now.getHours();
    const nextMedications = [];

    medications.forEach(med => {
        med.times.forEach(time => {
            let hour;
            switch(time) {
                case 'MORGENS':
                    hour = 8;
                    break;
                case 'MITTAGS':
                    hour = 12;
                    break;
                case 'ABENDS':
                    hour = 18;
                    break;
                case 'NACHTS':
                    hour = 22;
                    break;
                default:
                    return;
            }

            if (hour >= currentHour) {
                nextMedications.push({
                    name: med.name,
                    dosage: med.dosage,
                    time: time,
                    hour: hour,
                    status: 'pending'
                });
            }
        });
    });

    displayNextMedications(nextMedications);
    checkForReminders(nextMedications);
}

function displayNextMedications(medications) {
    const container = document.getElementById('next-medications');
    container.innerHTML = '';

    if (medications.length === 0) {
        container.innerHTML = '<p>KEINE EINNAHMEN FÜR HEUTE MEHR GEPLANT</p>';
        return;
    }

    medications.forEach(med => {
        const medElement = document.createElement('div');
        medElement.className = 'next-medication-item';
        medElement.innerHTML = `
            <h4>${med.name}</h4>
            <p>DOSIERUNG: ${med.dosage}</p>
            <p class="time">ZEIT: ${med.time}</p>
            <span class="status status-${med.status}">
                ${med.status === 'pending' ? 'AUSSTEHEND' : 
                  med.status === 'taken' ? 'EINGENOMMEN' : 'VERPASST'}
            </span>
            <button class="take-button" onclick="markAsTaken(${med.id})">
                ALS EINGENOMMEN MARKIEREN
            </button>
        `;
        container.appendChild(medElement);
    });
}

function checkForReminders(medications) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    medications.forEach(med => {
        if (med.hour === currentHour && currentMinute === 0) {
            showReminderNotification(med);
        }
    });
}

function showReminderNotification(medication) {
    if (Notification.permission === "granted") {
        new Notification("MEDIKAMENTEN-ERINNERUNG", {
            body: `ZEIT FÜR ${medication.name} (${medication.dosage})`,
            icon: "icon.png"
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                showReminderNotification(medication);
            }
        });
    }
}

function markAsTaken(medicationId) {
    const medications = JSON.parse(localStorage.getItem('medications') || '[]');
    const medication = medications.find(m => m.id === medicationId);
    
    if (medication) {
        const history = JSON.parse(localStorage.getItem('medicationHistory') || '[]');
        const now = new Date();
        
        history.push({
            date: now.toISOString(),
            medication: medication.name,
            time: medication.time,
            status: 'taken'
        });
        
        localStorage.setItem('medicationHistory', JSON.stringify(history));
        updateHistory();
    }
}

function clearNextMedications() {
    document.getElementById('next-medications').innerHTML = 
        '<p>ERINNERUNGEN SIND DEAKTIVIERT</p>';
}

// Einnahmehistorie Funktionen
function updateHistory() {
    const period = document.getElementById('history-period').value;
    const history = loadHistory(period);
    displayHistoryStats(history);
    displayHistoryTimeline(history);
}

function loadHistory(period) {
    const history = JSON.parse(localStorage.getItem('medicationHistory') || '[]');
    const now = new Date();
    
    return history.filter(entry => {
        const entryDate = new Date(entry.date);
        switch(period) {
            case 'today':
                return entryDate.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                return entryDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                return entryDate >= monthAgo;
            default:
                return true;
        }
    });
}

function displayHistoryStats(history) {
    const taken = history.filter(entry => entry.status === 'taken').length;
    const missed = history.filter(entry => entry.status === 'missed').length;
    const total = taken + missed;
    const successRate = total > 0 ? Math.round((taken / total) * 100) : 0;
    
    document.getElementById('taken-count').textContent = taken;
    document.getElementById('missed-count').textContent = missed;
    document.getElementById('success-rate').textContent = `${successRate}%`;
}

function displayHistoryTimeline(history) {
    const timeline = document.getElementById('history-timeline');
    timeline.innerHTML = '';
    
    history.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(entry => {
        const item = document.createElement('div');
        item.className = `history-item ${entry.status}`;
        
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        item.innerHTML = `
            <div class="date">${formattedDate}</div>
            <div class="medication">${entry.medication}</div>
            <div class="time">${entry.time}</div>
            <div class="status status-${entry.status}">
                ${entry.status === 'taken' ? 'Eingenommen' : 'Übersehen'}
            </div>
        `;
        
        timeline.appendChild(item);
    });
}

function exportHistory() {
    const history = JSON.parse(localStorage.getItem('medicationHistory') || '[]');
    const csv = convertToCSV(history);
    downloadCSV(csv, 'medikamentenhistorie.csv');
}

function convertToCSV(history) {
    const headers = ['Datum', 'Medikament', 'Uhrzeit', 'Status'];
    const rows = history.map(entry => [
        new Date(entry.date).toLocaleDateString('de-DE'),
        entry.medication,
        entry.time,
        entry.status === 'taken' ? 'Eingenommen' : 'Übersehen'
    ]);
    
    return [headers, ...rows]
        .map(row => row.join(';'))
        .join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
} 