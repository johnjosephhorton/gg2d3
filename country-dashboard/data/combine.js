var calculate_global, csv, fs, load_normalized, load_sorted_by_category, load_time_zones, load_utc, rawData, timezones, _;

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
    var country, d, day, hour, i, key, morezeroes, mouse, num, w, workers, zero;
    num = item[0], d = item[1], hour = item[2], country = item[3], w = item[4], key = item[5], mouse = item[6];
    workers = +w;
    day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(d);
    if (country === "Country") return;
    zero = function() {
      var i, _results;
      _results = [];
      for (i = 0; i < 24; i++) {
        _results.push(0);
      }
      return _results;
    };
    morezeroes = (function() {
      var _results;
      _results = [];
      for (i = 0; i <= 6; i++) {
        _results.push(zero());
      }
      return _results;
    })();
    if (!(data[country] != null)) {
      data[country] = new Object();
      data[country]["hours"] = morezeroes;
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
    return load_normalized(data);
  }).on('error', function(error) {
    return console.log(error.message);
  });
};

load_normalized = function(data) {
  rawData = [];
  return csv().fromPath(__dirname + '/normal_hours.csv').toPath(__dirname + '/sample.out').transform(function(data) {
    data.unshift(data.pop());
    return data;
  }).on('data', function(data, index) {
    return rawData.push(data);
  }).on('end', function(count) {
    var addToData;
    addToData = function(item) {
      var country, day, hour, i, key, morezeroes, mouse, workers, zero;
      hour = item[0], country = item[1], workers = item[2], key = item[3], mouse = item[4], day = item[5];
      workers = +workers;
      day = +day;
      if (country === "country" || country.length === 0) return;
      if (!(data[country]["normal_hours"] != null)) {
        zero = function() {
          var i, _results;
          _results = [];
          for (i = 0; i < 24; i++) {
            _results.push(0);
          }
          return _results;
        };
        morezeroes = (function() {
          var _results;
          _results = [];
          for (i = 0; i <= 6; i++) {
            _results.push(zero());
          }
          return _results;
        })();
        data[country]["normal_hours"] = morezeroes;
      }
      return data[country]["normal_hours"][day][hour] = workers;
    };
    _.map(rawData, addToData);
    return load_utc(data);
  }).on('error', function(error) {
    return console.log(error.message);
  });
};

load_utc = function(data) {
  rawData = [];
  return csv().fromPath(__dirname + '/contractor_activity_over_time_local.csv').toPath(__dirname + '/sample.out').transform(function(data) {
    data.unshift(data.pop());
    return data;
  }).on('data', function(data, index) {
    return rawData.push(data);
  }).on('end', function(count) {
    var addToData;
    addToData = function(item) {
      var absolute, country, day, hour, i, morezeroes, relative, total, zero;
      total = item[0], country = item[1], day = item[2], hour = item[3], relative = item[4], absolute = item[5];
      if (country === "United States") console.log(item);
      relative = +relative;
      absolute = +absolute;
      if (country === "country" || country.length === 0) return;
      if (!(data[country].total != null)) data[country].total = total;
      if (!(data[country]["utc_hours"] != null)) {
        zero = function() {
          var i, _results;
          _results = [];
          for (i = 0; i < 24; i++) {
            _results.push(0);
          }
          return _results;
        };
        morezeroes = (function() {
          var _results;
          _results = [];
          for (i = 0; i <= 6; i++) {
            _results.push(zero());
          }
          return _results;
        })();
        data[country]["utc_hours"] = morezeroes;
      }
      return data[country]["utc_hours"][day][hour] = absolute;
    };
    _.map(rawData, addToData);
    fs.writeFileSync("working_data.json", JSON.stringify(data));
    return load_sorted_by_category(data);
  }).on('error', function(error) {
    return console.log(error.message);
  });
};

load_sorted_by_category = function(data) {
  var c, category, countries, country, projects, sorted_by_category, sub, _base;
  sorted_by_category = {
    absolute: {}
  };
  for (category in data["United States"].job_types) {
    if ((_base = sorted_by_category.absolute)[category] == null) {
      _base[category] = {};
    }
    for (sub in data["United States"].job_types[category]) {
      countries = [];
      for (country in data) {
        if ((data[country].job_types[category] != null) && data[country].job_types[category][sub]) {
          projects = data[country].job_types[category][sub];
          if (projects != null) {
            countries.push({
              country: country,
              projects: projects
            });
          }
        }
      }
      c = countries.sort(function(arr1, arr2) {
        if (arr1.projects <= arr2.projects) {
          return 1;
        } else {
          return -1;
        }
      });
      sorted_by_category.absolute[category][sub] = c;
    }
  }
  fs.writeFileSync("sorted.json", JSON.stringify(sorted_by_category));
  return calculate_global(data);
};

calculate_global = function(data) {
  var all_hours, country, global, hour, sum, tmp;
  global = {};
  all_hours = [];
  for (country in data) {
    hour = data[country];
    all_hours.push(hour.hours);
  }
  sum = _.reduce(_.flatten(all_hours), function(a, b) {
    return a + b;
  });
  tmp = _.reduce(all_hours, function(matrix_a, matrix_b) {
    var week;
    week = _.zip(matrix_a, matrix_b);
    return _.map(week, function(w) {
      var day, day_a, day_b;
      day_a = w[0], day_b = w[1];
      day = _.zip(day_a, day_b);
      return _.map(day, function(d) {
        var a, b;
        a = d[0], b = d[1];
        return a + b;
      });
    });
  });
  global.reduced = _.map(tmp, function(arr) {
    return _.map(arr, function(h) {
      return h / 1;
    });
  });
  console.log(_.reduce(_.flatten(global.reduced), function(a, b) {
    return a + b;
  }), sum);
  return fs.writeFileSync("global.json", JSON.stringify(global));
};
