'use strict';

const express = require('express');
const router = express.Router();
let Courses = require("../models").Courses;
let Users = require("../models").Users;
let sequelize = require("../models").sequelize;
const { check, validationResult } = require('express-validator/check');
const bcryptjs = require('bcryptjs');
const atob = require('atob');
const prettyFormat = require('pretty-format');


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

//returns the currently authenticated user
router.get('/users', (req, res) => {

  //user credentials are acquired from auth header
  const credentials = getCredentials(req);

  const checkEmailAndPasswordProvided = new Promise((resolve, reject) => {
        if(credentials.pass && credentials.email) {
            console.log('Email Address and Password are present: passed');
            resolve();
        } else{
            reject('The Email Address/Password were not provided.');
        }
  });


  function checkEmailInDatabase(user) { 
      return new Promise((resolve, reject) => {
          if(user == null) {
              reject('The Email Address was not found.');
          } else{
              //validates if user is in database
              console.log('Email Address is present: passed');
              resolve(user);
          }
      });
  }


   function checkPassword(user){ 
      return new Promise((resolve, reject) =>{
          //the user password is compared with the database password
          const authenticated = bcryptjs.compareSync(credentials.pass, user[0].password);
          if(authenticated){
              console.log('Password is a match: passed');
              resolve(user);
          } else{
              reject('The Password is invalid.');
          }
      });
  }



  checkEmailAndPasswordProvided
  .then(()=>{return Users.findAll({
          where: {
              emailAddress: credentials.email
          }
      });
  }).then((user)=>{return checkEmailInDatabase(user); })
  .then((user)=>{return checkPassword(user); })
  .then((user)=>{
    res.json({
                firstName: user[0].firstName,
                lastName: user[0].lastName,
                emailAddress: user[0].emailAddress,
                id: user[0].id,
                password: credentials.pass,
            });
  })
  .catch((err)=>{
      //err = 'There was an error processing your request.';
      console.warn(err);
      return res.status(401).json({ message: 'Access Denied' });
  });


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
  const userErrors = validationResult(req);    

  //user credentials are acquired from auth header
  const credentials = getCredentials(req);

  const checkFirstLastEmailAndPassword = new Promise((resolve, reject) => {
      if(!userErrors.isEmpty()) {
          const userErrorMessages = userErrors.array().map(error => error.msg);
          reject(userErrorMessages);
      } else {
          console.log('First Name, Last Name, Email, Password Present: passed');
          resolve();
      }
  });   

  function checkIfUserIsInSystem(user){ 
    return new Promise((resolve, reject) =>{
      let newUser = req.body;
      if(user[0]) {
        reject('User already exists in the system.');
           // res.status(401).json({ message: 'User already exists in the system.' });
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
        resolve();
      }
    });
  }

    checkFirstLastEmailAndPassword
    .then(()=>{return Users.findAll({
        where: {
            emailAddress: req.body.emailAddress
        }
      })
    })
    .then((user)=>{ return checkIfUserIsInSystem(user)})
    .catch((err)=>{
        //err = 'There was an error processing your request.';
        console.warn(err);
        return res.status(401).json({ message: 'Access Denied' });
    });

});

module.exports = router;