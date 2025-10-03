// getData.js
import fetch from 'node-fetch';
import fs from 'fs';
import csv from 'csv-parser';

// --- CONFIGURATION ---
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRBNpn4jhZdelzI9Dh8X6Nrii7NuKOnQu2q1zTY7-Tw0oy4Tq0VYOa3rjcViUT8L-TWWvJX_9x3zxNY/pub?gid=81057849&single=true&output=csv';


// 2. The address mapping we built previously
const locationAddresses = {
  "Sweetwater Lane- ELI7E Turf Complex - Field 3 (7v7 east)": "1312 Sweetwater Ln, Spring Valley, CA 91977",
  "Coronado Cays Park - Field 1B - 7v7": "99 Grand Caribe Isle, Coronado, CA 92118",
  "Sweetwater Lane- ELI7E Turf Complex - Field 1 (9v9/7v7 west)": "1312 Sweetwater Ln, Spring Valley, CA 91977",
  "Renette Park - 11v11": "935 S Emerald Ave, El Cajon, CA 92020",
  "Harvest Park - GEFC field #1": "30833 SD-76, Pauma Valley, CA 92061",
  "Encinitas Community Park - ECP #3": "425 Santa Fe Dr, Encinitas, CA 92024",
  "4S Ranch Sports Park - 4S - Field 5 (SD Force FC) 11v11": "16118D 4S Ranch Parkway, San Diego, CA 92127",
  "Cesar Solis Comm. Park - Field #1": "4901 Del Sol Blvd, San Diego, CA 92154",
  "Los Ninos Park - Field 2": "150 Teal St, Chula Vista, CA 91910",
  "Sweetwater Lane- ELI7E Turf Complex - Field 6 (11v11 west)": "1312 Sweetwater Ln, Spring Valley, CA 91977",
  "Sequioa Elementary School - Field #1 (7v7)": "4690 Limerick Ave, San Diego, CA 92117",
  "Orange Park - 11 v 11": "1475 Fourth Ave, Chula Vista, CA 91911",
  "Santa Venetia Park - Ballfield 7v7": "1501 Magdalena Ave, Chula Vista, CA 91913",
  "Cubberley Elementary School - Field 1": "3201 Marathon Dr, San Diego, CA 92123",
  "Surf Sports Park - Field D": "14989 Via De La Valle, Del Mar, CA 92014",
  "Pershing Middle School - Pershing Middle School #2": "8204 San Carlos Dr, San Diego, CA 92119",
  "Cesar Solis Comm. Park - Field #5": "4901 Del Sol Blvd, San Diego, CA 92154",
  "ROBB FIELD - Field 1 (7v7)": "2525 Bacon St, San Diego, CA 92107",
  "Terra Nova Park - Field 3 (7v7)": "4400 Terra Nova Dr, San Diego, CA 92111",
  "Montgomery Waller Park - Field 1 11v11": "3020 Coronado Ave, San Diego, CA 92154",
  "Allen Field - Allen Center": "3908 Torrey Pines Rd, La Jolla, CA 92037",
  "Santa Venetia Park - North 9v9": "1501 Magdalena Ave, Chula Vista, CA 91913",
  "Larsen Field - Field #1": "4961 64th St, San Diego, CA 92115",
  "Joan MacQueen Middle School - Field 1 Turf 11v11": "2001 Tavern Rd, Alpine, CA 91901",
  "Surf Sports Park - Field 07": "14989 Via De La Valle, Del Mar, CA 92014",
  "Arbolitos Sport Fields - South - 7v7": "14401 Pomerado Rd, Poway, CA 92064",
  "Cherokee Joint Use Field - Field #1": "3735 38th St, San Diego, CA 92105",
  "Naranca Elementary School - Naranca 7v7": "1030 Naranca Ave, El Cajon, CA 92021",
  "Los Coches Creek Middle School - 9v9": "9669 Dunbar Ln, El Cajon, CA 92021",
  "Heritage Park (San Diego) - Field #1 (9v9)": "2454 Heritage Park Row, San Diego, CA 92110",
  "Cottonwood Park - Field #2 - Back (7v7)": "1778 E Palomar St, Chula Vista, CA 91913",
  "Los Coches Creek Middle School - 7v7": "9669 Dunbar Ln, El Cajon, CA 92021",
  "Design 39 Campus - D39 Field 3 (9v9) - Back": "16601 Nighthawk Ln, San Diego, CA 92127",
  "Sweetwater Lane- ELI7E Turf Complex - Field 4 (7v7 north)": "1312 Sweetwater Ln, Spring Valley, CA 91977",
  "Sweetwater Lane- ELI7E Turf Complex - Field 2 (9v9/7v7 middle)": "1312 Sweetwater Ln, Spring Valley, CA 91977",
  "ROBB FIELD - Field 3 (7v7)": "2525 Bacon St, San Diego, CA 92107",
  "Allied Garden Recreation Center - Allied Gardens 9v9 #1": "5155 Greenbrier Ave, San Diego, CA 92120",
  "Language Academy - Language Academy": "4961 64th St, San Diego, CA 92115",
  "North Park Recreation Center (NPRC) - Field #2": "4044 Idaho St, San Diego, CA 92104",
  "Taft Middle School - Field 1": "9191 Gramercy Dr, San Diego, CA 92123",
  "Del Norte High School - DNHS - Field 3 (Middle)": "16601 Nighthawk Ln, San Diego, CA 92127",
  "Cesar Solis Comm. Park - Field #4": "4901 Del Sol Blvd, San Diego, CA 92154",
  "Montgomery MS El Cajon - South 9v9": "1570 Melody Ln, El Cajon, CA 92019",
  "Cesar Chavez Park - Field #2": "1449 Cesar E. Chavez Pkwy, San Diego, CA 92101",
  "Rosa Parks Joint Use - Field #1": "4433 54th St, San Diego, CA 92115",
  "Orange Park - 9 v 9": "1475 Fourth Ave, Chula Vista, CA 91911",
  "Tierrasanta Rec Center - TIERRASANTA REC CENTER #1 (7v7, 9v9 or 11v11)": "11220 Clairemont Mesa Blvd, San Diego, CA 92124",
  "Rosa Parks Joint Use - Field #2": "4433 54th St, San Diego, CA 92115",
  "Southwestern College - T-1 - Large Turf (11v11)": "900 Otay Lakes Rd, Chula Vista, CA 91910",
  "ROBB FIELD - Field 2 (7v7)": "2525 Bacon St, San Diego, CA 92107",
  "Design 39 Campus - D39 Field 3 (7v7)": "16601 Nighthawk Ln, San Diego, CA 92127",
  "Los Coches Creek Middle School - Lower 7v7": "9669 Dunbar Ln, El Cajon, CA 92021",
  "Aviara Park - Field 6": "6435 Ambrosia Ln, Carlsbad, CA 92011",
  "4S Ranch Sports Park - 4S 6A": "16118D 4S Ranch Parkway, San Diego, CA 92127",
  "Vista Sports Park - Vista Sports Park Field 2": "11220 Clairemont Mesa Blvd, San Diego, CA 92124",
  "Allied Garden Recreation Center - Allied Gardens 7 v 7 #1": "5155 Greenbrier Ave, San Diego, CA 92120",
  "Hickman Field - Hickman Field #1": "5100 Hickman Field Dr, San Diego, CA 92111",
  "ELI7E Turf Campus- La Presa - Field 4": "9015 N Bonita St, Spring Valley, CA 91977",
  "ELI7E Turf Campus- La Presa - Field 5": "9015 N Bonita St, Spring Valley, CA 91977",
  "Coronado Cays Park - Field 1A - 7v7": "99 Grand Caribe Isle, Coronado, CA 92118",
  "Cardiff Elementary School - Cardiff Elementary #2": "1888 Montgomery Ave, Cardiff, CA 92007",
  "Luz Duran Park - Field 2": "340 E Townsite Dr, Vista, CA 92084",
  "WD Hall Elementary - Field 1 7v7/9v9": "1000 E Chase Ave, El Cajon, CA 92020",
  "Pine Avenue Park - #7 7v7": "3209 Harding St, Carlsbad, CA 92008",
  "Spring Valley Academy - Field 1": "3900 Conrad Dr, Spring Valley, CA 1977",
  "Mission Vista High School - MVHS Lower Field": "1306 Melrose Dr, Oceanside, CA 92057",
  "Wangenheim Middle School - Field 3 9v9": "9230 Gold Coast Dr, San Diego, CA 92126",
  "NO GAME - TEAM HAS DROPPED - NO GAME - TEAM DROPPED": "Not applicable",
  "Sunset View Park - North Field - Right Side (11v11)": "1390 S Greensview Dr, Chula Vista, CA 91915",
  "Cottonwood Park - Field #1 - Front (7v7)": "1778 E Palomar St, Chula Vista, CA 91913",
  "Hollandia Park - Hollandia": "12 Mission Hills Ct, San Marcos, CA 92069",
  "ALBION Park - Field 1 (7v7)": "2015 Birch Rd, Chula Vista, CA 91915",
  "Rolando Park Elementary - Field 2 (Upper)": "6620 Marlowe Dr, San Diego, CA 92115",
  "ALBION Park - Field 2 (7v7)": "2015 Birch Rd, Chula Vista, CA 91915",
  "Aviara Park - Field 7": "6435 Ambrosia Ln, Carlsbad, CA 92011",
  "ELI7E Turf Campus- La Presa - Field 1": "9015 N Bonita St, Spring Valley, CA 91977"
};

// Helper to convert time like "5:40 PM" to "17:40"
// getData.js

const convertTo24Hour = (timeString) => {
    if (!timeString || !timeString.includes(' ')) return '';
    const [time, modifier] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);

    if (modifier === 'PM' && hours < 12) {
        hours += 12;
    }
    if (modifier === 'AM' && hours === 12) { // Handle midnight case (12:xx AM)
        hours = 0;
    }
    return `${String(hours).padStart(2, '0')}:${minutes}`;
};

// Helper to clean team names
const cleanEli7eTeamName = (name) => {
    if (!name) return '';
    return name.replace(/ ?- ?/g, ' ').replace('ELI7E FC', '').trim();
}


const geocodedCachePath = './geocache.json';
let geocodedCache = {};
try {
    geocodedCache = JSON.parse(fs.readFileSync(geocodedCachePath));
} catch (e) { /* ignore */ }


async function geocode(address) {
    if (!address || address === "Not applicable") return null;
    if (geocodedCache[address]) return geocodedCache[address];

    console.log(`   -> Geocoding new address: ${address}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
            { headers: { 'User-Agent': 'AAFC Map App/1.0 (your-email@example.com)' } }
        );
        const data = await response.json();
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);

            if (!isNaN(lat) && !isNaN(lon)) {
                const result = { lat, lon };
                geocodedCache[address] = result;
                return result;
            }
        }
    } catch (error) { console.error(`Geocoding error for ${address}:`, error); }
    
    console.warn(`   -> FAILED to get valid coordinates for address: ${address}`);
    geocodedCache[address] = null;
    return null;
}

async function processData() {
    console.log('Fetching CSV data...');
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) { console.error(`❌ FATAL ERROR: Network request failed.`); return; }

    const allGames = [];
    const parser = response.body.pipe(csv());

    for await (const data of parser) {
        const locationName = data['Location'];
        const address = locationAddresses[locationName];

        if (address) {
            const coords = await geocode(address);
            if (coords) {
                let homeTeam = data['Home Team'], awayTeam = data['Away Team'];
                const originalEli7eName = data['ELI7E Team'];
                let isEli7eGame = false;

                if (originalEli7eName && originalEli7eName.trim() !== "") {
                    const cleanedName = cleanEli7eTeamName(originalEli7eName);
                    if (homeTeam.includes('ELI7E')) { homeTeam = cleanedName; isEli7eGame = true; }
                    if (awayTeam.includes('ELI7E')) { awayTeam = cleanedName; isEli7eGame = true; }
                }
                
                allGames.push({
                    matchId: data['Match #'], date: data['Date'],
                    time: data['Time'],
                    time24: convertTo24Hour(data['Time']), // Add 24-hour time
                    homeTeam, awayTeam, location: locationName, address,
                    division: data['Division'], coachName: data['Coach Name'],
                    isEli7eGame,
                    eli7eTeamName: isEli7eGame ? cleanEli7eTeamName(originalEli7eName) : null,
                    coords: [coords.lat, coords.lon],
                });
            }
        }
    }

    fs.writeFileSync('./public/games.json', JSON.stringify(allGames, null, 2));
    fs.writeFileSync(geocodedCachePath, JSON.stringify(geocodedCache, null, 2));
    console.log(`\n✅ Success! Wrote ${allGames.length} games to public/games.json`);
}

processData().catch(e => console.error("An unexpected error occurred:", e));