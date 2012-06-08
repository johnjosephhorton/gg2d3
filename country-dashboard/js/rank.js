var absolute, country_labels, createAbsolute, createPills, createRankChart, createRelative, g, main, relative, sub, updateAbsolute, updatePills, updateRankChart, updateRelative;

main = "Administrative Support";

sub = "Data Entry";

relative = new Object;

absolute = new Object;

createRankChart = function() {
  createPills();
  createRelative();
  return createAbsolute();
};

createPills = function() {
  var cat, li, main_pills, _i, _len, _ref, _results;
  main_pills = $("#main-pills > ul").first();
  _ref = categories.sort();
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    cat = _ref[_i];
    li = $("<li>").append($("<a>").text(cat)).attr("href", "#");
    if (cat === main) li.addClass("active");
    li.click(function(e, u) {
      var b, t;
      t = e.target.text;
      b = $(this);
      b.siblings().removeClass("active");
      b.addClass('active');
      return route.navigate("/rank/" + (encodeURI(t)), {
        trigger: true
      });
    });
    _results.push(main_pills.append(li));
  }
  return _results;
};

createRelative = function() {
  var g, t;
  t = $("#winners-relative > #table");
  relative.height = 10;
  relative.width = t.width();
  relative.svg = d3.select("#winners-relative > #table").append("svg").attr("height", relative.height).attr("width", relative.width);
  g = relative.svg.append("g");
  g.append("text").text("Rank").attr("dx", 0).attr("dy", 10);
  g.append("text").text("Country").attr("dx", relative.width * .3).attr("dy", 10);
  g.append("text").text("Projects Completed").attr("dx", relative.width).attr("dy", 10).attr("text-anchor", "end");
  return relative.countries = relative.svg.append("g").attr("id", "countries");
};

createAbsolute = function() {
  var g, t;
  t = $("#absolute-table");
  absolute.height = 420;
  absolute.width = t.width();
  absolute.svg = d3.select("#absolute-table").append("svg").attr("height", absolute.height).attr("width", absolute.width);
  g = absolute.svg.append("g");
  g.append("text").text("Rank").attr("dx", 0).attr("dy", 10);
  g.append("text").text("Country").attr("dx", absolute.width * .3).attr("dy", 10);
  g.append("text").text("Projects Completed").attr("dx", absolute.width).attr("dy", 10).attr("text-anchor", "end");
  g.selectAll(".rank").data(_.range(20)).enter().append("text").text(function(d, i) {
    return i + 1;
  }).attr("dx", 0).attr("dy", function(d, i) {
    return i * 20 + 30;
  });
  return absolute.countries = absolute.svg.append("g").attr("id", "countries");
};

updateRankChart = function(m, s) {
  if (m && m !== main) {
    main = m;
    sub = _.keys(data.sorted.absolute[main])[0];
    sub = _.keys(data.sorted.absolute[main]);
    route.navigate("/rank/" + (encodeURI(main)) + "/" + (encodeURI(sub)));
  }
  if (s) sub = s;
  updatePills();
  updateRelative();
  return updateAbsolute();
};

updatePills = function() {
  var cat, li, sub_pills, _i, _len, _ref, _results;
  sub_pills = $("#sub-pills > ul").empty();
  _ref = _.keys(data.sorted[main]).sort();
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    cat = _ref[_i];
    li = $("<li>").append($("<a>").text(cat)).attr("href", "");
    if (sub === cat) li.addClass("active");
    li.click(function(e, u) {
      var t;
      t = e.target.text;
      return route.navigate("/rank/" + (encodeURI(main)) + "/" + (encodeURI(t)), {
        trigger: true
      });
    });
    _results.push(sub_pills.append(li));
  }
  return _results;
};

updateRelative = function() {
  var c, country_labels, end, g, groups, moving, top, unmoving;
  top = data.sorted.relative[main][sub].slice(0, 20);
  c = relative.countries.selectAll("g").data(top, function(d) {
    return d.country;
  });
  groups = c.select("text.country").each(function(d, i) {
    return this.now = i;
  });
  moving = groups.filter(function(d, i) {
    return this.last !== this.now;
  });
  unmoving = groups.filter(function(d, i) {
    return this.last === this.now;
  });
  end = 0;
  if (moving[0].length !== 0) {
    end = 200 + 20 * 50;
    unmoving.transition().duration(200).delay(000).attr("dx", absolute.width * .3 - 50);
    moving.transition().delay(000).duration(200).attr("dx", absolute.width * .3 + 50);
    moving.transition().duration(200).delay(function(d, i) {
      return 200 + i * 50;
    }).attr("dy", function(d, i) {
      return this.now * 20 + 30;
    }).attr("dx", absolute.width * .3);
    moving.each(function(d, i) {
      return this.last = this.now;
    });
    unmoving.transition().delay(end).attr("dx", absolute.width * .3);
  }
  g = c.enter().append("g").attr("class", "row");
  country_labels = g.append("text").attr("class", "country").attr("dx", absolute.width * 0.7).attr("dy", function(d, i) {
    return 1000;
  }).each(function(d, i) {
    return this.last = i;
  }).text(function(d, i) {
    return d.country;
  });
  country_labels.transition().delay(function(d, i) {
    return end + 10 * i + 10;
  }).attr("dy", function(d, i) {
    return i * 20 + 30;
  }).delay(function(d, i) {
    return end + 10 * i;
  }).attr("dx", absolute.width * 0.3);
  g.append("text").attr("class", "projects").attr("dx", absolute.width).attr("dy", function(d, i) {
    return i * 20 + 30;
  }).attr("text-anchor", "end").transition().delay(end).text(function(d, i) {
    return d.projects;
  });
  c.select("text.projects").attr("dy", function(d, i) {
    return i * 20 + 30;
  }).text(function(d, i) {
    return d.projects;
  });
  return c.exit().transition().attr("transform", "translate(0,400)").remove();
};

updateAbsolute = function() {
  var c, end, groups, moving, top, unmoving;
  top = data.sorted.absolute[main][sub].slice(0, 20);
  c = absolute.countries.selectAll("g").data(top, function(d) {
    return d.country;
  });
  groups = c.select("text.country").each(function(d, i) {
    return this.now = i;
  });
  moving = groups.filter(function(d, i) {
    return this.last !== this.now;
  });
  unmoving = groups.filter(function(d, i) {
    return this.last === this.now;
  });
  end = 0;
  if (moving[0].length !== 0) {
    end = 200 + 20 * 50;
    unmoving.transition().duration(200).delay(000).attr("dx", absolute.width * .3 - 50);
    moving.transition().delay(000).duration(200).attr("dx", absolute.width * .3 + 50);
    moving.transition().duration(200).delay(function(d, i) {
      return 200 + i * 50;
    }).attr("dy", function(d, i) {
      return this.now * 20 + 30;
    }).attr("dx", absolute.width * .3);
  }
  moving.each(function(d, i) {
    return this.last = this.now;
  });
  return unmoving.transition().delay(end).attr("dx", absolute.width * .3);
};

g = c.enter().append("g").attr("class", "row");

country_labels = g.append("text").attr("class", "country").attr("dx", absolute.width * 0.7).attr("dy", function(d, i) {
  return 1000;
}).each(function(d, i) {
  return this.last = i;
}).text(function(d, i) {
  return d.country;
});

country_labels.transition().delay(function(d, i) {
  return end + 10 * i + 10;
}).attr("dy", function(d, i) {
  return i * 20 + 30;
}).delay(function(d, i) {
  return end + 10 * i;
}).attr("dx", absolute.width * 0.3);

g.append("text").attr("class", "projects").attr("dx", absolute.width).attr("dy", function(d, i) {
  return i * 20 + 30;
}).attr("text-anchor", "end").transition().delay(end).text(function(d, i) {
  return d.projects;
});

c.select("text.projects").attr("dy", function(d, i) {
  return i * 20 + 30;
}).text(function(d, i) {
  return d.projects;
});

c.exit().transition().attr("transform", "translate(0,400)").remove();
