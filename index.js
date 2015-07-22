/**
 * Scream plugin
 *
 * Add sound to checker and play when detect url down
 *
 * Installation
 * ------------
 * This plugin is disabled by default. To enable it, add its entry
 * from the `plugins` key of the configuration:
 *
 *   // in config/production.yaml
 *   plugins:
 *     # - ./plugins/scream
 *
 * Usage
 * -----
 * TODO
 */
var fs   = require('fs');
var ejs  = require('ejs');
var yaml = require('js-yaml');
var express = require('express');

var template = fs.readFileSync(__dirname + '/views/_detailsEdit.ejs', 'utf8');
var CheckEvent = require('../../models/checkEvent');

exports.initWebApp = function(options) {

    var app = options.app;
    app.use(express.static(__dirname + "/public/"));
    app.use(function (req, res, next) {
        if (req.files && req.files.check && req.files.check.scream_file && req.files.check.scream_file.type == 'audio/mp3') {
            req.body.check.scream_file = req.files.check.scream_file;
        }
        next();

    });

    options.app.on('beforeDashboardRoutes', function(app, dashboardApp) {
        dashboardApp.get('/down', function(req, res, next) {
            var templateDir = __dirname + '/views/';
            res.render(templateDir + 'down.ejs');
        });
    });



    var dashboard = options.dashboard;

    dashboard.on('populateFromDirtyCheck', function(checkDocument, dirtyCheck, type) {

        if (!dirtyCheck.scream_file) return;

        var scream_file = dirtyCheck.scream_file;
        fs.rename(scream_file.path, __dirname + '/public/uploads/' + checkDocument._id + '.' + scream_file.name, function (err) {
            if (err) {
                throw err;
            }
            console.log('renamed complete');
        });

        try {
            var options = yaml.safeLoad(scream_file.name);
            checkDocument.setPollerParam('scream_file', options);
        } catch (e) {
            if (e instanceof YAMLException) {
                throw new Error('Malformed YAML configuration ' + dirtyCheck.scream_file);
            } else throw e;
        }
    });

    dashboard.on('checkEdit', function(type, check, partial) {

        var scream_file = check.getPollerParam('scream_file');
        if (scream_file) {
            check.setPollerParam('scream_file', scream_file);
        }
        partial.push(ejs.render(template, { locals: { check: check } }));
    });


};
