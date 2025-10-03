import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function MapClickHandler({ resetFilters }) {
    useMapEvents({
        click: () => {},
    });
    return null;
}

const OnMapGameCard = ({ game, setSelectedMatchId }) => {
    let coachDisplay = game.coachName;
    if (game.location.includes('Sweetwater')) {
        const fieldMatch = game.location.match(/Field (\d+)/);
        if (fieldMatch) {
            coachDisplay += ` Field ${fieldMatch[1]}`;
        }
    }
    return (
        <div className="on-map-game-card" onClick={() => setSelectedMatchId(game.matchId)}>
            <span>{game.time24}</span>
            <span>{game.eli7eTeamName}</span>
            <span>{coachDisplay}</span>
        </div>
    );
};

function MapView({ games, locationFilter, setLocationFilter, resetFilters, showAwaySummaries, setSelectedMatchId }) {
    const gamesByAddress = games.reduce((acc, game) => {
        const key = game.address;
        if (!acc[key]) acc[key] = [];
        acc[key].push(game);
        return acc;
    }, {});

    return (
        <MapContainer center={[32.7157, -117.1611]} zoom={10} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler resetFilters={resetFilters} />

            {Object.values(gamesByAddress).map(gamesAtAddress => {
                let locationsDetails;
                const isSweetwater = gamesAtAddress[0].location.includes('Sweetwater');

                if (isSweetwater) {
                    const grouped = gamesAtAddress.reduce((acc, game) => {
                        let groupName = game.location;
                        if (game.location.includes('Field 1') || game.location.includes('Field 6')) {
                            groupName = 'Sweetwater Fields 1 & 6';
                        } else if (game.location.includes('Field 2') || game.location.includes('Field 7')) {
                            groupName = 'Sweetwater Fields 2 & 7';
                        }
                        if (!acc[groupName]) {
                            acc[groupName] = { name: groupName, coords: game.coords, games: [] };
                        }
                        acc[groupName].games.push(game);
                        return acc;
                    }, {});
                    locationsDetails = Object.values(grouped);
                } else {
                    const uniqueLocations = [...new Set(gamesAtAddress.map(g => g.location))];
                    locationsDetails = uniqueLocations.map(locName => {
                        const games = gamesAtAddress.filter(g => g.location === locName);
                        return games.length > 0 ? { name: locName, coords: games[0].coords, games } : null;
                    }).filter(Boolean);
                }
                
                const totalLocationsAtAddress = locationsDetails.length;


                return locationsDetails.map((locationDetail, index) => {
                    const { name: locationName, coords, games: locationGames } = locationDetail;
                    const gameCount = locationGames.length;
                    const isHighlighted = locationFilter.includes(locationName);

                    if (!coords || isNaN(coords[0]) || isNaN(coords[1])) {
                        return null; 
                    }

                    let position = coords;
                    let tooltipDirection = 'right';
                    let tooltipOffset = [20, 0];

                    if (isSweetwater && totalLocationsAtAddress > 1) {
                        const angle = (360 / totalLocationsAtAddress) * index;
                        const radius = 0.002; // Increased radius for more spacing
                        const latOffset = radius * Math.cos(angle * (Math.PI / 180));
                        const lonOffset = radius * Math.sin(angle * (Math.PI / 180));
                        position = [coords[0] + latOffset, coords[1] + lonOffset];

                        // For Sweetwater, show tooltips on the left for the grouped fields to prevent overlap
                        if (locationName.includes('Fields 1 & 6') || locationName.includes('Fields 2 & 7')) {
                            tooltipDirection = 'left';
                            tooltipOffset = [-20, 0];
                        }
                    }

                    const customIcon = L.divIcon({
                        className: isHighlighted ? 'highlighted-marker-icon' : 'custom-marker-icon',
                        html: `<span>${gameCount}</span>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15],
                    });
                    
                    const eli7eGames = locationGames.filter(g => {
                        if (!g.isEli7eGame) return false;
                        const isHome = g.homeTeam.includes('ELI7E FC');
                        const isAway = g.awayTeam.includes('ELI7E FC');
                        return (showAwaySummaries.includes('home') && isHome) || (showAwaySummaries.includes('away') && isAway);
                    });

                    return (
                        <Marker 
                            key={locationName} 
                            position={position}
                            icon={customIcon}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e);
                                    setLocationFilter(prev => {
                                        const newFilter = new Set(prev);
                                        if (newFilter.has(locationName)) newFilter.delete(locationName);
                                        else newFilter.add(locationName);
                                        return Array.from(newFilter);
                                    });
                                },
                            }}
                        >
                            {(isHighlighted || showAwaySummaries.length > 0) && eli7eGames.length > 0 && (
                                <Tooltip permanent direction={tooltipDirection} offset={tooltipOffset} className="game-card-tooltip">
                                    {eli7eGames.map(game => 
                                        <OnMapGameCard key={game.matchId} game={game} setSelectedMatchId={setSelectedMatchId} />
                                    )}
                                </Tooltip>
                            )}
                        </Marker>
                    );
                });
            })}
        </MapContainer>
    );
}

export default MapView;