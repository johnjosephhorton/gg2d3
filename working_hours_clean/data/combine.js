var csv, fs, load_time_zones, rawData, timezones, _;

fs = require('fs');

csv = require('csv');

_ = require('../js/underscore.min.js');

timezones = JSON.parse(fs.readFileSync("timezones.json", "utf-8"));

rawData = [];

csv().fromPath(__dirname + '/more_working_hours.csv').toPath(__dirname + '/sample.out').transform(function(data) {
  data.unshift(data.pop());
  return data;
}).on('data', function(data, index) {
  return rawData.push(data);
}).on('end', function(count) {
  var addToData, data;
  data = new Object;
  addToData = function(item) {
    var country, d, day, hour, i, key, mouse, num, w, workers, zeros, zerozeros;
    num = item[0], d = item[1], hour = item[2], country = item[3], w = item[4], key = item[5], mouse = item[6];
    workers = +w;
    day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(d);
    if (country === "Country") return;
    zeros = (function() {
      var _results;
      _results = [];
      for (i = 0; i < 24; i++) {
        _results.push(0);
      }
      return _results;
    })();
    zerozeros = (function() {
      var _results;
      _results = [];
      for (i = 0; i <= 6; i++) {
        _results.push(zeros.slice(0));
      }
      return _results;
    })();
    if (!(data[country] != null)) {
      data[country] = new Object();
      data[country]["hours"] = zerozeros.slice(0);
      data[country]["zones"] = timezones[country];
    }
    return data[country]["hours"][day][hour] = workers;
  };
  _.map(rawData, addToData);
  return load_time_zones(data);
}).on('error', function(error) {
  return console.log(error.message);
});

load_time_zones = function(data) {
  rawData = [];
  return csv().fromPath(__dirname + '/jobtypes_per_country.csv').toPath(__dirname + '/sample.out').transform(function(data) {
    data.unshift(data.pop());
    return data;
  }).on('data', function(data, index) {
    return rawData.push(data);
  }).on('end', function(count) {
    var addToData;
    addToData = function(item) {
      var big_cat, country, num, percent, projects, small_cat;
      percent = item[0], country = item[1], num = item[2], big_cat = item[3], small_cat = item[4], projects = item[5];
      projects = +projects;
      if (!(data[country] != null)) return;
      if (!(data[country]["job_types"] != null)) data[country]["job_types"] = {};
      if (!(data[country]["job_types"][big_cat] != null)) {
        data[country]["job_types"][big_cat] = {};
      }
      return data[country]["job_types"][big_cat][small_cat] = projects;
    };
    _.map(rawData, addToData);
    return fs.writeFileSync("working-data.json", JSON.stringify(data));
  }).on('error', function(error) {
    return console.log(error.message);
  });
};
