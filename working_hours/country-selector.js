var check, clock, countries, fishPolygon, fisheye, height, onCountryClick, p, parseWorkerData, path, projection, resetClock, selectedCountry, sum, width;

width = 482;

height = 482;

p = 40;

selectedCountry = "Germany";

projection = d3.geo.mercator().scale(height * 1).translate([height / 2, height / 2]);

path = d3.geo.path().projection(projection);

fisheye = d3.fisheye().radius(50).power(10);

sum = function(numbers) {
  return _.reduce(numbers, function(a, b) {
    return a + b;
  });
};

countries = d3.select("#countries").append("svg").attr("width", width).attr("height", height).append('g');

clock = d3.select("#clock").append("svg").attr("width", width).attr("height", height).append('g').attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

resetClock = function() {
  var i, instance, line, mainClock, max, number, percents, radialPercents, ref, rim, row, summed, total, transposed, x, y;
  instance = workerData[selectedCountry];
  transposed = _.zip.apply(this, instance);
  summed = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = transposed.length; _i < _len; _i++) {
      row = transposed[_i];
      _results.push(sum(row));
    }
    return _results;
  })();
  total = sum(summed);
  percents = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = summed.length; _i < _len; _i++) {
      number = summed[_i];
      _results.push(number / total);
    }
    return _results;
  })();
  radialPercents = (function() {
    var _i, _len, _ref, _results;
    _ref = _.range(24);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      _results.push([percents[i] * Math.cos(2 * Math.PI * i / 24 - Math.PI / 2), percents[i] * Math.sin(2 * Math.PI * i / 24 - Math.PI / 2)]);
    }
    return _results;
  })();
  line = d3.svg.line();
  max = _.max(percents);
  $("#total").text("Average total number of workers is " + total);
  x = d3.scale.linear().domain([0, max]).range([0, width / 2]);
  y = d3.scale.linear().domain([0, max]).range([0, height / 2]);
  if (clock) clock.select("g.time").remove();
  mainClock = clock.selectAll("g.time").data([radialPercents]).enter().append("g").attr("class", "time");
  mainClock.append("path").attr("class", "line").attr("d", d3.svg.line().interpolate("cardinal-closed").x(function(d) {
    return x(d[0]);
  }).y(function(d) {
    return y(d[1]);
  }));
  rim = max * 0.9;
  ref = clock.selectAll("g.ref").data([[0, 0], [0, -rim, "0"], [rim, 0, "6"], [0, rim, "12"], [-rim, 0, "18"]]).enter().append("g").attr("class", "ref");
  ref.append("circle").attr("cx", function(d) {
    return x(d[0]);
  }).attr("cy", function(d) {
    return y(d[1]);
  }).attr("r", 10);
  return ref.append("text").attr("x", function(d) {
    return x(d[0]);
  }).attr("y", function(d) {
    return y(d[1]);
  }).attr("dy", ".5em").attr("text-anchor", "middle").text(function(d) {
    return d[2];
  });
};

onCountryClick = function(d, i) {
  var clicked, dom;
  clicked = d.properties.name;
  if (!_.contains(_.keys(workerData), clicked)) return;
  selectedCountry = clicked;
  d3.selectAll(".selected").attr("class", "feature unselected");
  dom = d3.select(this).attr("class", "feature selected");
  return resetClock();
};

parseWorkerData = function(rawdata) {
  var addToData, data;
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
  _.map(rawdata, addToData);
  return data;
};

d3.csv("all_working_hours.csv", function(rawdata) {
  this.workerData = parseWorkerData(rawdata);
  return resetClock();
});

fishPolygon = function(polygon) {
  return _.map(polygon, function(list) {
    return _.map(list, function(tuple) {
      var c;
      p = projection(tuple);
      c = fisheye({
        x: p[0],
        y: p[1]
      });
      return projection.invert([c.x, c.y]);
    });
  });
};

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
  countries.selectAll(".feature").data(collection.features).enter().append("path").attr("class", function(d) {
    var classStr, contained, name;
    contained = _.contains(_.keys(workerData), d.properties.name);
    classStr = "feature ";
    name = d.properties.name;
    if (name === selectedCountry) return classStr + "selected";
    if (contained) return classStr + "unselected";
    return classStr;
  }).attr("d", path).each(function(d) {
    return d.org = d.geometry.coordinates;
  }).on('click', onCountryClick);
  return d3.select("svg").on("mousemove", function() {
    fisheye.center(d3.mouse(this));
    return countries.selectAll(".feature").attr("d", function(d) {
      var clone, processed, type;
      clone = $.extend({}, d);
      type = clone.geometry.type;
      processed = type === "Polygon" ? fishPolygon(d.org) : _.map(d.org, fishPolygon);
      clone.geometry.coordinates = processed;
      return path(clone);
    });
  });
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
