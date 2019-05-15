'use strict';

const express = require('express');
const router = express.Router();
let Courses = require("../models").Courses;
let Users = require("../models").Users;
let sequelize = require("../models").sequelize;
const { check, validationResult } = require('express-validator/check');
const bcryptjs = require('bcryptjs');
const atob = require('atob');


//getCredentials returns the user's credentials from the authorization header
const getCredentials = (req) => {
  let credentials = null;
  const authHeaderVal = req.get('Authorization');

  //if authorization is not empty and starts with the string 'basic ' then
  if (authHeaderVal && authHeaderVal.startsWith('Basic ')) {
    //the username and password are set to base64cred
    const base64Credentials = authHeaderVal.slice(6);
    //the username and password are converted from base64 ascii to binary
    const stringCredentials = atob(base64Credentials);
    //the username and password are split into an array
    const partsCredentials = stringCredentials.split(':');
    //the credentials are set
    credentials = {
      email: partsCredentials[0],
      pass: partsCredentials[1],
    };
  }

  return credentials;
};


// Route that returns the current authenticated user.
router.get('/users', (req, res) => {
  
    let message = null;

    //user credentials are acquired from auth header
    const credentials = getCredentials(req);

  if (credentials) {
    //the email address is searched in the database
    Users.findAll({
        where: {
            emailAddress: credentials.email
        }
    }).then((user)=>{
        const authenticated = bcryptjs
        .compareSync(credentials.pass, user[0].password);
        // console.log(credentials.pass);
        // console.log(user[0].password);
        // console.log(user[0].id);
        // console.log(user[0].lastName);
        // console.log(user[0].firstName);
        // console.log(user[0].emailAddress);
        // console.log(authenticated);
        if (authenticated) {
            console.log(`Authentication successful for username: ${user[0].username}`);
            // Store the user on the Request object.
            //let user =[user[0].id, user[1].firstName, user[2].lastName, user[3].lastName, user[4].emailAddress];
             res.json({
                firstName: user[0].firstName,
                lastName: user[0].lastName,
                emailAddress: user[0].emailAddress,
                id: user[0].id,
                password: credentials.pass,
            });
        } else {
        throw message = `Authentication failure for username: ${user[0].username}`;
        }
    }).catch((err)=>{
        err = 'There was an error processing your request.';
        console.warn(err);
        res.status(401).json({ message: 'Access Denied' });

    });

  }else {
    message = 'Auth header not found';
  }

  if (message) {
    console.warn(message);
    res.status(401).json({ message: 'Access Denied' });
  }// } else {
  //   next();
  // }
});


// Route that creates a new user.
router.post('/users', [
  check('firstName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "first name"'),
  check('lastName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "last name"'),
  check('emailAddress')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "email address"'),
  check('password')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "password"'),
],(req, res) => {
     // Attempt to get the validation result from the Request object.
    const errors = validationResult(req);    

    //if validation errors
    if (!errors.isEmpty()) {
    // Use the Array `map()` method to get a list of error messages.
    const errorMessages = errors.array().map(error => error.msg);

    // Return the validation errors to the client.
    return res.status(400).json({ errors: errorMessages });
  }

  let newUser = req.body;

  Users.findAll({
        where: {
            emailAddress: newUser.emailAddress
        }
    }).then((user)=>{
      //if the user info is already in the system
        if(user[0]) {
             res.status(401).json({ message: 'User already exists in the system.' });
        }  //if the user's info is not in the system it is added 
        else{
            // Hash the new user's password.
          newUser.password = bcryptjs.hashSync(newUser.password);
          Users.build({
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              emailAddress: newUser.emailAddress,
              password: newUser.password
          }).save()
          res.redirect(201, '/');
        }
    });

  // // Hash the new user's password.
  // newUser.password = bcryptjs.hashSync(newUser.password);
  // Users.build({
  //     firstName: newUser.firstName,
  //     lastName: newUser.lastName,
  //     emailAddress: newUser.emailAddress,
  //     password: newUser.password
  // }).save()
  // res.redirect(201, '/');
});


module.exports = router;