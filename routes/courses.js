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


//returns list of all courses
router.get('/courses', (req, res) => {
    Courses.findAll().then((courses)=>{
        res.json({
            courses
        });
    });
});

//returns courses by id
router.get('/courses/:id', (req, res, next) => {
    Courses.findByPk(req.params.id).then((course) => {
        //if it is found then is is returned
        if(course) {
            res.json({
                course
            });
        } else{
            next();
        }
    });
});

//posts a new course
router.post('/courses', [
  check('title')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "title".'),
  check('description')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "description"'),
], async (req, res) => {
     // Attempt to get the validation result from the Request object.
    const courseErrors = validationResult(req);    

    //if validation errors
    if (!courseErrors.isEmpty()) {
        // Use the Array `map()` method to get a list of error messages.
        const courseErrorMessages = courseErrors.array().map(error => error.msg);

        // Return the validation errors to the client.
        return res.status(400).json({ courseErrors: courseErrorMessages });
    }

    let message = null;
    //user credentials are acquired from auth header
    const credentials = getCredentials(req);
    let newCourse = req.body;

    if (credentials) {
        //validates if user is in database
        Users.findAll({
            where: {
                emailAddress: credentials.email
            }
        }).then((user)=>{
            const authenticated = bcryptjs
            .compareSync(credentials.pass, user[0].password);

            if (authenticated) {
                Courses.build({
                    title: newCourse.title,
                    description: newCourse.description,
                    estimatedTime: newCourse.estimatedTime,
                    materialsNeeded: newCourse.materialsNeeded,
                    userId: user[0].id
                }).save()
                .then(() => {
                    Courses.findAll({
                        where: {
                            id: newCourse.title
                        }
                    }).then((course)=>{
                        return res.redirect(201, '/courses/:course.id');
                    });
                })
            } else {
                throw message = `Authentication failure for username: ${user[0].username}`;
            }
        }).catch((err)=>{
            err = 'There was an error processing your request.';
            console.warn(err);
            return res.status(401).json({ message: 'Access Denied' });
        });
    }else {
        message = 'Auth header not found';
    }

    if (message) {
        console.warn(message);
        res.status(401).json({ message: 'Access Denied' });
    }

  // Courses.findAll({
  //       where: {
  //           id: newCourse.title
  //       }
  //   }).then((course)=>{
  //       return res.redirect(201, '/courses/:course.id');
  //   });
});

module.exports = router;