import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function MapClickHandler({ resetFilters }) {
    useMapEvents({
        click: () => {
            resetFilters();
        },
    });
    return null;
}

const OnMapGameCard = ({ game, setSelectedMatchId }) => (
    <div className="on-map-game-card" onClick={() => setSelectedMatchId(game.matchId)}>
        <span>{game.time24}</span>
        <span>{game.eli7eTeamName}</span>
        <span>{game.coachName}</span>
    </div>
);

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
                const uniqueLocations = [...new Set(gamesAtAddress.map(g => g.location))];
                const totalLocationsAtAddress = uniqueLocations.length;
                
                return uniqueLocations.map((locationName, index) => {
                    const locationGames = gamesAtAddress.filter(g => g.location === locationName);
                    if (locationGames.length === 0) return null;

                    const gameCount = locationGames.length;
                    const coords = locationGames[0].coords;
                    const isHighlighted = locationFilter === locationName;
                    
                    if (!coords || isNaN(coords[0]) || isNaN(coords[1])) {
                        return null; 
                    }

                    let position = coords;
                    if (totalLocationsAtAddress > 1) {
                        const angle = (360 / totalLocationsAtAddress) * index;
                        const radius = 0.001;
                        const latOffset = radius * Math.cos(angle * (Math.PI / 180));
                        const lonOffset = radius * Math.sin(angle * (Math.PI / 180));
                        position = [coords[0] + latOffset, coords[1] + lonOffset];
                    }

                    const customIcon = L.divIcon({
                        className: isHighlighted ? 'highlighted-marker-icon' : 'custom-marker-icon',
                        html: `<span>${gameCount}</span>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15],
                    });
                    
                    const isSweetwater = locationName.includes('Sweetwater');
                    const eli7eGames = locationGames.filter(g => g.isEli7eGame);

                    return (
                        <Marker 
                            key={locationName} 
                            position={position}
                            icon={customIcon}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e);
                                    setLocationFilter(locationName);
                                },
                            }}
                        >
                            {showAwaySummaries && !isSweetwater && eli7eGames.length > 0 && (
                                <Tooltip permanent direction="right" offset={[20, 0]} className="game-card-tooltip">
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