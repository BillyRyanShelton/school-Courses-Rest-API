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
      name: partsCredentials[0],
      pass: partsCredentials[1],
    };
  }

  return credentials;
};


// Route that creates a new user.
router.post('/users', (req, res) => {
    let newUser = req.body;
    Users.build({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        emailAddress: newUser.emailAddress,
        password: newUser.password
    }).save()});

module.exports = router;