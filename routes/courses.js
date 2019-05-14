'use strict';

const express = require('express');
const router = express.Router();
let Courses = require("../models").Courses;
let Users = require("../models").Users;
var sequelize = require("../models").sequelize;


router.get('/courses', (req, res) => {
    Courses.findAll().then((courses)=>{
        res.json({
            // for(let i =0; i < courses.length;i++){
                // id: courses[0].userId,
                courses,
                // title: courses.title,
                // description: courses.description, 
                // estimatedTime: courses.estimatedTime,
                // materialsNeeded: courses.materialsNeeded,
            // }
        });
    });
});


module.exports = router;