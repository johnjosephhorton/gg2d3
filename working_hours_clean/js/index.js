var Chart, c, check, i, startQ,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Chart = (function() {

  function Chart() {
    this.updateSmallCat = __bind(this.updateSmallCat, this);
    this.updateLargeCat = __bind(this.updateLargeCat, this);
    this.updateChart = __bind(this.updateChart, this);
    this.updateAlert = __bind(this.updateAlert, this);
    this.changeCountry = __bind(this.changeCountry, this);
    this.onCountryClick = __bind(this.onCountryClick, this);
    this.createAlert = __bind(this.createAlert, this);
    this.createStats = __bind(this.createStats, this);
    this.createSmallCat = __bind(this.createSmallCat, this);
  }

  Chart.prototype.parameters = (function() {
    var ob;
    ob = {
      colors: {
        white: "#FFF",
        lightblue: "#168CE5",
        darkblue: "#168CE5",
        rainbow: d3.scale.category20c().range()
      },
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
    ob.largeCat = {
      width: $(document).height() / 2,
      height: $(document).height() / 2,
      r: $(document).height() / 4 - 20,
      padding: 20,
      arcWidth: 20,
      pie: d3.layout.pie().value(function(d) {
        return d.value;
      })
    };
    ob.largeCat.arc = d3.svg.arc().outerRadius(ob.largeCat.r).innerRadius(ob.largeCat.r * 2 / 3);
    ob.stats = {
      width: $(document).width() / 3,
      height: $(document).height() - ob.chart.height,
      padding: 20
    };
    ob.smallCat = {
      width: $(document).height() / 2,
      height: $(document).height() / 2,
      r: $(document).height() / 4 - 40,
      padding: 20,
      arcWidth: 30
    };
    return ob;
  })();

  Chart.prototype.data = {};

  Chart.prototype.selectedCountry = "United States";

  Chart.prototype.selectedCategory = "Writing & Translation";

  Chart.prototype.map = (function(main) {
    var ob;
    ob = {
      projection: d3.geo.mercator().scale($(document).width() / 3).translate([$(document).width() / 6, $(document).width() / 4])
    };
    ob.path = d3.geo.path().projection(ob.projection);
    ob.fisheye = d3.fisheye().radius(50).power(10);
    return ob;
  })(Chart);

  Chart.prototype.createMap = function(ob) {
    var feature, fishPolygon, i, refish, svg, _i, _len, _ref, _results;
    svg = d3.select("#map").append("svg").attr("width", ob.parameters.map.width).attr("height", ob.parameters.map.height);
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
      var x, y;
      x = e.offsetX;
      y = e.offsetY;
      if (x == null) x = e.screenX - $("#map svg").offset().left;
      if (y == null) y = e.screenY - $("#map svg").offset().top;
      ob.map.fisheye.center([x, y]);
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
    var i, weekChart;
    weekChart = d3.select("#week").append("svg").attr("width", ob.parameters.chart.width).attr("height", ob.parameters.chart.height).append('g').attr("id", "weekChart");
    _.map(_.range(7), function(n) {
      var str;
      str = "abcdefghi";
      weekChart.append("path").attr("class", "area" + str[n] + "l");
      return weekChart.append("path").attr("class", "area" + str[n] + "r");
    });
    for (i = 0; i <= 5; i++) {
      weekChart.append("text").attr("class", "yaxislabels");
    }
    weekChart.append("text").attr("class", "yaxistoplabel").text("# of workers");
    return weekChart.selectAll("g.day").data(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]).enter().append("text").attr("x", function(d, i) {
      return (ob.parameters.chart.width - 35) / 7 * (i + 0.5) + 35;
    }).attr("dy", ob.parameters.chart.height - 3).attr("text-anchor", "middle").text(function(d) {
      return d;
    });
  };

  Chart.prototype.createLargeCat = function(ob) {
    var a, arcs, center, chart, h, labeled_data, legend, padding, r, w;
    w = ob.parameters.largeCat.width;
    h = ob.parameters.largeCat.height;
    r = ob.parameters.largeCat.r;
    padding = ob.parameters.largeCat.padding;
    $("#category_container").width(ob.parameters.chart.width);
    labeled_data = (function() {
      var _i, _len, _ref, _results;
      _ref = [1];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        _results.push({
          "label": "",
          "value": a
        });
      }
      return _results;
    })();
    chart = d3.select("#main_category_container").append("svg").attr("id", "main_category").data([labeled_data]).attr("width", w + padding).attr("height", h + padding).append("g").attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")");
    arcs = chart.append("g").attr("id", "arcHolder").selectAll("g.arc").data(ob.parameters.largeCat.pie).enter().append("g").attr("class", "arc");
    arcs.append("path").attr("d", ob.parameters.largeCat.arc);
    center = chart.append("g").attr("class", "center");
    center.append("text").text("Projects Completed").attr("transform", "translate(0,-7)");
    center.append("text").attr("id", "total").text("Waiting...").attr("transform", "translate(0,7)");
    legend = d3.select("#main_category_container").append("svg").attr("id", "main_legend").attr("width", w + padding).attr("height", h + padding);
    return chart.append("g").attr("class", "hatch").append("path").style("opacity", 0.5).attr("fill", "black");
  };

  Chart.prototype.createSmallCat = function(ob) {
    var chart;
    return chart = d3.select("#sub_category").append("svg").attr("height", ob.parameters.smallCat.height).attr("width", ob.parameters.smallCat.width);
  };

  Chart.prototype.createStats = function(ob) {
    var actual, key, len, obj, stats, t;
    stats = d3.select("#stats").append("svg").attr("width", ob.parameters.stats.width).attr("height", ob.parameters.stats.height).append('g').attr("id", "statsG");
    actual = (function() {
      var _ref, _results;
      _ref = c.data.workingData;
      _results = [];
      for (key in _ref) {
        obj = _ref[key];
        if (!obj.zones) _results.push(key);
      }
      return _results;
    })();
    len = _.max(_.pluck(actual, "length"));
    t = Math.round(ob.parameters.stats.width / len * 2);
    return stats.append("text").attr("y", t).style("font-size", "" + t + "px").attr("id", "country");
  };

  Chart.prototype.createAlert = function(ob) {
    var week, weekOffset;
    week = $("#week");
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
    return this.changeCountry(clicked, this);
  };

  Chart.prototype.changeCountry = function(name, ob) {
    this.selectedCountry = name;
    this.updateMap(ob);
    this.updateChart(ob);
    this.updateLargeCat(ob);
    this.updateSmallCat(ob);
    this.updateStats(ob);
    return this.updateAlert(ob);
  };

  Chart.prototype.updateAlert = function(ob) {
    var hours;
    hours = ob.data.workingData[this.selectedCountry].hours;
    if (_.any(_.flatten(hours), function(n) {
      return n < 10;
    })) {
      $("#alert").show();
      return $("span#country").text(this.selectedCountry);
    } else {
      return $("#alert").hide();
    }
  };

  Chart.prototype.updateChart = function(ob) {
    var chartLine, extended, flat, i, instance, labels, mode, tickers, weekChart, x, y;
    instance = this.data.workingData[this.selectedCountry].hours;
    flat = _.flatten(instance);
    x = d3.scale.linear().domain([0, flat.length]).range([35, ob.parameters.chart.width]);
    y = d3.scale.linear().domain([0, _.max(flat)]).range([ob.parameters.chart.height - 30, 5]);
    weekChart = d3.select("#weekChart");
    tickers = y.ticks(10);
    labels = weekChart.selectAll(".yaxislabels").data(tickers);
    labels.transition().delay(20).attr("x", 30).attr("y", y).attr("text-anchor", "end").text(function(d) {
      return d;
    });
    labels.exit().remove();
    weekChart.select(".yaxistoplabel").transition().delay(20).attr("y", 20);
    extended = (function() {
      var _ref, _results;
      _results = [];
      for (i = 1, _ref = flat.length; i <= _ref; i += 24) {
        _results.push(flat.slice(i, (i + 24) + 1 || 9e9));
      }
      return _results;
    })();
    mode = "basis";
    _.map(_.range(7), function(n) {
      var str;
      str = "abcdefghi";
      weekChart.selectAll("path.area" + str[n] + "l").data([instance[n]]).transition().delay(20).attr("fill", n % 2 === 0 ? "#061F32" : "#168CE5").attr("d", d3.svg.area().x(function(d, i) {
        return x(i + 24 * n);
      }).y0(y(0)).y1(function(d, i) {
        return y(d);
      }).interpolate(mode, 1000));
      return weekChart.selectAll("path.area" + str[n] + "r").data([extended[n]]).transition().delay(20).attr("fill", n % 2 === 0 ? "#061F32" : "#168CE5").attr("d", d3.svg.area().x(function(d, i) {
        return x(i + 1 + 24 * n);
      }).y0(y(0)).y1(function(d, i) {
        return y(d);
      }).interpolate(mode));
    });
    return chartLine = weekChart.selectAll("path.thickline").data([flat]).transition().delay(20).attr("d", d3.svg.line().x(function(d, i) {
      return x(i);
    }).y(function(d, i) {
      return y(d);
    }).interpolate(mode));
  };

  Chart.prototype.updateLargeCat = function(ob) {
    var a, arcs, b, changeCategory, chart, current, data, heightY, i, instance, j, key, l, labeled_data, legends, pie_data, prop, total;
    instance = this.data.workingData[this.selectedCountry]["job_types"];
    data = {};
    for (key in instance) {
      prop = instance[key];
      data[key] = d3.sum((function() {
        var _ref, _results;
        _ref = instance[key];
        _results = [];
        for (i in _ref) {
          j = _ref[i];
          _results.push(j);
        }
        return _results;
      })());
    }
    labeled_data = ((function() {
      var _results;
      _results = [];
      for (a in data) {
        b = data[a];
        _results.push({
          "label": a,
          "value": b
        });
      }
      return _results;
    })()).sort(function(a, b) {
      return a.value < b.value;
    });
    chart = d3.select("#main_category").data([labeled_data]).select("g");
    arcs = chart.select("g#arcHolder").selectAll("g.arc").data(ob.parameters.largeCat.pie);
    arcs.enter().append("g").attr("class", "arc").append("path");
    pie_data = {};
    current = null;
    changeCategory = function() {
      d3.select("g.hatch > path").transition().attrTween("d", function(d, i, a) {
        var interpolater, selected;
        selected = pie_data[ob.selectedCategory];
        interpolater = d3.interpolate(current, selected);
        current = selected;
        return function(t) {
          return ob.parameters.largeCat.arc(interpolater(t));
        };
      });
      return d3.selectAll("#main_legend>g>text").transition().style("font-size", function(d, i) {
        if (d.label === ob.selectedCategory) {
          return "20px";
        } else {
          return "10px";
        }
      });
    };
    arcs.select("path").attr("fill", function(d, i) {
      return ob.parameters.colors.rainbow[i];
    }).attr("d", function(d, i) {
      pie_data[d.data.label] = d;
      if (d.data.label === ob.selectedCategory) current = d;
      return ob.parameters.largeCat.arc(d);
    }).on("mouseover", function(d, i) {
      ob.selectedCategory = d.data.label;
      changeCategory();
      return ob.updateSmallCat();
    });
    arcs.exit().remove();
    total = d3.sum(_.values(data));
    d3.select("text#total").text(total);
    legends = d3.select("#main_legend").selectAll("g").data(labeled_data);
    l = legends.enter().append("g");
    l.append("rect");
    l.append("text");
    heightY = function(d, i) {
      return i * 20 + ob.parameters.largeCat.height / 3;
    };
    legends.select("rect").attr("fill", function(d, i) {
      return ob.parameters.colors.rainbow[i];
    }).attr("y", heightY).attr("height", 10).attr("width", 10);
    legends.select("text").text(function(d, i) {
      return "" + d.label + " - " + d.value;
    }).attr("y", function(d, i) {
      return heightY(d, i) + 10;
    }).attr("x", 14);
    legends.exit().remove();
    chart.select("g.hatch > path").attr("d", ob.parameters.largeCat.arc(pie_data[ob.selectedCategory]));
    return changeCategory();
  };

  Chart.prototype.updateSmallCat = function(ob) {
    var instance, max, p;
    instance = this.data.workingData[this.selectedCountry].job_types[this.selectedCategory];
    max = _.max(_.values(instance));
    return p = ob.parameters.largeCat;
  };

  Chart.prototype.updateStats = function() {
    return d3.select("#statsG text#country").text(this.selectedCountry);
  };

  Chart.prototype.updateMap = function(ob) {
    return d3.selectAll("#map svg path").transition().delay(10).attr("class", function(d) {
      if (d.properties.name in ob.data.workingData) {
        if (d.properties.name === ob.selectedCountry) {
          return "selected";
        } else {
          return 'unselected';
        }
      } else {
        return "feature";
      }
    });
  };

  Chart.prototype.begin = function(c) {
    this.createMap(c);
    this.createChart(c);
    this.createLargeCat(c);
    this.createSmallCat(c);
    this.createStats(c);
    this.createAlert(c);
    this.updateChart(c);
    this.updateLargeCat(c);
    this.updateSmallCat(c);
    this.updateStats(c);
    return this.updateAlert(c);
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
