
let globalEvents = [];
let selectedLeagues = new Set();

async function createCalendar(month, year) {
    const now = new Date();
    const today = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let calendarHtml = '<table>';
    
    // Create the calendar header
    calendarHtml += '<tr>';
    for (let i = 0; i < dayNames.length; i++) {
        calendarHtml += `<th>${dayNames[i]}</th>`;
    }
    calendarHtml += '</tr>';

    // Get the first day of the month
    const firstDay = new Date(year, month, 1).getDay();

    // Get the number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Create the days of the calendar
    let day = 1;
    calendarHtml += '<tr>';
    
    // Fill in the first week of the month with empty cells if needed
    for (let i = 0; i < 7; i++) {
        if (i < firstDay) {
            calendarHtml += '<td></td>';
        } else {
            let classes = (day === today && month === currentMonth && year === currentYear) ? 'current-day' : '';
            // Here we add an id to each day cell
            calendarHtml += `
            <td id="day-${day}" class="${classes}">
                <span class="day-number">${day}</span>
                <div class="event-indicator-container"></div>
            </td>
            `;
            day++;
        }
    }

    while (day <= daysInMonth) {
        if (new Date(year, month, day).getDay() === 0) calendarHtml += '<tr>'; // Start a new row every Sunday
    
        let classes = (day === today && month === currentMonth && year === currentYear) ? 'current-day' : '';
        // Wrap the day number in a span and add a container for the event indicator
        calendarHtml += `
        <td id="day-${day}" class="${classes}">
            <span class="day-number">${day}</span>
            <div class="event-indicator-container"></div>
        </td>
        `;
    
        if (new Date(year, month, day).getDay() === 6) calendarHtml += '</tr>'; // End the row every Saturday
        day++;
    }
    
    // If the last day of the month is before Saturday, fill the last row with empty cells
    while (new Date(year, month, day).getDay() !== 0) {
        calendarHtml += '<td></td>';
        day++;
    }
    
    if (new Date(year, month, day-1).getDay() !== 6) calendarHtml += '</tr>'; // Finish the last row
    calendarHtml += '</table>';
    document.getElementById('calendar-view').innerHTML = calendarHtml;

    // Fetch events and add them to the calendar
    // Fetch events and add them to the calendar
    const upcomingEvents = await fetchEvents(month, year);
    const ongoingEvents = await fetchOngoingEvents();

    console.log(ongoingEvents)

    // Combine the events
    globalEvents = [...upcomingEvents, ...ongoingEvents];
    const filteredEvents = filterEventsBySelectedLeagues(globalEvents);
    if (filteredEvents && filteredEvents.length > 0) {
        filteredEvents.forEach(event => {
            // Parse the 'scheduled_at' property
            const eventDate = new Date(event.scheduled_at);

            if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
                const dayCell = document.querySelector(`#day-${eventDate.getDate()} .event-indicator-container`);
                if (dayCell && dayCell.children.length === 0) { // Check if the indicator is not already added
                    dayCell.innerHTML = '<span class="event-indicator"></span>';
                }
            }
        });
    }
    const days = document.querySelectorAll('#calendar-view td');
    days.forEach(day => {
        day.addEventListener('click', function() {
            // Extract day number from the cell's id
            const dayNumber = this.id.split('-')[1];
            showEventsForDay(parseInt(dayNumber), month, year);
        });
    });

}

function filterEventsBySelectedLeagues(events) {
    const selectedLeagues = getSelectedLeagues();
    return events.filter(event => selectedLeagues.length === 0 || selectedLeagues.includes(event.league.name));
}



function updateCalendar() {
    const selectedMonth = document.getElementById('month-select').value;
    const selectedYear = document.getElementById('year-select').value;
    createCalendar(parseInt(selectedMonth), parseInt(selectedYear));
}


function attachLeagueFilterEventListeners() {
    const checkboxes = document.querySelectorAll('.league-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Frissíti a kiválasztott ligák listáját
            if (this.checked) {
                selectedLeagues.add(this.value);
            } else {
                selectedLeagues.delete(this.value);
            }

            // Frissíti a naptárat
            const selectedMonth = parseInt(document.getElementById('month-select').value);
            const selectedYear = parseInt(document.getElementById('year-select').value);
            updateCalendar(selectedMonth, selectedYear);
        });
    });
}


// Function to generate month and year dropdowns
function generateMonthYearSelectors() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let monthHtml = `<select id="month-select">`;
    for (let i = 0; i < monthNames.length; i++) {
        monthHtml += `<option value="${i}">${monthNames[i]}</option>`;
    }
    monthHtml += `</select>`;

    let yearHtml = `<select id="year-select">`;
    for (let i = new Date().getFullYear(); i >= 2020; i--) {
        yearHtml += `<option value="${i}">${i}</option>`;
    }
    yearHtml += `</select>`;

    let buttonHtml = `<button onclick="updateCalendar()">Show Calendar</button>`;

    // Adding a filter icon (represented by a Unicode character)
    let filterIconHtml = `<button onclick="togglePopup('league-filter-popup')" style="margin-left: 10px; cursor: pointer;">&#x1F50D;</button>`;

    document.getElementById('calendar-controls').innerHTML = monthHtml + yearHtml + buttonHtml + filterIconHtml;
}


async function fetchEvents() {
    showLoadingIndicator();
    try {
        const response = await fetch(`/api/pandascore/tournaments/upcoming`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            console.error('A válasz nem tömb:', data);
            return [];
        }
        return data;
    } catch (error) {
        console.error('Hiba történt az események lekérésekor:', error);
        return []; // Visszaad egy üres tömböt, ha hiba történt
    } finally {
        hideLoadingIndicator();
    }
}

async function fetchOngoingEvents() {
    try {
        const response = await fetch(`/api/ongoing-events`);
        const data = await response.json();
        if (!Array.isArray(data)) {
            console.error('Válasz nem tömb: ', data);
            return [];
        }
        return data;
    } catch (error) {
        console.error('Hiba történt a folyamatban lévő események lekérésekor:', error);
        return []; // Visszaad egy üres tömböt, ha hiba történt
    }
}

// Modify fetchLeagues to call placeLeagueFilter with the popup's ID
async function fetchLeagues() {
    try {
        const response = await fetch('/api/leagues');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const leagues = await response.json();
        if (Array.isArray(leagues)) {
            placeLeagueFilter(leagues); // Biztosítjuk, hogy csak akkor hívjuk meg, ha a leagues tömb
        } else {
            console.error('A ligák válasza nem tömb.');
        }
    } catch (error) {
        console.error('Hiba történt a ligák lekérésekor:', error);
    }
}

async function fetchTeamDetails(teamId) {
    try {
        const response = await fetch(`/api/teams/${teamId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching team details:', error);
        return null;
    }
}

async function fetchTournamentDetails(tournamentId) {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching team details:', error);
        return null;
    }
}


function generateLeagueFilters() {
    const uniqueLeagues = Array.from(new Set(globalEvents.map(event => event.league.name)));
    let leagueFilterHtml = '<div id="league-filters">';
    uniqueLeagues.forEach(league => {
        leagueFilterHtml += `
            <label class="switch">
                <input type="checkbox" class="league-checkbox" value="${league}" checked>
                <span class="slider round"></span>
                <span class="league-label">${league}</span>
            </label>
        `;
    });
    leagueFilterHtml += '</div>';
    return leagueFilterHtml;
}



function getSelectedLeagues() {
    return Array.from(document.querySelectorAll('.league-checkbox:checked')).map(checkbox => checkbox.value);
}

// Definiáljuk a főbb ligákat
const primaryLeagues = ['LPL', 'LEC', 'LCS', 'LCK', 'CBLOL', 'LLA', 'VCS', 'PCS', 'LJL', 'LCO'];
const secondaryLeagues = ['LFL', 'Arabian League', 'LIT', 'TCL', 'EBL', 'Elite Series Benelux Masters', 'EMEA Masters', 'North American Challengers League', 'LDL'];

function placeLeagueFilter(leagues) {
    let leagueFilterHtml = '<div class="close-btn" onclick="closeFilterPopup()">X</div>'; // Bezáró gomb hozzáadása

    let primaryLeagueHtml = '<h3>Tier 1 Leagues</h3><hr>';
    let secondaryLeagueHtml = '<h3>Tier 2 Leagues</h3><hr>';

    leagues.forEach(league => {
        // Ellenőrzi, hogy a liga az LEC-e, és ha igen, akkor kijelöli a checkboxot
        const isChecked = '';

        const leagueHtml = `
            <label class="league-label">
                <input type="checkbox" class="league-checkbox" value="${league.name}" ${isChecked}>
                ${league.name}
            </label>
        `;

        if (primaryLeagues.includes(league.name)) {
            primaryLeagueHtml += leagueHtml;
        } else if (secondaryLeagues.includes(league.name)) {
            secondaryLeagueHtml += leagueHtml;
        }
    });

    leagueFilterHtml += primaryLeagueHtml + secondaryLeagueHtml; // Összefűzi a különböző részeket
    document.getElementById('league-filter-popup').innerHTML = leagueFilterHtml;
    attachLeagueFilterEventListeners();
}



function togglePopup(popupId) {
    const popup = document.getElementById(popupId);
    const overlay = document.getElementById('overlay');

    if (popup.style.display === 'none' || !popup.style.display) {
        popup.style.display = 'block';
        overlay.style.display = 'block'; // Az overlay megjelenítése
    } else {
        popup.style.display = 'none';
        overlay.style.display = 'none'; // Az overlay elrejtése
    }
}

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.style.display = 'none';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = 1; // Az overlay-t a popupok elé helyezzük

    overlay.addEventListener('click', () => {
        document.querySelectorAll('.popup, .league-filter-popup').forEach(popup => {
            popup.style.display = 'none';
        });
        overlay.style.display = 'none';
    });

    document.body.appendChild(overlay);
}

document.addEventListener('DOMContentLoaded', () => {
    createOverlay();
    // További kódok...
});

// Fetch leagues and populate filters on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchLeagues();
});

// Call fetchLeagues on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    fetchLeagues();
    // Existing code
});



async function showEventsForDay(day, month, year) {
    const eventsForDay = filterEventsBySelectedLeagues(globalEvents).filter(event => {
        const eventDate = new Date(event.scheduled_at);
        return eventDate.getDate() === day &&
               eventDate.getMonth() === month &&
               eventDate.getFullYear() === year;
    });

    eventsForDay.sort((a, b) => {
        if (a.status === 'running' && b.status !== 'running') return -1;
        if (a.status !== 'running' && b.status === 'running') return 1;
        return 0;
    });

    let popupHtml = '<div class="popup">';
    if (eventsForDay.length === 0) {
        popupHtml += `<p>No events scheduled for this day.</p>`;
    } else {
        for (const event of eventsForDay) {
            const eventTime = new Date(event.scheduled_at);
            const opponents = event.opponents.map(opp => opp.opponent.name).join(' vs ');
            const opponent_left_logo = event.opponents[0].opponent.image_url;
            const opponent_right_logo = event.opponents[1].opponent.image_url;
            const leagueName = event.league.name;
            const leagueUrl = event.league.url;
            const teamLeftId = event.opponents[0].opponent.id;
            const teamRightId = event.opponents[1].opponent.id;
            const teamLeftDetails = await fetchTeamDetails(teamLeftId);
            const teamRightDetails = fetchTeamDetails(teamRightId);
            


            const playersLeft = teamLeftDetails && teamLeftDetails.players
            ? `<div class="team-players">` + 
              teamLeftDetails.players
                .filter(player => player.active)
                .map(player => 
                    `<div class="player-profile">
                        <img src="${player.image_url || 'default-image-url.jpg'}" alt="${player.name}" class="player-image">
                        <span class="player-name">${player.name}</span>
                    </div>`
                ).join('') + `</div>`
            : 'No active players';

        const playersRight = teamRightDetails && teamRightDetails.players
            ? `<div class="team-players">` + 
              teamRightDetails.players
                .filter(player => player.active)
                .map(player => 
                    `<div class="player-profile">
                        <img src="${player.image_url || 'default-image-url.jpg'}" alt="${player.name}" class="player-image">
                        <span class="player-name">${player.name}</span>
                    </div>`
                ).join('') + `</div>`
            : 'No active players';
            

            let broadcastingLinks = event.streams_list.map(stream => {
                return stream.raw_url ? `<a href="${stream.raw_url}" target="_blank">${stream.language.toUpperCase()}</a>` : '';
            }).filter(link => link).join(' | ');
        
            if (!broadcastingLinks) broadcastingLinks = 'No broadcasting link available';
        
            let liveIndicator = event.status === 'running' ? '<span class="live-indicator">LIVE</span>' : '';
        
            popupHtml += `
                <div class="event-details">
                    <p>${liveIndicator}<strong>Time:</strong> ${eventTime.toLocaleTimeString()}</p>
                    <div class="match-details">
                    <p><strong>Match:</strong> 
                        <img src="${opponent_left_logo}" alt="Left Team Logo" class="team-logo">
                        ${opponents}</p>
                        <img src="${opponent_right_logo}" alt="Right Team Logo" class="team-logo">
                    </div>
                    <p>${playersLeft}</p>
                    <p><strong>League:</strong> <a href="${leagueUrl}" target="_blank">${leagueName}</a></p>
                    <p><strong>Broadcast:</strong> ${broadcastingLinks}</p>
                </div>
            `;
        };
        
    }

    popupHtml += '<button onclick="closePopup()">Close</button>';
    popupHtml += '</div>';

    const popupContainer = document.getElementById('popup-container');
    popupContainer.innerHTML = popupHtml;
    popupContainer.style.display = 'flex';
}


function showLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'flex';
}

function hideLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'none';
}


// Function to hide the popup
function closePopup() {
    document.getElementById('popup-container').style.display = 'none';
}

function closeFilterPopup() {
    const popup = document.getElementById('league-filter-popup');
    const overlay = document.getElementById('overlay');
    
    popup.style.display = 'none';
    overlay.style.display = 'none'; // Az overlay elrejtése
}

// Az X gomb eseménykezelőjének hozzáadása
document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.querySelector('.league-filter-popup .close-btn');
    closeButton.addEventListener('click', closeFilterPopup);
    // További kódok...
});

// Call the function to create the selectors
generateMonthYearSelectors();

// ... existing functions and code ...


// Get the current date to load the initial calendar
const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

// Call the function to create the calendar
createCalendar(currentMonth, currentYear);
