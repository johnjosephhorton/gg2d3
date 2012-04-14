var check, height, p, path, projection, sum, vis, width;

width = 482;

height = 482;

p = 40;

projection = d3.geo.mercator().scale(height).translate([height / 2, height / 2]);

path = d3.geo.path().projection(projection);

sum = function(numbers) {
  return _.reduce(numbers, function(a, b) {
    return a + b;
  });
};

vis = d3.select("#countries").append("svg").attr("width", width).attr("height", height).append('g');

d3.json("world-countries.json", function(collection) {
  var l;
  this.names = (function() {
    var _i, _len, _ref, _results;
    _ref = collection.features;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      l = _ref[_i];
      _results.push(l.properties.name);
    }
    return _results;
  })();
  return vis.selectAll(".feature").data(collection.features).enter().append("path").attr("class", "feature").attr("d", function(d) {
    return path(d);
  }).on('click', function(d, i) {
    var classString, dom;
    console.log(d.properties.name);
    dom = d3.select(this);
    classString = dom.attr("class");
    classString = classString === "feature" ? "selected" : "feature";
    return dom.attr("class", classString);
  });
});

d3.csv("all_working_hours.csv", function(rawdata) {
  var addToData, data, item, _i, _len;
  data = new Object;
  addToData = function(item) {
    var country, day, hour, workers;
    country = item["Country"];
    workers = parseFloat(item["Workers"]);
    day = item["Day"];
    hour = item["Hour"];
    if (data[country]) {
      if (data[country][day]) {
        return data[country][day][hour] = workers;
      } else {
        return data[country][day] = [workers];
      }
    } else {
      return data[country] = [[workers]];
    }
  };
  for (_i = 0, _len = rawdata.length; _i < _len; _i++) {
    item = rawdata[_i];
    addToData(item);
  }
  return this.odesk = data;
});

check = function() {
  var l, _i, _len, _ref, _results;
  _ref = _.keys(odesk);
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    l = _ref[_i];
    if (names.indexOf(l) === -1) _results.push(l);
  }
  return _results;
};
