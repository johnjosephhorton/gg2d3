var csv, fs, rawData, timezones, _;

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
  console.log(data["Iraq"]);
  return fs.writeFileSync("working-data.json", JSON.stringify(data));
}).on('error', function(error) {
  return console.log(error.message);
});
