'use strict';

const express = require('express');
const router = express.Router();
let Courses = require("../models").Courses;
let Users = require("../models").Users;
var sequelize = require("../models").sequelize;
const { check, validationResult } = require('express-validator/check');

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
  check('userId')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "userId"'),
],(req, res) => {
     // Attempt to get the validation result from the Request object.
    const courseErrors = validationResult(req);    

    //if validation errors
    if (!courseErrors.isEmpty()) {
    // Use the Array `map()` method to get a list of error messages.
    const courseErrorMessages = courseErrors.array().map(error => error.msg);

    // Return the validation errors to the client.
    return res.status(400).json({ courseErrors: courseErrorMessages });
  }

  let newCourse = req.body;

  Courses.findAll({
        where: {
            title: newCourse.title
        }
    }).then((course)=>{
      //if the course is already in the system
        if(course[0]) {
             res.status(401).json({ message: 'Course is already exists in the system.' });
        }  //if the user's info is not in the system it is added 
        else{
          Courses.build({
              title: newCourse.title,
              description: newCourse.description,
              estimatedTime: newCourse.estimatedTime,
              materialsNeeded: newCourse.materialsNeeded,
              userId: newCourse.userId
          }).save()
        }
    });
  Courses.findAll({
        where: {
            id: newCourse.title
        }
    }).then((course)=>{
        res.redirect(201, '/courses/:course.id');
    });
});

module.exports = router;