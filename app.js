const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
app.use(express.json());

const dbpath = path.join(__dirname, "userData.db");
let db = null;

const InitializeAndStartServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`dberror : ${e.message}`);
    process.exit(1);
  }
};
InitializeAndStartServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashPassword = await bcrypt.hash(request.body.password, 10);
  const getUser = `
     Select *
     from user
     where
     username = '${username}';`;
  const result = await db.get(getUser);
  if (result === undefined) {
    if (request.body.password.length > 5) {
      const createQuery = `
         INSERT INTO user (username, name, password, gender, location)
         VALUES(
            '${username}',
            '${name}',
            '${hashPassword}',
            '${gender}',
            '${location}'
         );`;
      const dbResponse = await db.run(createQuery);
      response.send("User created successfully");
    } else {
      request.status = 400;
      response.send("Password is too short");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUser = `
     Select *
     from user
     where
     username = '${username}';`;
  const result = await db.get(getUser);
  if (result !== undefined) {
    const isPasswordMatched = await bcrypt.compare(password, result.password);
    if (isPasswordMatched === true) {
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  } else {
    response.status = 400;
    response.send("Invalid user");
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUser = `
     Select *
     from user
     where
     username = '${username}';`;
  const result = await db.get(getUser);

  const isPasswordMatched = await bcrypt.compare(oldPassword, result.password);
  if (isPasswordMatched) {
    if (request.body.newPassword.length > 4) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = `
                 UPDATE user 
                 SET
                 password = '${hashedPassword}'
                 WHERE 
                 username = '${result}';
             `;
      const userResponse = await db.run(updateQuery);
      response.send("Password updated");
    } else {
      response.status = 400;
      response.send("Password is too short");
    }
  } else {
    response.status = 400;
    response.send("Invalid current password");
  }
});

module.exports = app;
