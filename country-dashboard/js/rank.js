var createPills, createRankChart, main, sub, updateField, updatePills, updateRankChart, updateTop;

main = "Administrative Support";

sub = "Data Entry";

createRankChart = function() {
  return createPills();
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

updateRankChart = function(m, s) {
  console.log(m, s);
  if (m && m !== main) {
    main = m;
    sub = _.keys(data.sorted[main]).sort()[0];
    route.navigate("/rank/" + (encodeURI(main)) + "/" + (encodeURI(sub)));
  }
  if (s) sub = s;
  updatePills();
  updateTop();
  return updateField();
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

updateTop = function() {
  var country, field, i, medals, pair, projects, table, th, tr, _len, _ref;
  field = $("#winners > #table").empty();
  table = $("<table>").addClass("table table-condensed");
  th = $("<thead>");
  tr = $("<tr>");
  country = $("<th>").append("Country");
  projects = $("<th>").append("Projects Completed").css("text-align", "right");
  tr.append(country, projects);
  th.append(tr);
  table.append(th);
  medals = ["#C98910", "#A8A8A8", "#965A38"];
  _ref = data.sorted[main][sub].slice(0, 3);
  for (i = 0, _len = _ref.length; i < _len; i++) {
    pair = _ref[i];
    tr = $("<tr>");
    country = $("<td>").append(pair.country);
    projects = $("<td>").append(pair.projects).css({
      "text-align": "right",
      "color": medals[i]
    });
    tr.append(country, projects);
    table.append(tr);
  }
  return field.append(table);
};

updateField = function() {
  var country, field, i, pair, projects, rank, table, th, tr, _len, _ref;
  field = $("#field > #table").empty();
  table = $("<table>").addClass("table table-condensed table-striped");
  th = $("<thead>");
  tr = $("<tr>");
  rank = $("<th>").append("Rank");
  country = $("<th>").append("Country");
  projects = $("<th>").append("Projects Completed");
  tr.append(rank, country, projects);
  th.append(tr);
  table.append(th);
  _ref = data.sorted[main][sub].slice(3);
  for (i = 0, _len = _ref.length; i < _len; i++) {
    pair = _ref[i];
    tr = $("<tr>");
    rank = $("<td>").append(i + 4);
    country = $("<td>").append(pair.country);
    projects = $("<td>").append(pair.projects).css("text-align", "right");
    tr.append(rank, country, projects);
    table.append(tr);
  }
  return field.append(table);
};
