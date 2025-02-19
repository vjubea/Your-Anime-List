const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const DBManager = require('./DBManager'); // Import DBManager.js

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));

// Session middleware
app.use(session({
    secret: 'default-secret-key',  // Default session secret for initial setup
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to true in production if using HTTPS
}));

// Middleware to Track Navigation History
app.use((req, res, next) => { 
    if (!req.session.history) { 
        req.session.history = []; 
    } 
    req.session.history.push(req.originalUrl);
    if (req.session.history.length > 10) { 
        // Limit history to the last 10 entries 
        req.session.history.shift(); 
    } 
    next();
});

// Serve the login page
app.get('/', (req, res) => {
    res.render('login');
});
// Serve the register page
app.get('/register', (req, res) => {
    res.render('register');
});


// Handle registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        await DBManager.addUser(username, password);
        res.redirect('/');
    } catch (err) {
        console.error(err.message);
        res.redirect('/register');
    }
});
// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    DBManager.db.get(sql, [username, password], async (err, user) => {
        if (err) {
            console.error(err.message);
            res.redirect('/');
        } else if (user) {
            req.session.user = user;
            res.redirect('/animes');
        } else {
            res.redirect('/');
        }
    });
});
// Handle logout 
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) { console.error(err);
            res.redirect('/animes');
        } 
        else { 
            res.redirect('/');
        }
    });
});


// Middleware to protect routes 
app.use((req, res, next) => { 
    if (!req.session.user) { 
        return res.redirect('/'); 
    } 
    next(); 
});


// Serve the animes page
app.get('/animes', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    let rows = await DBManager.getAnimes();
    if (rows) {
        res.render('animes', { animes: rows, user: req.session.user });
    } 
    else {
        console.error(err.message);
        res.redirect('/');
    }
});
// Add search route 
app.get('/search-animes', async (req, res) => { 
    const { searchQuery } = req.query;
    const username = req.session.user.username;
    try { 
        let rows = await DBManager.searchAnimes(searchQuery);
        res.render('animes', { animes: rows, user: req.session.user }); 
    } 
    catch (err) { 
        console.error(err.message);
        res.redirect('/animes'); 
    }
});

app.get('/add-anime', (req, res) => {
    res.render('addAnime');
});
app.post('/add-anime', async (req, res) => {
    const { title, director, relDate, genre, studioN } = req.body;
    const contributor = req.session.user.username;
    
    if (!title || !director || !relDate || !genre || !contributor || !studioN) {
        res.redirect('/add-anime'); // Redirect back to form if validation fails
    } else {
        try {
            await DBManager.addNewAnime(title, director, relDate, genre, contributor, studioN);
            res.redirect('/animes'); // Redirect to anime list after successful addition
        } catch (err) {
            console.error(err.message);
            res.redirect('/add-anime');
        }
    }
});


// Serve the watchlist page 
app.get('/watchlist', async (req, res) => { 
    if (!req.session.user) { 
        return res.redirect('/');
    }
    const thisUser = req.session.user;
    
    const sql = `
        SELECT animes.*
        FROM animes
        JOIN watchlist ON animes.animeID = watchlist.animeID
        WHERE watchlist.username = ?`;
    DBManager.db.all(sql, [thisUser.username], (err, rows) => {
        if (err) { 
            console.error(err.message); 
            res.redirect('/animes'); 
        } 
        else {
            rows.forEach(async (row) => {
                animeObj = await DBManager.getAnimeById(row.animeID);
                if (animeObj) {
                    studioArr = await DBManager.getAnimeStudiosByAnimeId(animeObj.animeID);
                    let studios = []
                    studioArr.forEach((std) => {
                        studios.push(std.studioName);
                    });
                    row['studios'] = studios.join(', ');
                }
            });
            res.render('watchlist', { 
                watchlist: rows, user: req.session.user
            }); 
        } 
    });
});

// Handle adding to watchlist
app.post('/add-to-watchlist', async (req, res) => {
    const { animeID } = req.body;
    const username = req.session.user.username;
    try {
        await DBManager.addToWatchlist(username, animeID);
        res.redirect('/animes');
    } catch (err) {
        console.error(err.message);
        res.redirect('/animes');
    }
});
// Handle deletion of selected watchlist items
app.post('/delete-from-watchlist', async (req, res) => {
    const { animeIDs } = req.body;
    const username = req.session.user.username; 
    try { 
        if (Array.isArray(animeIDs)) { 
            for (const animeID of animeIDs) { 
                await DBManager.deleteFromWatchlist(username, animeID);
            }
        } 
        else { 
            await DBManager.deleteFromWatchlist(username, animeIDs);
        } 
        res.redirect('/watchlist'); 
    } 
    catch (err) { 
        console.error(`Error: ${err.message}`);
        res.redirect('/watchlist'); 
    }
});

// Serve the details of a specific anime
app.get('/anime/:id', async (req, res) => {
    const animeID = req.params.id;
    const thisUser = req.session.user;
    try { 
        const anime = await DBManager.getAnimeById(animeID);
        if (anime) {
            studioArr = await DBManager.getAnimeStudiosByAnimeId(anime.animeID);
            let studios = []
            studioArr.forEach((std) => {
                studios.push(std.studioName);
            });
            anime['studios'] = studios.join(', ');

            const watchlist = await DBManager.getUserWatchlist(thisUser.username);
            let isInWatchlist = false;
            watchlist.forEach((entry) => {
                if (entry.animeID == anime.animeID) {
                    isInWatchlist = true;
                    return;
                }
            });
            
            res.render('animeDetails', { anime, user: req.session.user, isInWatchlist });
        } 
        else {
            res.redirect('/animes');
        }
    } catch (err) {
        console.error(`Error: ${err.message}`);
        res.redirect('/animes');
    }
});
// Serve the details of a specific anime from the watchlist
app.get('/watchlist/anime/:id', async (req, res) => {
    const animeID = req.params.id;
    const thisUser = req.session.user;

    try { 
        const anime = await DBManager.getAnimeById(animeID);
        if (anime) {
            studioArr = await DBManager.getAnimeStudiosByAnimeId(anime.animeID);
            let studios = []
            studioArr.forEach((std) => {
                studios.push(std.studioName);
            });
            anime['studios'] = studios.join(', ');

            const watchlist = await DBManager.getUserWatchlist(thisUser.username);
            let isInWatchlist = false;
            watchlist.forEach((entry) => {
                if (entry.animeID == anime.animeID) {
                    isInWatchlist = true;
                    return;
                }
            });
            res.render('watchlistAnimeDetails', { anime, user: req.session.user, isInWatchlist });
        } 
        else {
            res.redirect('/watchlist');
        }
    } catch (err) {
        console.error(err.message);
        res.redirect('/watchlist');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
/*
(async() => {
    await DBManager.addNewAnime("MyAdd", "Vlad Jubea", "2024-03-17", "Adventure", "ADMIN", "VStudio");
    await DBManager.addNewAnime("Kill la Kill", "Hiroyuki Imaishi", "2013-10-04", "Action Comedy Magical girl", "ADMIN", "Trigger");
    //await getAnimes();
})();
*/