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


//returns list of all courses
router.get('/courses', (req, res) => {
    Courses.findAll().then((courses)=>{
        res.json.stringify({
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
], (req, res) => {
     // Attempt to get the validation result from the Request object.
    const courseErrors = validationResult(req);    

    //user credentials are acquired from auth header
    const credentials = getCredentials(req);
    let newCourse = req.body;


    const checkTitleAndDescription = new Promise((resolve, reject) => {
        if(!courseErrors.isEmpty()) {
            const courseErrorMessages = courseErrors.array().map(error => error.msg);
            reject(courseErrorMessages);
        } else {
            console.log('Title and Description: passed');
            resolve();
        }
    });

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



    checkTitleAndDescription
    .then(()=>{return checkEmailAndPasswordProvided})
    .then(()=>{return Users.findAll({
            where: {
                emailAddress: credentials.email
            }
        });
    }).then((user)=>{return checkEmailInDatabase(user); })
    .then((user)=>{return checkPassword(user); })
    .then((user)=>{ 
        return Courses.build({
                    title: newCourse.title,
                    description: newCourse.description,
                    estimatedTime: newCourse.estimatedTime,
                    materialsNeeded: newCourse.materialsNeeded,
                    userId: user[0].id
                }).save()
     }).then((course)=>{ return res.redirect(201, '/courses/:course.id'); })
    .catch((err)=>{
        //err = 'There was an error processing your request.';
        console.warn(err);
        return res.status(401).json({ message: 'Access Denied' });
    });

});
    

//updates a user's course
router.put('/courses/:id', [
  check('title')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "title".'),
  check('description')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "description"'),
], (req, res) => {


     // Attempt to get the validation result from the Request object.
    const courseErrors = validationResult(req);   

    //user credentials are acquired from auth header
    const credentials = getCredentials(req);
    let newCourse = req.body;




    const checkTitleAndDescription = new Promise((resolve, reject) => {
        if(!courseErrors.isEmpty()) {
            const courseErrorMessages = courseErrors.array().map(error => error.msg);
            reject(courseErrorMessages);
        } else {
            console.log('Title and Description: passed');
            resolve();
        }
    });    

    const checkEmailAndPasswordProvided = new Promise((resolve, reject) => {
        if(credentials.pass && credentials.email) {
            console.log('Email Address and Password are present: passed');
            resolve();
        } else{
            reject('Email Address and Password are present: failed.');
        }
    });

    function checkEmailInDatabase(user) { 
        return new Promise((resolve, reject) => {
            if(user == null) {
                reject('Email Address is present: failed');
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
                reject('Password is a match: failed.');
            }
        });
    }

    function getCourseId(){
        return Courses.findByPk(req.params.id);
    }

    //function to check if the course.userid matchs the user's id
    function checkCourseIDandUserID(courseAndUser){
        return new Promise((resolve, reject) => {
            if(courseAndUser[0].userId === courseAndUser[1][0].id){
                console.log('User and Course ID match: passed');
                resolve(courseAndUser[0]);
            } else{
                reject('User and Course Id match: failed');
            }
        });
    }

    checkTitleAndDescription
    .then(()=>{return checkEmailAndPasswordProvided})
    .then(()=>{return Users.findAll({
            where: {
                emailAddress: credentials.email
            }
        });
    }).then((user)=>{return checkEmailInDatabase(user); })
    .then((user)=>{return checkPassword(user); })
    .then((user)=>{
            let courseId = getCourseId(); 
            return Promise.all([courseId, user]);
    }).then((courseAndUser)=>{
        return checkCourseIDandUserID(courseAndUser); })
    .then((course)=>{ 
        course.update(req.body);
        return res.status(204).json({ message: '' });
     })
    .catch((err)=>{
        //err = 'There was an error processing your request.';
        console.warn(err);
        return res.status(401).json({ message: 'Access Denied' });
    });

});



//delete's a user's course
router.delete('/courses/:id', (req, res) => {

    //user credentials are acquired from auth header
    const credentials = getCredentials(req);

    const checkEmailAndPasswordProvided = new Promise((resolve, reject) => {
        if(credentials.pass && credentials.email) {
            console.log('Email Address and Password are present: passed');
            resolve();
        } else{
            reject('Email Address and Password are present: failed.');
        }
    });

    function checkEmailInDatabase(user) { 
        return new Promise((resolve, reject) => {
            if(user == null) {
                reject('Email Address is present: failed');
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
                reject('Password is a match: failed.');
            }
        });
    }

    function getCourseId(){
        return Courses.findByPk(req.params.id);
    }

    //function to check if the course.userid matchs the user's id
    function checkCourseIDandUserID(courseAndUser){
        return new Promise((resolve, reject) => {
            if(courseAndUser[0].userId === courseAndUser[1][0].id){
                console.log('User and Course ID match: passed');
                resolve(courseAndUser[0]);
            } else{
                reject('User and Course Id match: failed');
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
            let courseId = getCourseId(); 
            return Promise.all([courseId, user]);
    }).then((courseAndUser)=>{return checkCourseIDandUserID(courseAndUser); })
    .then((course)=>{
        course.destroy();
        return res.status(204).json({ message: '' });
    }).catch((err)=>{
        //err = 'There was an error processing your request.';
        console.warn(err);
        return res.status(401).json({ message: 'Access Denied' });
    });

});


module.exports = router;
