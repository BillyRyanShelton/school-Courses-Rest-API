'use strict';

const express = require('express');
const router = express.Router();
let Courses = require("../models").Courses;
let Users = require("../models").Users;
var sequelize = require("../models").sequelize;



// Route that creates a new user.
router.post('/users', (req, res) => {

});

module.exports = router;