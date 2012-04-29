var Chart, c, i, startQ,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Chart = (function() {

  function Chart() {
    this.updateClock = __bind(this.updateClock, this);
    this.updateChart = __bind(this.updateChart, this);
    this.changeCountry = __bind(this.changeCountry, this);
    this.onCountryClick = __bind(this.onCountryClick, this);
    this.createStats = __bind(this.createStats, this);
  }

  Chart.parameters = (function() {
    var ob;
    ob = {
      map: {
        width: $(document).width() / 3,
        height: $(document).width() / 3,
        padding: 20
      }
    };
    ob.chart = {
      width: $(document).width() - ob.map.width - 50,
      height: $(document).height() / 3,
      padding: 20
    };
    ob.clock = {
      width: $(document).height() / 2,
      height: $(document).height() / 2,
      r: $(document).height() / 4 - 5,
      padding: 20,
      arcWidth: 30
    };
    ob.title = {
      width: $(document).width() - ob.clock.width,
      height: $(document).height() - ob.chart.height,
      padding: 20
    };
    return ob;
  })();

  Chart.prototype.data = {};

  Chart.prototype.selectedCountry = "United States";

  Chart.prototype.map = (function(main) {
    var ob;
    ob = {
      projection: d3.geo.mercator().scale(main.parameters.map.width).translate([main.parameters.map.width / 2, main.parameters.map.height * 2 / 3])
    };
    ob.path = d3.geo.path().projection(ob.projection);
    ob.fisheye = d3.fisheye().radius(50).power(10);
    return ob;
  })(Chart);

  Chart.prototype.createMap = function(ob) {
    var feature, fishPolygon, i, refish, svg, _i, _len, _ref, _results;
    svg = d3.select("#map").append("svg").attr("width", Chart.parameters.map.width).attr("height", Chart.parameters.map.height);
    feature = svg.selectAll("path").data(this.data.worldCountries.features).enter().append("path").attr("class", function(d) {
      if (d.properties.name in ob.data.workingData) {
        if (d.properties.name === ob.selectedCountry) {
          return 'selected';
        } else {
          return 'unselected';
        }
      } else {
        return "feature";
      }
    }).attr("d", function(d) {
      return ob.map.path(d);
    }).each(function(d) {
      return d.org = d.geometry.coordinates;
    }).on('mouseover', ob.onCountryClick);
    feature.append("title").text(function(d) {
      return d.properties.name;
    });
    fishPolygon = function(polygon) {
      return _.map(polygon, function(list) {
        return _.map(list, function(tuple) {
          var c, p;
          p = ob.map.projection(tuple);
          c = ob.map.fisheye({
            x: p[0],
            y: p[1]
          });
          return ob.map.projection.invert([c.x, c.y]);
        });
      });
    };
    refish = function(e) {
      ob.map.fisheye.center([e.offsetX, e.offsetY]);
      return svg.selectAll("path").attr("d", function(d) {
        var clone, processed, type;
        clone = $.extend({}, d);
        type = clone.geometry.type;
        processed = type === "Polygon" ? fishPolygon(d.org) : _.map(d.org, fishPolygon);
        clone.geometry.coordinates = processed;
        return ob.map.path(clone);
      });
    };
    _ref = ["mousemove", "mousein", "mouseout", "touch", "touchmove"];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      _results.push($("#map").on(i, refish));
    }
    return _results;
  };

  Chart.prototype.createChart = function(ob) {
    var weekChart;
    weekChart = d3.select("#week").append("svg").attr("width", Chart.parameters.chart.width).attr("height", Chart.parameters.chart.height).append('g').attr("id", "weekChart");
    _.map(_.range(7), function(n) {
      var str;
      str = "abcdefghi";
      weekChart.append("path").attr("class", "area" + str[n] + "l");
      return weekChart.append("path").attr("class", "area" + str[n] + "r");
    });
    weekChart.append("path").attr("class", "thickline");
    return weekChart.selectAll("g.day").data(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]).enter().append("text").attr("x", function(d, i) {
      return Chart.parameters.chart.width / 7 * (i + 0.5);
    }).attr("dy", Chart.parameters.chart.height - 3).attr("text-anchor", "middle").text(function(d) {
      return d;
    });
  };

  Chart.prototype.createClock = function(ob) {
    var arcWidth, clock, h, outerArc, outerCircle, r, w;
    w = Chart.parameters.clock.width;
    h = Chart.parameters.clock.height;
    r = Chart.parameters.clock.r;
    arcWidth = Chart.parameters.clock.arcWidth;
    clock = d3.select("#clock").append("svg").attr("width", w).attr("height", h).append('g').attr("id", "clockG").attr("transform", "translate(" + (h / 2) + "," + (w / 2) + ")");
    clock.selectAll("g.rule").data(d3.range(3)).enter().append("g").attr("class", "rule").append("line").attr("x1", 0).attr("y1", 0).attr("x2", function(d) {
      return Math.cos(2 * Math.PI * d / 3 - Math.PI) * r;
    }).attr("y2", function(d) {
      return Math.sin(2 * Math.PI * d / 3) * r;
    });
    outerCircle = clock.append("g").data([_.range(361)]).append("path").attr("class", "outerCircle").attr("d", d3.svg.area.radial().innerRadius(r - arcWidth).outerRadius(r).angle(function(d, i) {
      return i / 180 * Math.PI;
    }));
    return outerArc = clock.append("g").append("path").attr("class", "outerArc").attr("id", "outerArc").attr("d", d3.svg.arc().startAngle(0).endAngle(0).innerRadius(r - arcWidth).outerRadius(r));
  };

  Chart.prototype.createStats = function() {
    var stats;
    stats = d3.select("#stats").append("svg").attr("width", Chart.parameters.title.width).attr("height", Chart.parameters.title.height).append('g').attr("id", "statsG");
    return stats.append("text").attr("x", 100).attr("y", 100).attr("id", "country");
  };

  Chart.prototype.onCountryClick = function(d, i) {
    var clicked;
    clicked = d.properties.name;
    if (!(clicked in this.data.workingData)) return;
    return this.changeCountry(clicked, this);
  };

  Chart.prototype.changeCountry = function(name, ob) {
    this.selectedCountry = name;
    this.updateMap(ob);
    this.updateChart();
    this.updateClock(ob);
    return this.updateStats();
  };

  Chart.prototype.updateChart = function() {
    var chartLine, extended, flat, i, instance, weekChart, x, y;
    instance = this.data.workingData[this.selectedCountry].hours;
    flat = _.flatten(instance);
    x = d3.scale.linear().domain([0, flat.length]).range([0, Chart.parameters.chart.width]);
    y = d3.scale.linear().domain([0, _.max(flat)]).range([Chart.parameters.chart.height - 15, 10]);
    weekChart = d3.select("#weekChart");
    extended = (function() {
      var _ref, _results;
      _results = [];
      for (i = 1, _ref = flat.length; i <= _ref; i += 24) {
        _results.push(flat.slice(i, (i + 24) + 1 || 9e9));
      }
      return _results;
    })();
    _.map(_.range(7), function(n) {
      var str;
      str = "abcdefghi";
      weekChart.selectAll("path.area" + str[n] + "l").data([instance[n]]).transition().delay(10).attr("fill", n % 2 === 0 ? "steelblue" : "lightsteelblue").attr("d", d3.svg.area().x(function(d, i) {
        return x(i + 24 * n);
      }).y0(y(0)).y1(function(d, i) {
        return y(d);
      }).interpolate("cardinal"));
      return weekChart.selectAll("path.area" + str[n] + "r").data([extended[n]]).transition().delay(10).attr("fill", n % 2 === 0 ? "steelblue" : "lightsteelblue").attr("d", d3.svg.area().x(function(d, i) {
        return x(i + 1 + 24 * n);
      }).y0(y(0)).y1(function(d, i) {
        return y(d);
      }).interpolate("cardinal"));
    });
    return chartLine = weekChart.selectAll("path.thickline").data([flat]).transition().delay(10).attr("d", d3.svg.line().x(function(d, i) {
      return x(i);
    }).y(function(d, i) {
      return y(d);
    }).interpolate("cardinal"));
  };

  Chart.prototype.updateClock = function(ob) {
    var angle, average, clock, instance, mainClock, max, row, smallR, sum, summed, total, transposed, zone;
    instance = this.data.workingData[this.selectedCountry]["hours"];
    transposed = _.zip.apply(this, instance);
    sum = function(row) {
      return _.reduce(row, function(a, b) {
        return a + b;
      });
    };
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
    clock = d3.select("#clockG");
    clock.select("g.time").remove();
    mainClock = clock.selectAll("g.time").data([summed]).enter().append("g").attr("class", "time");
    smallR = Chart.parameters.clock.r - Chart.parameters.clock.arcWidth - 1;
    angle = function(d, i) {
      return i / 12 * Math.PI;
    };
    mainClock.append("path").attr("class", "area").attr("d", d3.svg.area.radial().innerRadius(0).outerRadius(function(d) {
      return smallR * d / max;
    }).interpolate("cardinal").angle(angle));
    mainClock.append("path").attr("class", "line").attr("d", d3.svg.line.radial().radius(function(d) {
      return smallR * d / max;
    }).interpolate("cardinal").angle(angle));
    zone = this.data.workingData[this.selectedCountry]["zones"];
    average = sum(zone) / zone.length + 7.5 + 9;
    angle = Math.PI * 2 * (average / 24);
    return d3.select("#outerArc").attr("d", d3.svg.arc().startAngle(angle).endAngle(2 * Math.PI / 3 + angle).innerRadius(Chart.parameters.clock.r - Chart.parameters.clock.arcWidth).outerRadius(Chart.parameters.clock.r)).transition().delay(100);
  };

  Chart.prototype.updateStats = function() {
    return d3.select("#statsG text#country").text(this.selectedCountry);
  };

  Chart.prototype.updateMap = function(ob) {
    return d3.selectAll("#map svg path").each(function(d, i) {
      var classStr;
      classStr = d.properties.name in ob.data.workingData ? d.properties.name === ob.selectedCountry ? "selected" : 'unselected' : "feature";
      return d3.select(this).attr("class", classStr);
    });
  };

  Chart.prototype.begin = function(c) {
    this.createMap(c);
    this.createChart(c);
    this.createClock(c);
    this.createStats(c);
    this.updateChart(c);
    this.updateClock(c);
    return this.updateStats(c);
  };

  return Chart;

})();

c = new Chart();

i = 0;

startQ = function() {
  i++;
  if (i === 2) return c.begin(c);
};

d3.json("data/working-data.json", function(data) {
  c.data.workingData = data;
  return startQ();
});

d3.json("data/world-countries.json", function(data) {
  c.data.worldCountries = data;
  return startQ();
});

$(window).resize(function() {
  c = new Chart();
  $("#map").empty();
  $("#clock").empty();
  $("#week").empty();
  $("#stats").empty();
  return c.begin(c);
});
