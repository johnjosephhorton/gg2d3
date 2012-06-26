var width = 960,
    height = 500,
    centered;

var projection = d3.geo.mercator()
    .scale(width)
    .translate([0, 0]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height);


var states = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
  .append("g")
    .attr("id", "states");

d3.json("world-countries.json", function(json) {
  states.selectAll("path")
      .data(json.features)
    .enter().append("path")
      .attr("d", path)
      .each(function(d,i){
                d.org = d.geometry.coordinates;
            });
});

svg
    .on("mousemove", refish)
    .on("mousein", refish)
    .on("mouseout", refish);

var xFisheye = d3.fisheye.scale(d3.scale.identity)
    .domain([-width/2,width/2]).focus(360);
var yFisheye = d3.fisheye.scale(d3.scale.identity)
    .domain([-height/2,height/2]).focus(90);



function fishPolygon(polygon){
    return _.map(polygon, function(list){
              return _.map(list, function(tuple){
                        var p = projection(tuple);
                        var c = [xFisheye(p[0]),yFisheye(p[1])];
                        return projection.invert(c);
                    }); });
}

function refish(d) {
    var m = d3.mouse(this);
    m = [m[0]-width/2,m[1]-height/2];
    xFisheye.focus(m[0]);
    yFisheye.focus(m[1]);


    states.selectAll("path")
        .attr("d", function(d){
                 var clone = _.extend({},d);
                 var type = clone.geometry.type;
                 var processed = null;
                 if (type === "Polygon")
                     processed = fishPolygon(d.org);
                 else
                     processed = _.map(d.org, fishPolygon);                    
                 clone.geometry.coordinates = processed;
                 return path(clone);
    });    
}