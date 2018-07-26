'use strict';
/*
 * use sample
 * logger.error.info('error detail');
 * logger.log.info('log detail');
​ */
const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

var filepath = require('../../config/propertiesConfig.js').filepath;

if (!fs.existsSync(filepath.logfilepath)) {
    fs.mkdirSync(filepath.logfilepath);
}

const myFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

const error = createLogger ({
    format: combine(
        label({label:'Error'}),
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.File({
            filename: path.join(filepath.logfilepath, 'errs.log'), 
            level: 'info'})
    ]
});

error.add(new transports.Console({
    format: format.simple()
}));

const log = createLogger ({
    format: combine(
        label({label:'Log'}),
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({
            filename: path.join(filepath.logfilepath, 'logs.log'), 
            level: 'info'})
    ]
});   

module.exports = {
    error: error,
    log: log,
};