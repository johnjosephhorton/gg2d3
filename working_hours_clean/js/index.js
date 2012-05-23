var Chart, c, check, i, startQ,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Chart = (function() {

  function Chart() {
    this.updateChart = __bind(this.updateChart, this);
    this.updateAlert = __bind(this.updateAlert, this);
    this.changeCountry = __bind(this.changeCountry, this);
    this.onCountryClick = __bind(this.onCountryClick, this);
    this.createBubble = __bind(this.createBubble, this);
    this.createAlert = __bind(this.createAlert, this);
    this.createStats = __bind(this.createStats, this);
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
        rainbow: d3.scale.category20c().range()
      }
    };
    ob.bubble = {
      r: Math.min(height, width),
      flatten: function(root) {
        var classes, recurse;
        classes = [];
        recurse = function(name, node) {
          if (node.children) {
            return node.children.forEach(function(child) {
              return recurse(node.name, child);
            });
          } else {
            return classes.push({
              packageName: name,
              className: node.name,
              value: node.size
            });
          }
        };
        recurse(null, root);
        return {
          children: classes,
          className: "Total"
        };
      }
    };
    ob.map = {
      width: width - ob.bubble.r,
      height: height * 2 / 3,
      padding: 10
    };
    ob.map.projection = d3.geo.mercator().scale(ob.map.width * .9).translate([ob.map.width / 2, ob.map.height * .6]);
    ob.map.path = d3.geo.path().projection(ob.map.projection);
    ob.map.fisheye = d3.fisheye().radius(50).power(10);
    ob.chart = {
      width: ob.map.width,
      height: $(document).height() - ob.map.height - ob.map.padding - 20,
      padding: 20
    };
    ob.stats = {
      width: $(document).width() / 4,
      height: $(document).height() / 4,
      padding: 20
    };
    return ob;
  })();

  Chart.prototype.data = {};

  Chart.prototype.selectedCountry = "United States";

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

  Chart.prototype.createBubble = function(ob) {
    return d3.select("#bubble").append("svg").attr("width", ob.parameters.bubble.r).attr("height", ob.parameters.bubble.r).attr("class", "pack").append("g").attr("transform", "translate(2,2)");
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
    this.updateStats(ob);
    this.updateAlert(ob);
    return this.updateBubble(ob);
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

  Chart.prototype.updateStats = function() {
    return d3.select("#statsG text#country").text(this.selectedCountry);
  };

  Chart.prototype.updateBubble = function(ob) {
    var big_name, big_ob, bubble, children, d, f, fill, format, g, grandchildren, node, r, small_name, small_size, sum, sums, vis;
    d = this.data.workingData[this.selectedCountry].job_types;
    f = {
      name: "jobs"
    };
    children = [];
    sums = {};
    for (big_name in d) {
      big_ob = d[big_name];
      grandchildren = [];
      sum = 0;
      for (small_name in big_ob) {
        small_size = big_ob[small_name];
        grandchildren.push({
          "name": small_name,
          "size": small_size
        });
        sum += small_size;
      }
      children.push({
        "name": big_name,
        "children": grandchildren.sort(function(a, b) {
          return a.size < b.size;
        })
      });
      sums[big_name] = sum;
    }
    f.children = children.sort(function(a, b) {
      return sums[a.name] < sums[b.name];
    });
    r = ob.parameters.bubble.r;
    format = d3.format(",d");
    fill = d3.scale.category20();
    bubble = d3.layout.pack().sort(null).size([r, r]).value(function(d) {
      return d.value;
    });
    vis = d3.select("#bubble >svg > g");
    console.log(vis);
    node = vis.selectAll("g.node").data(bubble.nodes(ob.parameters.bubble.flatten(f)));
    g = node.enter().append("g");
    g.append("circle");
    g.append("title");
    g.filter(function(d) {
      return !d.children;
    }).append("text");
    node.attr("class", function(d) {
      if (d.children != null) {
        return "node";
      } else {
        return "leaf node";
      }
    }).attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
    node.select("circle").attr("r", function(d) {
      return d.r;
    }).attr("fill", function(d) {
      if (d.packageName) {
        return fill(d.packageName);
      } else {
        return "none";
      }
    });
    node.select("title").text(function(d) {
      return "" + d.className + ": " + d.value + " projects completed";
    });
    node.attr("class", function(d) {
      if (d.children != null) {
        return "node";
      } else {
        return "leaf node";
      }
    }).attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
    node.filter(function(d) {
      return !d.children;
    }).select("text").attr("text-anchor", "middle").attr("dy", ".3em").text(function(d) {
      return d.className.substring(0, d.r / 3);
    });
    return node.exit().remove();
  };

  Chart.prototype.begin = function(c) {
    this.createMap(c);
    this.createChart(c);
    this.createAlert(c);
    this.createBubble(c);
    this.createStats(c);
    this.updateStats(c);
    this.updateChart(c);
    this.updateAlert(c);
    return this.updateBubble(c);
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
