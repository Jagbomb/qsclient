module.exports = function(app) {

  var Validator = require('../lib/validator.js').Validator
    , API = require('../lib/api.js').API
    , Util = require('../lib/util.js')
    , _ = require('lodash');

  var Sleep = {};

  Sleep.getSleeps = function(req, res, next) {

    var apiCall = new API(req);
    apiCall.get(
      '/users/' + req.session.user.code + '/sleeps?access_token=' + req.session.user.access_token, function (dataSleeps) {

      dataSleeps = JSON.parse(dataSleeps);

      if(typeof dataSleeps.error !== 'undefined') {
        return res.json(500, dataSleeps);
      }

      res.render('pages/sleep', {
        locals: {
          host: app.get('app-host'),
          session: req.session,
          pageInfos: {
            id: 'page-sleep',
            class: '',
            title: 'QSClient - Sleep'
          },
          sleeps: dataSleeps,
          charts: sleepsToCharts(dataSleeps)
        }
      });

    });

  };

  Sleep.postSleep = function(req, res, next) {

    new Validator(defineValidators(req), function (err, errMsg) {

      var sleep = req.body.sleep;

      if(err) {
        res.json(500, { error: 'You must provide : ' + errMsg });
        return false;
      }

      var dataToSend = {
        start: Util.formToDate(sleep.start_date, sleep.start_time),
        end: Util.formToDate(sleep.end_date, sleep.end_time)
      };

      var apiCall = new API(req);
      var user = req.session.user;
      apiCall.post('/users/' + user.code + '/sleeps?access_token=' + user.access_token, dataToSend, function (dataSleeps) {

        dataSleeps = JSON.parse(dataSleeps);

        if(typeof dataSleeps.error !== 'undefined') {
          return res.json(500, dataSleeps);
        }

        res.render('templates/sleep', {
          locals: {
            host: app.get('app-host'),
            session: req.session,
            pageInfos: {
              id: 'page-sleep',
              class: '',
              title: 'QSClient - Sleep'
            },
            sleeps: [dataSleeps]
          }
        });

      });

    });

    function defineValidators(req) {
      var sleep = req.body.sleep;
      return [
        {
          str: Util.formToDate(sleep.end_date, sleep.end_time),
          msg: ' a valid sleep end date',
          method: 'isDate()'
        }
      ];
    }

  };

  Sleep.deleteSleep = function(req, res, next) {

    var apiCall = new API(req);
    var user = req.session.user;
    var id = req.params.sleepId;
    apiCall['delete']('/users/' + user.code + '/sleeps/' + id + '?access_token=' + user.access_token, function (dataSleeps) {

      dataSleeps = JSON.parse(dataSleeps);

      if(typeof dataSleeps.error !== 'undefined') {
        return res.json(500, dataSleeps);
      }

      res.json(200, dataSleeps);

    });

  };

  function sleepsToCharts(sleeps) {
    var minutes = [],
        more = 0,
        less = 0;
    _.map(sleeps, function(sleep) {
      var value = {},
          start = new Date(sleep.start),
          end = new Date(sleep.end);
      value.date = (end.getMonth() + 1) + '/' + end.getDate() + '/' + end.getFullYear();
      var d = diff(start, end);
      value.values = d;
      if(d >= 420) {
        more++;
      } else {
        less++;
      }
      minutes.push(value);
    })

    function diff(start, end) {
      var diffMs = (end - start);
      return Math.round(diffMs / (1000 * 60));
    }

    return {
      minutes: minutes,
      pie: {
        more: (more * 100) / sleeps.length,
        less: (less * 100) / sleeps.length
      }
    };
  }

  return Sleep;

};
