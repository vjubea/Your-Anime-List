NAME: Vlad Jubea | 101259927

# English description and ER model of your database:
Final_Database_Description.pdf

# Sqlite3 Database:
yourAnimeList.db - database used by the web-app.

# YouTube Demo VIDEO LINK
https://www.youtube.com/watch?v=wq78d8Gt8mM

WEB-APP INSTALL INSTRUCTIONS: 
1. Open a console an integrated console within the current folder.
2. Type `npm install` in the console to install the required npm modules.

LAUNCH INSTRUCTIONS:
Type `node app.js` in the console to start the server.

TESTING INSTRUCTIONS: 
1. Visit `http://localhost:3000` within a browser window.
2. Register by clicking "Don't have an account? Register" blue text.
    2a. Provide the username that will identify you and your contributions to the database.
    2b. Provide the password for securing your account access.
    2c. Click "Register" Button to register this account.
3. Login into the Database App.
    2a. Provide your created account's username.
    2b. Provide your created account's password.
    2c. Click "Login" Button to log in.
4. The App will move you to the Homepage ('/animes' endpoint), where you will see the Public Animes list.
5. Click on any anime from that list.
6. Click "Add to Watchlist" to add an anime to your Private Watchlist.
    6a. Otherwise, click "Back to Animes" if anime is already in your watchlist.
7. The app returns you to the Homepage.
8. Click "Go to Watchlist" to go to access your Private Watchlist.
9. Click the box on the left of any anime in your Private Watchlist to select it
    9a. Click instead on the Anime listed to load its description page.
10. The "Delete Selected" button appears if at least one anime is selected.
11. Click "Delete Selected" button to remove selected anime(s) from your Private Watchlist.
12. Click "Back to Anime List" to return to Homepage.
13. Continue using the database until done.
    13a. To add a new anime to the Database, click "Add New Anime" in the Homepage.
    13b. Fill out all required information, separating multiple studios by ','.
    13c. Click "Submit" to add the new anime to the Database.
14. Click "Log Out" to exit from the account you're currently logged in.
