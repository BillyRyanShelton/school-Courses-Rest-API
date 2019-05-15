'use strict';

const express = require('express');
const router = express.Router();
let Courses = require("../models").Courses;
let Users = require("../models").Users;
var sequelize = require("../models").sequelize;


router.get('/courses', (req, res) => {
    Courses.findAll().then((courses)=>{
        res.json({
            courses
        });
    });
});

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


module.exports = router;