var f, flatten;

f = null;

flatten = function(root) {
  var classes, recurse;
  classes = [];
  recurse = function(name, node) {
    if (node.children) {
      return node.children.forEach(function(child) {
        return recurse(node.name, child);
      });
    } else {
      return classes.push({
        small: name,
        big: node.name,
        value: node.size
      });
    }
  };
  recurse(null, root);
  return {
    children: classes,
    small: "Total"
  };
};

d3.json("data/working-data.json", function(data) {
  var big_name, big_ob, bubble, children, d, fill, format, grandchildren, node, r, small_name, small_size, sum, sums, vis, _ref;
  d = data["Brazil"];
  f = {
    name: "jobs"
  };
  children = [];
  sums = {};
  _ref = d.job_types;
  for (big_name in _ref) {
    big_ob = _ref[big_name];
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
  children = children.sort(function(a, b) {
    return sums[a.name] < sums[b.name];
  });
  f.children = children;
  r = $(document).height();
  format = d3.format(",d");
  fill = d3.scale.category20();
  bubble = d3.layout.pack().sort(null).size([r, r]).value(function(d) {
    return d.value;
  });
  vis = d3.select("#bubble").append("svg").attr("width", r).attr("height", r).attr("class", "pack").append("g").attr("transform", "translate(2,2)");
  node = vis.selectAll("g.node").data(bubble.nodes(flatten(f))).enter().append("g").attr("class", function(d) {
    if (d.children != null) {
      return "node";
    } else {
      return "leaf node";
    }
  }).attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
  node.append("circle").attr("r", function(d) {
    return d.r;
  }).attr("fill", function(d) {
    if (d.packageName) {
      return fill(d.packageName);
    } else {
      return "white";
    }
  });
  node.append("title").text(function(d) {
    return "" + d.className + " - " + d.value + " projects completed";
  });
  return node.filter(function(d) {
    return !d.children;
  }).append("text").attr("text-anchor", "middle").attr("dy", ".3em").text(function(d) {
    return d.className.substring(0, d.r / 3);
  });
});
