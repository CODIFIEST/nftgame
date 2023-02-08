# server
The backend Express server written in Node.js for our app.

# TASKS
1. A `.post` route to create a new user.

2. A `.get` route to get all users

## ARCHITECTURE
1. we want to save all the users to a file, permanently, so if the server restarts, they are saved. 
This means we need to, on server start, load that file, and every time a user is created, edit the file.

