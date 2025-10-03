import React, { useState, useEffect, useRef } from 'react';

const GameCard = ({ game, isHighlighted }) => (
    <div className={`game-card ${isHighlighted ? 'highlighted-card' : ''}`}>
        <div className="game-card-header">
            <strong>{game.time24}</strong>
            <small>Division: {game.division}</small>
        </div>
        <div className="game-card-body">
            <p>{game.homeTeam}</p>
            <p>vs</p>
            <p>{game.awayTeam}</p>
        </div>
        <div className="game-card-footer">
            <small>Coach: {game.coachName}</small>
        </div>
    </div>
);

function GameList({ games, locationFilter, setLocationFilter, coachFilter, setCoachFilter, selectedMatchId }) {
    const [isLocationGroupOpen, setIsLocationGroupOpen] = useState(false);
    const [isCoachGroupOpen, setIsCoachGroupOpen] = useState(false);
    const [expandedLocations, setExpandedLocations] = useState(new Set());
    const [expandedCoaches, setExpandedCoaches] = useState(new Set());
    const listContainerRef = useRef(null);
    const locationRefs = useRef({});
    const coachRefs = useRef({});

    useEffect(() => {
        if (locationFilter !== 'all') {
            setIsLocationGroupOpen(true);
            setExpandedLocations(new Set([locationFilter]));
            setTimeout(() => {
                const node = locationRefs.current[locationFilter];
                const container = listContainerRef.current;
                if (node && container) {
                    const scrollPosition = node.offsetTop - (container.offsetHeight / 2) + (node.offsetHeight / 2);
                    container.scrollTo({ top: scrollPosition, behavior: 'smooth' });
                }
            }, 100);
        }
    }, [locationFilter]);

    useEffect(() => {
        if (coachFilter !== 'all') {
            setIsCoachGroupOpen(true);
            setExpandedCoaches(new Set([coachFilter]));
             setTimeout(() => {
                const node = coachRefs.current[coachFilter];
                const container = listContainerRef.current;
                if (node && container) {
                    const scrollPosition = node.offsetTop - (container.offsetHeight / 2) + (node.offsetHeight / 2);
                    container.scrollTo({ top: scrollPosition, behavior: 'smooth' });
                }
            }, 100);
        }
    }, [coachFilter]);

    const gamesByLocation = games.reduce((acc, g) => { (acc[g.location] = acc[g.location] || []).push(g); return acc; }, {});
    const gamesByCoach = games.reduce((acc, g) => { (acc[g.coachName] = acc[g.coachName] || []).push(g); return acc; }, {});

    const sortedLocations = Object.keys(gamesByLocation).sort();
    const sortedCoaches = Object.keys(gamesByCoach).sort();

    const handleLocationClick = (loc) => setLocationFilter(loc);
    const handleCoachClick = (coach) => setCoachFilter(coach);

    const toggleLocationAccordion = (loc) => {
        const newSet = new Set(expandedLocations);
        newSet.has(loc) ? newSet.delete(loc) : newSet.add(loc);
        setExpandedLocations(newSet);
    };
    const toggleCoachAccordion = (coach) => {
        const newSet = new Set(expandedCoaches);
        newSet.has(coach) ? newSet.delete(coach) : newSet.add(coach);
        setExpandedCoaches(newSet);
    };

    return (
        <div className="game-list-container">
            <div className="game-list" ref={listContainerRef}>
                <h4 onClick={() => setIsLocationGroupOpen(!isLocationGroupOpen)}>
                    Games by Location
                    <span className={`accordion-icon ${isLocationGroupOpen ? 'expanded' : ''}`}></span>
                </h4>
                {isLocationGroupOpen && sortedLocations.map(locationName => {
                    const isExpanded = expandedLocations.has(locationName);
                    const isHighlighted = locationFilter === locationName;
                    const gamesAtLocation = gamesByLocation[locationName].sort((a,b) => a.time24.localeCompare(b.time24));

                    return (
                        <div key={locationName} ref={el => (locationRefs.current[locationName] = el)} className={`location-group ${isHighlighted ? 'highlighted-group' : ''}`}>
                            <h3 onClick={() => toggleLocationAccordion(locationName)}>
                                {locationName} ({gamesAtLocation.length} {gamesAtLocation.length > 1 ? 'Games' : 'Game'})
                                <span className={`accordion-icon ${isExpanded ? 'expanded' : ''}`}></span>
                            </h3>
                            {isExpanded && gamesAtLocation.map(game => <GameCard key={game.matchId} game={game} isHighlighted={game.matchId === selectedMatchId} />)}
                        </div>
                    );
                })}
                
                <h4 onClick={() => setIsCoachGroupOpen(!isCoachGroupOpen)}>
                    Games by Coach
                    <span className={`accordion-icon ${isCoachGroupOpen ? 'expanded' : ''}`}></span>
                </h4>
                {isCoachGroupOpen && sortedCoaches.map(coachName => {
                     const isExpanded = expandedCoaches.has(coachName);
                     const isHighlighted = coachFilter === coachName;
                     const gamesForCoach = gamesByCoach[coachName].sort((a,b) => a.time24.localeCompare(b.time24));

                    return (
                        <div key={coachName} ref={el => (coachRefs.current[coachName] = el)} className={`location-group ${isHighlighted ? 'highlighted-group' : ''}`}>
                             <h3 onClick={() => toggleCoachAccordion(coachName)}>
                                {coachName} ({gamesForCoach.length} {gamesForCoach.length > 1 ? 'Games' : 'Game'})
                                <span className={`accordion-icon ${isExpanded ? 'expanded' : ''}`}></span>
                            </h3>
                            {isExpanded && gamesForCoach.map(game => <GameCard key={game.matchId} game={game} isHighlighted={game.matchId === selectedMatchId} />)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
export default GameList;