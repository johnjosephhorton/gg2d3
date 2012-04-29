var Chart, c, i, startQ;

Chart = (function() {

  function Chart() {}

  Chart.parameters = {
    map: {
      width: $(document).width() / 3,
      height: $(document).height(),
      padding: 20
    },
    chart: {
      width: $(document).width() - $(document).width() / 3 - 50,
      height: $(document).height() / 3,
      padding: 20
    },
    clock: {
      width: $(document).height() / 2,
      height: $(document).height() / 2,
      r: $(document).height() / 4 - 5,
      padding: 20,
      arcWidth: 30
    }
  };

  Chart.prototype.data = {};

  Chart.prototype.selectedCountry = "United States";

  Chart.prototype.map = (function(main) {
    var ob;
    ob = {
      projection: d3.geo.azimuthal().scale(main.parameters.map.width / 2).origin([-71.03, 42.37]).translate([main.parameters.map.width / 2, main.parameters.map.height / 2]).mode("orthographic")
    };
    ob.circle = d3.geo.greatCircle();
    ob.circle.origin(ob.projection.origin);
    ob.path = d3.geo.path().projection(ob.projection);
    ob.clip = function(d) {
      console.log(this, main);
      return this.path(d);
    };
    ob.m0 = null;
    ob.o0 = null;
    return ob;
  })(Chart);

  Chart.prototype.createMap = function(ob) {
    var feature, mousedown, mousemove, mouseup, refresh, svg;
    mousedown = function() {
      ob.map.m0 = [d3.event.pageX, d3.event.pageY];
      ob.map.o0 = ob.map.projection.origin();
      return d3.event.preventDefault();
    };
    svg = d3.select("#map").append("svg").attr("width", Chart.parameters.map.width).attr("height", Chart.parameters.map.height).on("mousedown", mousedown);
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
      return ob.map.clip(d);
    });
    feature.append("title").text(function(d) {
      return d.properties.name;
    });
    mousemove = function() {
      var m1, o1;
      if (ob.map.m0) {
        m1 = [d3.event.pageX, d3.event.pageY];
        o1 = [ob.map.o0[0] + (ob.map.m0[0] - m1[0]) / 8, ob.map.o0[1] + (m1[1] - ob.map.m0[1]) / 8];
        ob.map.projection.origin(o1);
        ob.map.circle.origin(o1);
        return refresh();
      }
    };
    mouseup = function() {
      if (c.map.m0) {
        mousemove();
        return c.map.m0 = null;
      }
    };
    refresh = function(duration) {
      if (duration) {
        return feature.transition().duration(duration);
      } else {
        return feature.attr("d", function(d) {
          return ob.map.clip(d);
        });
      }
    };
    d3.select(window).on("mousemove", mousemove).on("mouseup", mouseup);
    return d3.select("select").on("change", function() {
      projection.mode(this.value).scale(scale[this.value]);
      return refresh(750);
    });
  };

  Chart.prototype.createChart = function(ob) {
    var weekChart;
    return weekChart = d3.select("#week").append("svg").attr("width", Chart.parameters.chart.width).attr("height", Chart.parameters.chart.height).append('g').attr("id", "weekChart");
  };

  Chart.prototype.updateChart = function(ob) {
    var chartLine, extended, flat, i, instance, weekChart, x, y;
    instance = ob.data.workingData[ob.selectedCountry].hours;
    flat = _.flatten(instance);
    x = d3.scale.linear().domain([0, flat.length]).range([0, Chart.parameters.chart.width]);
    y = d3.scale.linear().domain([0, _.max(flat)]).range([Chart.parameters.chart.height - 15, 10]);
    weekChart = d3.select("#weekChart");
    weekChart.select("path.line").remove();
    weekChart.select("path").remove();
    extended = (function() {
      var _ref, _results;
      _results = [];
      for (i = 1, _ref = flat.length; i <= _ref; i += 24) {
        _results.push(flat.slice(i, (i + 24) + 1 || 9e9));
      }
      return _results;
    })();
    console.log(extended);
    _.map(_.range(7), function(n) {
      return weekChart.selectAll("path.area").append("g").data([instance[n]]).enter().append("path").attr("fill", (n % 2 === 0 ? "steelblue" : "lightsteelblue")).attr("d", d3.svg.area().x(function(d, i) {
        return x(i + 24 * n);
      }).y0(y(0)).y1(function(d, i) {
        return y(d);
      }).interpolate("cardinal"));
    });
    _.map(_.range(7), function(n) {
      return weekChart.selectAll("path.area").append("g").data([extended[n]]).enter().append("path").attr("fill", (n % 2 === 0 ? "steelblue" : "lightsteelblue")).attr("d", d3.svg.area().x(function(d, i) {
        return x(i + 1 + 24 * n);
      }).y0(y(0)).y1(function(d, i) {
        return y(d);
      }).interpolate("cardinal"));
    });
    chartLine = weekChart.selectAll("g.thickline").data([flat]).enter().append("path").attr("class", "thickline").attr("d", d3.svg.line().x(function(d, i) {
      return x(i);
    }).y(function(d, i) {
      return y(d);
    }).interpolate("cardinal"));
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

  Chart.prototype.updateClock = function(ob) {
    var angle, arcWidth, average, clock, instance, mainClock, max, r, row, smallR, sum, summed, total, transposed, zone;
    r = Chart.parameters.clock.r;
    arcWidth = Chart.parameters.clock.arcWidth;
    instance = ob.data.workingData[ob.selectedCountry]["hours"];
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
    zone = ob.data.workingData[ob.selectedCountry]["zones"];
    average = sum(zone) / zone.length + 7.5 + 9;
    angle = Math.PI * 2 * (average / 24);
    return d3.select("#outerArc").attr("d", d3.svg.arc().startAngle(angle).endAngle(2 * Math.PI / 3 + angle).innerRadius(r - arcWidth).outerRadius(r));
  };

  Chart.prototype.begin = function(c) {
    this.createMap(c);
    this.createChart(c);
    this.createClock(c);
    this.updateChart(c);
    return this.updateClock(c);
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
  console.log("yo");
  $("#map").empty();
  $("#clock").empty();
  $("#week").empty();
  $("#stats").empty();
  return c.begin(c);
});
