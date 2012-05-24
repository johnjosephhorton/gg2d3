var Chart, c, check, i, startQ,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Chart = (function() {

  function Chart() {
    this.updateActivity = __bind(this.updateActivity, this);
    this.updateAlert = __bind(this.updateAlert, this);
    this.clickedCountry = __bind(this.clickedCountry, this);
    this.onCountryClick = __bind(this.onCountryClick, this);
    this.createAlert = __bind(this.createAlert, this);
    this.updateActivityData = __bind(this.updateActivityData, this);
  }

  Chart.prototype.parameters = (function() {
    var height, ob, width;
    width = $(document).width();
    height = $(document).height();
    ob = {
      colors: {
        white: "#FFF",
        lightblue: "#168CE5",
        darkblue: "#168CE5",
        rainbow: _.flatten([d3.scale.category20().range(), d3.scale.category20b().range(), d3.scale.category20c().range()])
      }
    };
    ob.map = {
      width: width / 3,
      height: width / 3,
      padding: 10
    };
    ob.map.projection = d3.geo.mercator().scale(ob.map.width * .9).translate([ob.map.width / 2, ob.map.height * .6]);
    ob.map.path = d3.geo.path().projection(ob.map.projection);
    ob.map.fisheye = d3.fisheye().radius(50).power(10);
    ob.activity = {
      width: width / 3,
      height: width / 3,
      padding: 10
    };
    return ob;
  })();

  Chart.prototype.data = {
    activityData: []
  };

  Chart.prototype.selectedCountries = (function() {
    var arr, i, _i, _len, _ref;
    arr = ["United States", "Canada", "Russia", "India"];
    _ref = _.range(60 - 4);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      arr.push(null);
    }
    return arr;
  })();

  Chart.prototype.updateActivityData = function(ob) {
    var c, enumerated, i, instance, _i, _len, _ref;
    ob.data.activityData = [];
    _ref = ob.selectedCountries;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      c = _ref[_i];
      if (!(!_.isNull(c))) continue;
      instance = _.flatten(ob.data.workingData[c].hours);
      enumerated = (function() {
        var _j, _len2, _ref2, _results;
        _ref2 = _.range(instance.length);
        _results = [];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          i = _ref2[_j];
          _results.push({
            x: i,
            y: instance[i]
          });
        }
        return _results;
      })();
      ob.data.activityData.push({
        data: enumerated,
        color: ob.parameters.colors.rainbow[ob.selectedCountries.indexOf(c)],
        name: c
      });
    }
    return ob.data.activityData;
  };

  Chart.prototype.createMap = function(ob) {
    var feature, fishPolygon, i, refish, svg, _i, _len, _ref, _results;
    svg = d3.select("#map").append("svg").attr("width", ob.parameters.map.width).attr("height", ob.parameters.map.height);
    feature = svg.selectAll("path").data(this.data.worldCountries.features).enter().append("path").attr("class", function(d) {
      if (d.properties.name in ob.data.workingData) {
        return "selectable";
      } else {
        return "feature";
      }
    }).attr("fill", "white").attr("d", function(d) {
      return ob.parameters.map.path(d);
    }).each(function(d) {
      return d.org = d.geometry.coordinates;
    }).on('click', ob.onCountryClick);
    feature.append("title").text(function(d) {
      return d.properties.name;
    });
    fishPolygon = function(polygon) {
      return _.map(polygon, function(list) {
        return _.map(list, function(tuple) {
          var c, p;
          p = ob.parameters.map.projection(tuple);
          c = ob.parameters.map.fisheye({
            x: p[0],
            y: p[1]
          });
          return ob.parameters.map.projection.invert([c.x, c.y]);
        });
      });
    };
    refish = function(e) {
      var x, y;
      x = e.offsetX;
      y = e.offsetY;
      if (x == null) x = e.screenX - $("#map svg").offset().left;
      if (y == null) y = e.screenY - $("#map svg").offset().top;
      ob.parameters.map.fisheye.center([x, y]);
      return svg.selectAll("path").attr("d", function(d) {
        var clone, processed, type;
        clone = $.extend({}, d);
        type = clone.geometry.type;
        processed = type === "Polygon" ? fishPolygon(d.org) : _.map(d.org, fishPolygon);
        clone.geometry.coordinates = processed;
        return ob.parameters.map.path(clone);
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

  Chart.prototype.createActivity = function(ob) {
    var ticks, xAxis, yAxis;
    ob.updateActivityData(ob);
    ob.activity = new Rickshaw.Graph({
      renderer: "line",
      element: document.querySelector("#activity"),
      height: ob.parameters.activity.width / 3,
      width: ob.parameters.activity.width - ob.parameters.map.width,
      series: ob.data.activityData
    });
    ob.legend = new Rickshaw.Graph.Legend({
      graph: ob.activity,
      element: document.getElementById("legend")
    });
    ob.activity.render();
    ticks = "glow";
    xAxis = new Rickshaw.Graph.Axis.Time({
      graph: ob.activity,
      ticksTreatment: ticks
    });
    xAxis.render();
    yAxis = new Rickshaw.Graph.Axis.Y({
      graph: ob.activity,
      tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
      ticksTreatment: ticks
    });
    return yAxis.render();
  };

  Chart.prototype.createAlert = function(ob) {
    var week, weekOffset;
    week = $("#activity");
    weekOffset = week.offset();
    return $("#alert").offset({
      left: weekOffset.left,
      top: weekOffset.top - 20
    }).width(week.width());
  };

  Chart.prototype.onCountryClick = function(d, i) {
    var clicked;
    clicked = d.properties.name;
    if (!(clicked in this.data.workingData)) return;
    return this.clickedCountry(clicked, this);
  };

  Chart.prototype.clickedCountry = function(name, ob) {
    var i;
    i = ob.selectedCountries.indexOf(name);
    if (i === -1) {
      ob.selectedCountries[ob.selectedCountries.indexOf(null)] = name;
    } else {
      ob.selectedCountries[i] = null;
    }
    this.updateMap(ob);
    this.updateActivity(ob);
    return this.updateAlert(ob);
  };

  Chart.prototype.updateAlert = function(ob) {};

  Chart.prototype.updateActivity = function(ob) {
    var d, i, m, n, _i, _len, _ref;
    d = ob.updateActivityData(ob);
    m = ob.activity.series.length;
    n = d.length;
    _ref = _.range(d3.max([m, n]));
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      console.log(i, m, n);
      if (i < n) {
        ob.activity.series[i] = d[i];
      } else {
        delete ob.activity.series[i];
      }
    }
    ob.activity.update();
    return ob.legend.update();
  };

  Chart.prototype.updateMap = function(ob) {
    return d3.selectAll("#map svg path").transition().delay(10).attr("fill", function(d) {
      var i;
      i = ob.selectedCountries.indexOf(d.properties.name);
      if (i !== -1) {
        return ob.parameters.colors.rainbow[i];
      } else {
        return "white";
      }
    });
  };

  Chart.prototype.begin = function(c) {
    this.createMap(c);
    this.createActivity(c);
    this.updateMap(c);
    return this.updateActivity(c);
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
  var d;
  d = new Chart();
  $("#map").empty();
  $("#clock").empty();
  $("#week").empty();
  $("#stats").empty();
  return d.begin(d);
});

check = function() {
  var key, ob, _ref, _results;
  _ref = c.data.workingData;
  _results = [];
  for (key in _ref) {
    ob = _ref[key];
    if (!(ob.zones != null)) _results.push(key);
  }
  return _results;
};
