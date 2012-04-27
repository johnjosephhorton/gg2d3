var arcWidth, changeCountry, check, clock, fishPolygon, fisheye, getCountries, getTimezones, height, initList, map, onCountryClick, outerArc, outerCircle, p, parseWorkerData, path, projection, r, refish, selectedCountry, sum, timezones, updateChart, updateClock, updateMap, weekChart, width;

width = 300;

height = 300;

p = 40;

r = width / 2 - 5;

arcWidth = 20;

selectedCountry = "United States";

timezones = null;

projection = d3.geo.mercator().scale(height).translate([height / 2, height * 2 / 3]);

path = d3.geo.path().projection(projection);

fisheye = d3.fisheye().radius(50).power(10);

map = d3.select("#map").append("svg").attr("width", width).attr("height", height).append('g');

weekChart = d3.select("#week").append("svg").attr("width", width * 2).attr("height", height / 2).append('g');

clock = d3.select("#clock").append("svg").attr("width", width).attr("height", height).append('g').attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

outerCircle = clock.append("g").data([_.range(361)]).append("path").attr("class", "outer").style("fill", "steelblue").attr("d", d3.svg.area.radial().innerRadius(r - arcWidth).outerRadius(r).angle(function(d, i) {
  return i / 180 * Math.PI;
}));

outerArc = clock.append("g").append("path").attr("class", "outer").style("fill", "lightsteelblue").attr("d", d3.svg.arc().startAngle(0).endAngle(0).innerRadius(r - arcWidth).outerRadius(r));

sum = function(numbers) {
  return _.reduce(numbers, function(a, b) {
    return a + b;
  });
};

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

initList = function() {
  var list;
  list = $("<ul>").attr("id", "countries-list");
  _.map(_.keys(workerData), function(name) {
    var elem;
    elem = $("<li>").text(name);
    elem.click(function(event) {
      return changeCountry($(event.target).text());
    });
    return list.append(elem);
  });
  return $("#countries").append(list);
};

changeCountry = function(name) {
  selectedCountry = name;
  updateClock();
  updateMap();
  return updateChart();
};

updateChart = function() {
  var chartArea, chartLine, flat, instance, x, y;
  instance = workerData[selectedCountry];
  flat = _.flatten(instance);
  x = d3.scale.linear().domain([0, flat.length]).range([0, width * 2]);
  y = d3.scale.linear().domain([0, _.max(flat)]).range([height / 2, 10]);
  weekChart.select("path.area").remove();
  weekChart.select("path.line").remove();
  chartArea = weekChart.selectAll("path.area").data([flat]).enter().append("path").attr("class", "area").attr("d", d3.svg.area().x(function(d, i) {
    return x(i);
  }).y0(y(0)).y1(function(d, i) {
    return y(d);
  }).interpolate("cardinal"));
  return chartLine = weekChart.selectAll("g.line").data([flat]).enter().append("path").attr("class", "line").attr("d", d3.svg.line().x(function(d, i) {
    return x(i);
  }).y(function(d, i) {
    return y(d);
  }).interpolate("cardinal"));
};

updateMap = function() {
  return map.selectAll(".feature").each(function(d, i) {
    var classStr, name;
    name = d.properties.name;
    if (!_.contains(_.keys(workerData), name)) return;
    classStr = "feature ";
    classStr += (name === selectedCountry ? "selected" : "unselected");
    return d3.select(this).attr("class", classStr);
  });
};

updateClock = function() {
  var angle, average, instance, mainClock, max, row, smallR, summed, total, transposed, zone;
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
  summed.push(summed[0]);
  max = _.max(summed);
  if (clock) clock.select("g.time").remove();
  mainClock = clock.selectAll("g.time").data([summed]).enter().append("g").attr("class", "time");
  smallR = r - arcWidth - 1;
  angle = function(d, i) {
    return i / 12 * Math.PI;
  };
  mainClock.append("path").attr("class", "area").attr("d", d3.svg.area.radial().innerRadius(0).outerRadius(function(d) {
    return smallR * d / max;
  }).interpolate("cardinal").angle(angle));
  mainClock.append("path").attr("class", "line").attr("d", d3.svg.line.radial().radius(function(d) {
    return smallR * d / max;
  }).interpolate("cardinal").angle(angle));
  zone = timezones ? timezones[selectedCountry] : [-7.5];
  average = sum(zone) / zone.length + 7.5 + 9;
  angle = Math.PI * 2 * (average / 24);
  return outerArc.attr("d", d3.svg.arc().startAngle(angle).endAngle(2 * Math.PI / 3 + angle).innerRadius(r - arcWidth).outerRadius(r));
};

onCountryClick = function(d, i) {
  var clicked;
  clicked = d.properties.name;
  if (!_.contains(_.keys(workerData), clicked)) return;
  return changeCountry(clicked);
};

getCountries = function() {
  return d3.json("world-countries.json", function(collection) {
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
    map.selectAll(".feature").data(collection.features).enter().append("path").attr("class", function(d) {
      var classStr, contained, name;
      contained = _.contains(_.keys(workerData), d.properties.name);
      classStr = "feature ";
      name = d.properties.name;
      if (name === selectedCountry) return classStr + "selected";
      if (contained) return classStr + "unselected";
      return classStr;
    }).attr("d", path).each(function(d) {
      return d.org = d.geometry.coordinates;
    }).on('mouseover', onCountryClick);
    d3.select("svg").on("mousemove", refish);
    d3.select("svg").on("mousein", refish);
    d3.select("svg").on("mouseout", refish);
    d3.select("svg").on("touch", refish);
    return d3.select("svg").on("touchmove", refish);
  });
};

getTimezones = function() {
  return d3.json("timezones.json", function(zones) {
    return window.timezones = zones;
  });
};

d3.csv("all_working_hours.csv", function(rawdata) {
  this.workerData = parseWorkerData(rawdata);
  getTimezones();
  getCountries();
  initList();
  return changeCountry(selectedCountry);
});

refish = function() {
  fisheye.center(d3.mouse(this));
  return map.selectAll(".feature").attr("d", function(d) {
    var clone, processed, type;
    clone = $.extend({}, d);
    type = clone.geometry.type;
    processed = type === "Polygon" ? fishPolygon(d.org) : _.map(d.org, fishPolygon);
    clone.geometry.coordinates = processed;
    return path(clone);
  });
};

check = function() {
  var l, zones, _i, _len, _ref, _results;
  zones = _.keys(timezones);
  _ref = _.keys(workerData);
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    l = _ref[_i];
    if (zones.indexOf(l) === -1) _results.push(l);
  }
  return _results;
};
