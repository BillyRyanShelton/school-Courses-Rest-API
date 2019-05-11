'use strict';

const express = require('express');
const router = express.Router();
let Courses = require("../models").Courses;
let Users = require("../models").Users;
var sequelize = require("../models").sequelize;



module.exports = router;