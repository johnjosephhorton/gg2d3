var countries, displayCountries, height, p, projection, setUpCountries, sum, vis, width;

width = 482;

height = 482;

p = 40;

countries = new Object;

projection = d3.geo.mercator().scale(250).translate([width / 2, height / 2]);

sum = function(numbers) {
  return _.reduce(numbers, function(a, b) {
    return a + b;
  });
};

vis = d3.select("#countries").append("svg").attr("width", w).attr("height", h).append('g').attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")");

displayCountries = function() {
  var clock, i, instance, line, max, number, percents, radialPercents, ref, rim, row, summed, total, transposed, x, y;
  instance = data[country];
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
  x = d3.scale.linear().domain([0, max]).range([0, w / 2]);
  y = d3.scale.linear().domain([0, max]).range([0, h / 2]);
  if (clock) vis.select("g.time").remove();
  clock = vis.selectAll("g.time").data([radialPercents]).enter().append("g").attr("class", "time");
  clock.append("path").attr("class", "line").attr("d", d3.svg.line().interpolate("cardinal-closed").x(function(d) {
    return x(d[0]);
  }).y(function(d) {
    return y(d[1]);
  }));
  rim = max * 0.9;
  ref = vis.selectAll("g.ref").data([[0, 0], [0, -rim, "0"], [rim, 0, "6"], [0, rim, "12"], [-rim, 0, "18"]]).enter().append("g").attr("class", "ref");
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

setUpCountries = function() {
  return d3.select("#country").on("change", function() {
    var country;
    country = this.value;
    return drawChart();
  }).selectAll("option").data(_.keys(data)).enter().append("option").attr("value", String).text(String);
};

d3.csv("all_working_hours.csv", function(rawdata) {
  var addToData, item, _i, _len;
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
  setUpCountries();
  return drawChart();
});
