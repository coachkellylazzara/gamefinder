import { useState, useEffect, useMemo } from 'react';
import MapView from './components/MapView';
import GameList from './components/GameList';
import './App.css';

const formatDate = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

const formatDateForImage = (dateString) => {
    console.log(dateString, "ho")
    if (!dateString) 
      console.log('hi') 
      return null;
    const date = new Date(`${dateString}T00:00:00`);
    if (isNaN(date.getTime())) return null;
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const year = date.getFullYear().toString().slice(-2);
    return `${day}${month}${year}.jpg`;
};

function App() {
    const [allGames, setAllGames] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');
    const [coachFilter, setCoachFilter] = useState('all');
    const [showAwaySummaries, setShowAwaySummaries] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState(null);

    useEffect(() => {
        fetch('/games.json')
            .then(res => res.json())
            .then(data => setAllGames(data))
            .catch(err => console.error("Failed to load games.json:", err));
    }, []);

    const availableDates = useMemo(() => Array.from(new Set(allGames.map(game => game.date))).sort((a, b) => new Date(a) - new Date(b)), [allGames]);

    useEffect(() => {
        if (availableDates.length > 0 && !selectedDate) {
            const today = new Date();
            const todayString = formatDate(today);
            if (availableDates.includes(todayString)) {
                setSelectedDate(todayString);
            } else {
                const nextDate = availableDates.find(date => new Date(date) >= today);
                if (nextDate) setSelectedDate(nextDate);
                else if (availableDates.length > 0) setSelectedDate(availableDates[availableDates.length - 1]);
            }
        }
    }, [availableDates, selectedDate]);

    const gamesOnDate = useMemo(() => {
        if (!selectedDate) return [];
        return allGames.filter(game => game.date === selectedDate);
    }, [selectedDate, allGames]);
    
    const availableLocations = useMemo(() => Array.from(new Set(gamesOnDate.map(game => game.location))).sort(), [gamesOnDate]);
    const availableCoaches = useMemo(() => Array.from(new Set(gamesOnDate.map(game => game.coachName))).sort(), [gamesOnDate]);

    const gamesForMap = useMemo(() => {
        if (coachFilter === 'all') return gamesOnDate;
        return gamesOnDate.filter(game => game.coachName === coachFilter);
    }, [coachFilter, gamesOnDate]);

    const resetFilters = () => {
        setLocationFilter('all');
        setCoachFilter('all');
    };

    const scheduleCardImageName = useMemo(() => {
        if (!selectedDate) return null;
        
        // Create a new Date object directly from the selectedDate string
        const dateObject = new Date(selectedDate);
        
        // Now, format that reliable Date object
        if (isNaN(dateObject.getTime())) return null; // Safety check
        const day = String(dateObject.getDate()).padStart(2, '0');
        const month = dateObject.toLocaleString('en-US', { month: 'short' }).toLowerCase();
        const year = dateObject.getFullYear().toString().slice(-2);
        
        return `${day}${month}${year}.jpg`;
    }, [selectedDate]);

console.log({ selectedDate, scheduleCardImageName });

    return (
        <div className="app-container">
            <header className="header"><h1>ELI7E FC Game Finder</h1></header>
            <div className="filters-container">
                {/* NEW: Grouping filters into rows */}
                <div className="filter-row">
                    <div className="filter-item">
                        <label htmlFor="date-filter">Date:</label>
                        <select id="date-filter" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); resetFilters(); }}>
                            <option value="">-- Choose a Date --</option>
                            {availableDates.map(date => <option key={date} value={date}>{date}</option>)}
                        </select>
                    </div>
                    {selectedDate && <div className="filter-item">
                        <label htmlFor="coach-filter">Coach:</label>
                        <select id="coach-filter" value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)}>
                            <option value="all">All Coaches</option>
                            {availableCoaches.map(coach => <option key={coach} value={coach}>{coach}</option>)}
                        </select>
                    </div>}
                </div>

                <div className="filter-row">
                    {selectedDate && <div className="filter-item">
                        <label htmlFor="location-filter">Location:</label>
                        <select id="location-filter" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                            <option value="all">All Locations</option>
                            {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>}
                    {selectedDate && <div className="filter-item">
                        <label htmlFor="details-toggle">Show Away Summaries</label>
                        <input type="checkbox" id="details-toggle" checked={showAwaySummaries} onChange={(e) => setShowAwaySummaries(e.target.checked)} />
                    </div>}
                </div>

                <div className="filter-row">
                    {scheduleCardImageName && (
                        <div className="filter-item">
                            <a href={`/${scheduleCardImageName}`} download={scheduleCardImageName} className="download-button">
                                Download Home Schedule Card
                            </a>
                        </div>
                    )}
                </div>
            </div>
            
            <main className="main-content">
                <div className="map-view-container">
                    <MapView 
                        games={gamesForMap}
                        locationFilter={locationFilter}
                        setLocationFilter={setLocationFilter}
                        resetFilters={resetFilters}
                        showAwaySummaries={showAwaySummaries}
                        setSelectedMatchId={setSelectedMatchId}
                    />
                </div>
                {selectedDate && (
                    <GameList 
                        games={gamesOnDate}
                        locationFilter={locationFilter}
                        setLocationFilter={setLocationFilter}
                        coachFilter={coachFilter}
                        setCoachFilter={setCoachFilter}
                        selectedMatchId={selectedMatchId}
                    />
                )}
            </main>
        </div>
    );
}

export default App;