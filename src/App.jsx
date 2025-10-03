import { useState, useEffect, useMemo, useRef } from 'react';
import MapView from './components/MapView';
import GameList from './components/GameList';
import './App.css';

const formatDate = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Fallback to original string if invalid
    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${dayOfWeek} ${day} ${month} ${date.getFullYear()}`;
};

const SingleSelectDropdown = ({ options, selectedValue, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOptionClick = (value) => {
        onChange({ target: { value } }); // Mimic event object
        setIsOpen(false);
    };

    const getDisplayText = () => {
        if (!selectedValue) return placeholder;
        const selectedOption = options.find(opt => opt.value === selectedValue);
        return selectedOption ? selectedOption.label : placeholder;
    };

    return (
        <div className={`multiselect-dropdown ${isOpen ? 'is-open' : ''}`} ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="multiselect-toggle">
                <span>{getDisplayText()}</span>
                <span className="multiselect-arrow"></span>
            </button>
            {isOpen && <div className="multiselect-options">{options.map(option => (<label key={option.value} onClick={() => handleOptionClick(option.value)} className={selectedValue === option.value ? 'selected' : ''}>{option.label}</label>))}</div>}
        </div>
    );
};

const MultiSelectDropdown = ({ options, selectedValues, onChange, placeholder, allowSelectAll = false, exclusiveAll = false, longList = false, noun }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const allOptionValue = exclusiveAll ? 'all' : null;
    const allValues = options.map(opt => opt.value).filter(v => v !== allOptionValue);
    const areAllSelected = exclusiveAll
        ? selectedValues.includes(allOptionValue) || (selectedValues.length > 0 && allValues.every(val => selectedValues.includes(val)))
        : selectedValues.length > 0 && allValues.every(val => selectedValues.includes(val));

    const handleOptionChange = (value) => {
        let newSelectedValues;
        if (exclusiveAll && value === allOptionValue) {
            newSelectedValues = selectedValues.includes(allOptionValue) ? [] : [allOptionValue];
        } else {
            let currentValues = selectedValues;
            // If the "all" option was selected, clear it before adding the new value.
            if (exclusiveAll && currentValues.includes(allOptionValue)) {
                currentValues = [];
            }

            newSelectedValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
        }
        onChange(newSelectedValues);
    };

    const handleSelectAll = () => {
        // For "No Details on Map", this should clear selections.
        // For others, it should select all. This is a special case for this dropdown.
        const isNoDetailsDropdown = placeholder === 'No Details on Map';
        if (isNoDetailsDropdown) {
            // If any option is selected, clicking "No Details" should clear them.
            // If no options are selected, it should do nothing (remain cleared).
            onChange([]);
        } else {
            const newSelectedValues = areAllSelected ? [] : allValues;
            onChange(newSelectedValues);
        }
    };

    const getDisplayText = () => {
        if (selectedValues.length === 0) return placeholder;
        if (noun && (selectedValues.length > 1 || (longList && selectedValues.length > 0))) {
            return `${selectedValues.length} ${noun} Selected`;
        }
        return options
            .filter(opt => selectedValues.includes(opt.value))
            .map(opt => opt.label)
            .join(', ');
    };

    return (
        <div className={`multiselect-dropdown ${isOpen ? 'is-open' : ''}`} ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="multiselect-toggle">
                <span>{getDisplayText()}</span>
                <span className="multiselect-arrow"></span>
            </button>
            {isOpen && <div className="multiselect-options">
                {allowSelectAll && options.length > 0 && ( // This is the "All" or "None" option
                    <label className="select-all-option">
                        <input type="checkbox" checked={placeholder === 'No Details on Map' ? selectedValues.length === 0 : areAllSelected} onChange={handleSelectAll} />
                        {placeholder}
                    </label>
                )}
                {options.map(option => {
                    if (exclusiveAll && option.value === allOptionValue) {
                        return <label key={option.value} className="select-all-option"><input type="checkbox" checked={selectedValues.includes(option.value)} onChange={() => handleOptionChange(option.value)} />{option.label}</label>;
                    }
                    return <label key={option.value}><input type="checkbox" checked={selectedValues.includes(option.value)} onChange={() => handleOptionChange(option.value)} />{option.label}</label>;
                })}
            </div>}
        </div>
    );
};

function App() {
    const [allGames, setAllGames] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [locationFilter, setLocationFilter] = useState([]); // Default to empty array for multi-select
    const [coachFilter, setCoachFilter] = useState([]);
    const [showAwaySummaries, setShowAwaySummaries] = useState(['away']);
    const [teamFilter, setTeamFilter] = useState([]);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [showMapOnMobile, setShowMapOnMobile] = useState(true);
    const [showFiltersOnMobile, setShowFiltersOnMobile] = useState(true);

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
    const teamFilterOptions = useMemo(() => {
        const genders = Array.from(new Set(gamesOnDate.map(game => game.Gender))).filter(Boolean).sort().map(g => ({ value: `gender_${g}`, label: g === 'B' ? 'Boys' : 'Girls' }));
        const years = Array.from(new Set(gamesOnDate.map(game => game.Year))).filter(Boolean).sort().map(y => ({ value: `year_${y}`, label: y }));
        const flights = Array.from(new Set(gamesOnDate.map(game => game.Flight))).filter(Boolean).sort().map(f => ({ value: `flight_${f}`, label: `Flight ${f}` }));
        return [...genders, ...years, ...flights];
    }, [gamesOnDate]);

    const hasSweetwaterGames = useMemo(() => {
        return gamesOnDate.some(game => game.location.includes('Sweetwater'));
    }, [gamesOnDate]);

    const filteredGames = useMemo(() => {
        let games = gamesOnDate;

        if (locationFilter.length > 0) {
            games = games.filter(game => locationFilter.includes(game.location));
        }

        if (coachFilter.length > 0) {
            games = games.filter(game => coachFilter.includes(game.coachName));
        }

        // Treat multiple team filters as AND conditions
        if (teamFilter.length > 0) {
            const filters = { gender: [], year: [], flight: [] };
            teamFilter.forEach(filterValue => {
                const [type, value] = filterValue.split('_');
                if (filters[type]) {
                    filters[type].push(value);
                }
            });

            if (filters.gender.length > 0) {
                games = games.filter(game => filters.gender.includes(game.Gender));
            }
            if (filters.year.length > 0) {
                games = games.filter(game => filters.year.includes(game.Year));
            }
            if (filters.flight.length > 0) {
                games = games.filter(game => filters.flight.includes(game.Flight));
            }
        }
        return games;
    }, [gamesOnDate, locationFilter, coachFilter, teamFilter]);

    const resetFilters = () => {
        setLocationFilter([]);
        setCoachFilter([]);
        setTeamFilter([]);
        setShowAwaySummaries([]);
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

    return (
        <div className="app-container">
            <header className="header"><h1>ELI7E FC Game Finder</h1></header>
            <div className="filters-container-wrapper">
                <div className="mobile-toggles">
                    <div className="mobile-filter-toggle">
                        <a href="#" onClick={(e) => { e.preventDefault(); setShowFiltersOnMobile(!showFiltersOnMobile); }}>
                            {showFiltersOnMobile ? 'Hide Filters' : 'Show Filters'}
                        </a>
                    </div>
                    <div className="mobile-map-toggle-container">
                        <a href="#" onClick={(e) => { e.preventDefault(); setShowMapOnMobile(!showMapOnMobile); }} className="map-toggle-link">
                            {showMapOnMobile ? 'Hide Map' : 'Show Map'}
                        </a>
                    </div>
                </div>
                <div className={`filters-container ${showFiltersOnMobile ? 'is-open' : ''}`}>
                    <div className="filter-item">
                        <SingleSelectDropdown
                            options={availableDates.map(date => ({ value: date, label: formatDisplayDate(date) }))}
                            selectedValue={selectedDate}
                            onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setLocationFilter([]); setCoachFilter([]);
                    }}
                            placeholder="-- Choose a Date --"
                        />
                    </div>
                    {selectedDate && <div className="filter-item">
                        <MultiSelectDropdown
                            options={availableCoaches.map(coach => ({ value: coach, label: coach }))}
                            selectedValues={coachFilter}
                            onChange={setCoachFilter}
                            placeholder="All Coaches"
                            noun="Coaches"
                            allowSelectAll={true}
                        />
                    </div>}
                    {selectedDate && <div className="filter-item">
                        <MultiSelectDropdown
                            options={teamFilterOptions}
                            selectedValues={teamFilter}
                            onChange={setTeamFilter}
                            placeholder="All Teams"
                            noun="Filters"
                            allowSelectAll={true}
                        />
                    </div>}
                    {selectedDate && <div className="filter-item">
                        <MultiSelectDropdown
                            options={availableLocations.map(loc => ({ value: loc, label: loc }))}
                            selectedValues={locationFilter}
                            onChange={setLocationFilter}
                            placeholder="All Locations"
                            allowSelectAll={true}
                            noun="Fields"
                            longList={true}
                        />
                    </div>}
                    {selectedDate && <div className="filter-item">
                        <MultiSelectDropdown
                            options={[
                                { value: 'home', label: 'Home Details on Map' },
                                { value: 'away', label: 'Away Details on Map' }
                            ]}
                            selectedValues={showAwaySummaries}
                            onChange={setShowAwaySummaries}
                            placeholder="No Details on Map"
                            allowSelectAll={true}
                        />
                    </div>}
                    <div className="filter-item">
                        <a href="#" onClick={(e) => { e.preventDefault(); resetFilters(); }} className="reset-filters-link">
                            Reset Filters
                        </a>
                    </div>
                </div>
            </div>
            
            <main className={`main-content ${!showFiltersOnMobile ? 'filters-hidden-mobile' : ''}`}>
                <div className={`map-view-container ${!showMapOnMobile ? 'mobile-hidden' : ''}`}>
                    <MapView 
                        games={filteredGames}
                        locationFilter={locationFilter}
                        setLocationFilter={setLocationFilter}
                        resetFilters={resetFilters}
                        showAwaySummaries={showAwaySummaries}
                        setSelectedMatchId={setSelectedMatchId}
                    />
                </div>
                {selectedDate && (
                    <GameList 
                        games={filteredGames}
                        locationFilter={locationFilter}
                        setLocationFilter={setLocationFilter}
                        coachFilter={coachFilter}
                        setCoachFilter={setCoachFilter}
                        selectedMatchId={selectedMatchId}
                    />
                )}
            </main>
            {scheduleCardImageName && hasSweetwaterGames && (
                <footer className="app-footer">
                    <div className="filter-item schedule-card-container">
                        <a href={`/${scheduleCardImageName}`} download={scheduleCardImageName} className="download-button">
                            ⬇ Home Field Times
                        </a>
                    </div>
                </footer>
            )}
        </div>
    );
}

export default App;