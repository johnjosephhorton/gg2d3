var csv, fs, rawData, timezones, _;

fs = require('fs');

csv = require('csv');

_ = require('../js/underscore.min.js');

timezones = JSON.parse(fs.readFileSync("timezones.json", "utf-8"));

rawData = [];

csv().fromPath(__dirname + '/all_working_hours.csv').toPath(__dirname + '/sample.out').transform(function(data) {
  data.unshift(data.pop());
  return data;
}).on('data', function(data, index) {
  return rawData.push(data);
}).on('end', function(count) {
  var addToData, data;
  data = new Object;
  addToData = function(item) {
    var country, day, hour, workers;
    country = item[1];
    if (country === "Country") return;
    workers = parseFloat(item[0]);
    day = item[3];
    hour = item[2];
    if (data[country]) {
      if (data[country]["hours"][day]) {
        return data[country]["hours"][day][hour] = workers;
      } else {
        return data[country]["hours"][day] = [workers];
      }
    } else {
      data[country] = new Object;
      data[country]["hours"] = [[workers]];
      return data[country]["zones"] = timezones[country];
    }
  };
  _.map(rawData, addToData);
  return fs.writeFileSync("working-data.json", JSON.stringify(data));
}).on('error', function(error) {
  return console.log(error.message);
});
