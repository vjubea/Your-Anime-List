const sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
let sql;

// Connect to DB
const db = new sqlite3.Database('./yourAnimeList.db', sqlite3.OPEN_READWRITE, (err)=> {
    if (err) {
        console.error(`Error: ${err.message}`);
        return;
    }
    console.log('Connected to the yourAnimeList database.');
    /*
    sql = fs.readFileSync('init_database.sql').toString();
    db.exec(sql, (err) => {
        if (err) return console.error(err.message);
        console.log('Database initialized.');
    });
    */
});

async function getUser(name) {
    return new Promise((resolve, reject) => {
        let getUserSQL = 'SELECT * FROM users WHERE username = ?';
        db.get(getUserSQL, [name], (err, row) => {
            if (err) reject(err);
            else {
                resolve(row ? row: null);
            }
        });
    });
}
// Insert data into table
async function addUser(name, pswd) {
    try { 
        if (await getUser(name) || name.toLowerCase() === "admin") {
            console.error("USER ALREADY EXISTS");
            return;
        }
        const sql = 'INSERT INTO users(username, password) VALUES (?,?)'
        await new Promise((resolve, reject) => { 
            db.run(sql, [name, pswd], (err) => {
                if (err) { reject(err);}
                else { 
                    resolve();
                } 
            }); 
        }); 
        console.log(`User ${name} added or updated successfully.`); 
    } catch (err) {
        console.error(err.message); 
    }
}

async function getAnimes() {
    const sql = "SELECT * FROM animes ORDER BY popularity DESC";
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                reject(err);
            }
            else if (!rows) {
                console.error(`Error: Empty Rows for getAnime() call.`);
                reject(err);
            }
            else {
                /*
                rows.forEach((row) => {
                    console.log(row);
                });
                */
                resolve(rows);
            } 
        });
    });
}

// Get all animes
async function getAnimeStudiosByAnimeId(id) {
    const sql =
    "SELECT title, studioID, studioName FROM (studio NATURAL JOIN producer NATURAL JOIN animes) WHERE animeID = ?";
    
    return new Promise((resolve, reject) => {
        db.all(sql, [id], (err, rows) => { 
            if (err) {
                console.error(`Error: ${err.message}`); 
                reject(err);
            } 
            else { 
                if (rows.length > 0) { 
                    console.log(`Here are the Studios of Anime: ${rows[0]['title']}`);
                    console.log(rows);
                } 
                else { 
                    console.log(`No studios found for animeID ${id}`);
                }
                resolve(rows); 
            }
        });
    });
    // select animeID, title, studioID, studioName from studio natural join producer natural join animes;
    // select * from watchlist natural join animes;
    /*  // Update data
        sql = 'UPDATE users SET username = ? WHERE password = ?';
        db.run(sql, ['Jake',abc], (err) => {
        if (err) return console.error(err.message); 
        });
    */
}

// Function to get the studio ID by name 
async function getStudioIdByName(studioN) { 
    return new Promise((resolve, reject) => { 
        let getStudioIDSQL = 'SELECT studioID FROM studio WHERE studioName = ?';
        db.get(getStudioIDSQL, [studioN], (err, row) => {
            if (err) reject(err);
            else {
                resolve(row ? row['studioID']: null);
            }
        });
    });
}
async function addNewAnime(title, director, relDate, genre, contr, studioN) {
    try {
        // Insert new anime
        let insertAnimeSQL =
        'INSERT INTO animes (title, director, releaseDate, genre, contributor) VALUES (?, ?, ?, ?, ?)';
        await new Promise((resolve, reject) => { 
            db.run(insertAnimeSQL, [title, director, relDate, genre, contr], function (err) { 
                if (err) reject(err);
                console.log(`\nInserted new anime: ${title}`);
                resolve();
            }); 
        });
        // Get the animeID of the newly inserted anime 
        let animeID = await new Promise((resolve, reject) => { 
            let getAnimeIDSQL = 'SELECT animeID FROM animes WHERE title = ?';
            db.get(getAnimeIDSQL, [title], (err, row) => { 
                if (err) reject(err);
                resolve(row.animeID);
            }); 
        }); 
        // Check if the studio exists
        studioN.split(',').forEach(async studio => {
            studio = studio.trim();
            let studioID = await getStudioIdByName(studio);
            // If the studio does not exist, insert it 
            if (!studioID || studioID === null) { 
                await new Promise((resolve, reject) => { 
                    let insertStudioSQL = 'INSERT INTO studio (studioName) VALUES (?)';
                    db.run(insertStudioSQL, [studioN], function(err) { 
                        if (err) { throw(err); }
                        else {
                            console.log(`Inserted new studio: ${studioN}`);
                            resolve();
                        }
                    }); 
                });
                studioID = await getStudioIdByName(studioN);
                console.log(`${studioN} received new studioID: ${studioID}`);
            }
            // Insert into the producer table 
            let insertProducerSQL = 'INSERT INTO producer (animeID, studioID) VALUES (?, ?)';
            await new Promise((resolve, reject) => {
                db.run(insertProducerSQL, [animeID, studioID], (err) => {
                    if (err) throw(err);
                    else resolve();
                });
            });
            console.log('<> Successfully associated new anime with the studio <>');
        });
    } 
    catch (err) {
        console.error(`Error: ${err.message}`);
        reject(err);
    }
}
// Function to get the studio ID by name 
async function getAnimeById(id) { 
    return new Promise((resolve, reject) => { 
        let getAnimeIDSQL = 'SELECT * FROM animes WHERE animeID = ?';
        db.get(getAnimeIDSQL, [id], (err, row) => {
            if (err) reject(err);
            else {
                row ? resolve(row) : reject(`Error: could not get anime by animeID ${id}`);
            }
        });
    });
}
// Function to get the studio ID by name 
async function getUserWatchlist(user) {
    try {
        const getWatchlistIDSQL = 'SELECT * FROM watchlist WHERE username = ?';
        return new Promise((resolve, reject) => {
            db.all(getWatchlistIDSQL, [user], (err, rows) => {
                if (err) reject(err);
                else {
                    rows? resolve(rows) : reject('Error: Could not get entries from Watchlist.');
                }
            });
        });
    } catch (err) {
        console.error(`Error: ${err.message}`);
        reject(err);
    }
}

async function updateWatchlist(username, animeID, increment) {
    try {
        // Add or delete from watchlist based on increment
        if (increment === 1) {
            const insertWatchlistSQL = 'INSERT INTO watchlist (username, animeID) VALUES (?, ?)';
            await new Promise((resolve, reject) => {
                db.run(insertWatchlistSQL, [username, animeID], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`\nAdded anime ID ${animeID} to ${username}'s watchlist.`);
                        resolve();
                    }
                });
            });
        } 
        else if (increment === -1) {
            const deleteWatchlistSQL = 'DELETE FROM watchlist WHERE username = ? AND animeID = ?';
            await new Promise((resolve, reject) => {
                db.run(deleteWatchlistSQL, [username, animeID], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`\nDeleted anime ID ${animeID} from ${username}'s watchlist.`);
                        resolve();
                    }
                });
            });
        }

        // Update the popularity count
        const updatePopularitySQL = 'UPDATE animes SET popularity = popularity + ? WHERE animeID = ?';
        await new Promise((resolve, reject) => {
            db.run(updatePopularitySQL, [increment, animeID], (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Popularity of animeID ${animeID} changed by ${increment}.`);
                    resolve();
                }
            });
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

async function addToWatchlist(username, animeID) {
    await updateWatchlist(username, animeID, 1);
}

async function deleteFromWatchlist(username, animeID) {
    await updateWatchlist(username, animeID, -1);
}
async function searchAnimes(searchQuery) {
    const sql = `
        SELECT * FROM animes
        WHERE (
            title LIKE ? OR
            genre LIKE ? OR
            director LIKE ? OR
            releaseDate LIKE ?
        )
        ORDER BY popularity DESC`;
        
    return new Promise((resolve, reject) => {
        db.all(
            sql,
            [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`],
            (err, rows) => {
                if (err) { reject(err); }
                else {
                    resolve(rows);
                }
            }
        ); 
    });
}

module.exports = {
    db,
    addUser,
    getUser,
    getAnimes,
    getAnimeById,
    addNewAnime,
    getStudioIdByName,
    getAnimeStudiosByAnimeId,
    getUserWatchlist,
    addToWatchlist,
    deleteFromWatchlist,
    searchAnimes
};