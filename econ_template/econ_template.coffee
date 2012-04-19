#Width
w = 482
#Height
h = 482

#Padding
p = 20
seWidth = 2

#Pulling out variables that are used later on
vis = null
x = null
y = null
errors = null
rate = 1
$("#rate-slider").slider(
  value : rate
  min : 0.01
  max : 10
  step: 0.01
  slide : (event,ui)->
    rate = ui.value
    $("#rate-value").text("Rate Value: #{rate}")
    drawLines()
)

domain = _.range(100)


#Setting up the scaling function for x
x=d3.scale.linear()
  .domain([-3,110])
  .range([0, w])

#Flattening the data so that we can take the min and max easily
#Setting up the scaling function for y
y=d3.scale.linear()
  .domain([-0.1,1.1])
  .range([h, 0])

vis = d3.select('body')
  .append('svg')
    .attr("width",w+p*2)
    .attr("height",h+p*2)
  .append('g')
    .attr("transform","translate(#{p},#{p})")

#Draw the horizontal x axis
xRules = vis.selectAll("g.xRule")
  .data([0]).enter().append("g")
  .attr("class", "axis")
  .append("line")
  .attr("x1", x(0))
  .attr("x2", x(0))
  .attr("y1", y(0))
  .attr("y2", y(1))

#Draw the vertical y axis
yRules = vis.selectAll("g.yRule")
   .data([0]).enter().append("g")
   .attr("class", "axis")
   .append("line")
   .attr("x1", x(0))
   .attr("x2", x(_.max(domain)))
   .attr("y1", y(0))
   .attr("y2", y(0))


#Code to add in the various labels. Labels are in that awkward
#idea-area where there aren't enough of them to justify a good
#abstraction to work with them. Par that with the different details
#each label might need in terms of style and this seems like the
#worse-is-better solution.

# This appends latex code as html and MathJax then comes in and
# reformats everything so that it looks nice.

#Y axis label
#This one got tricky. Rotation and latex combined together
vis.append("foreignObject")
  .attr("transform","translate(#{x(-6)},#{y(0.45)}),rotate(-90)")
  .attr("height",100)
  .attr("width",100)
  .append("xhtml:body")
  .html("\\( {\\Large p_m(i)y} \\)")

#Theta y
vis.append("foreignObject")
  .attr("transform","translate(#{x(0.5)},#{y(0.55)}),rotate(0)")
  .attr("height",100)
  .attr("width",100)
  .append("xhtml:body")
  .html("\\( {\\Large \\theta y} \\)")

#X Axis Label
vis.append("foreignObject")
  .attr("transform","translate(#{x(50)},#{y(-0.01)}),rotate(0)")
  .attr("height",100)
  .attr("width",100)
  .append("xhtml:body")
  .html("\\( {\\Large i} \\)")

# 1
vis.append("foreignObject")
  .attr("transform","translate(#{x(-4)},#{y(1)}),rotate(0)")
  .attr("height",100)
  .attr("width",100)
  .append("xhtml:body")
  .html("\\(1\\)")

# 0
vis.append("foreignObject")
  .attr("transform","translate(#{x(-4)},#{y(0)}),rotate(0)")
  .attr("height",100)
  .attr("width",100)
  .append("xhtml:body")
  .html("\\(0\\)")

# U. Note \underline works, but it resets the svg in chrome and moves
# the outputted svg places it shouldn't be within the page. Works fine
# in firefox though.
vis.append("foreignObject")
  .attr("transform","translate(#{x(100)},#{y(0.1)}),rotate(0)")
  .attr("height",100)
  .attr("width",100)
  .append("xhtml:body")
  .html("\\(U\\)")

# C.
vis.append("foreignObject")
  .attr("transform","translate(#{x(80)},#{y(0.9)}),rotate(0)")
  .attr("height",100)
  .attr("width",100)
  .append("xhtml:body")
  .html("\\(C(i)\\)")


#Draw the actual lines
graph = (f) ->
  all = _.map(domain, (x)-> x: x,y: f(x))
  _.filter(all, (pair)-> pair.y < 1)

funcs =
  top : (x) -> (1+2*Math.atan(x/rate)/Math.PI)/2
  bottom: (x) -> (1-2*Math.atan(x/(100*rate))/Math.PI)/2
  constant: (x) -> 0.3
  curve: (x) -> Math.pow(2,(x/100))-0.8

svgLine = d3.svg.line()
    .x((d)-> x(d.x))
    .y((d)-> y(d.y))

vis.append("g")
  .data([graph(funcs.top)])
  .append("path")
  .attr("class","top line")
  .attr("d", svgLine)

vis.append("g")
  .data([graph(funcs.bottom)])
  .append("path")
  .attr("class","bottom line")
  .attr("d", svgLine)

vis.append("g")
  .data([graph(funcs.constant)])
  .append("path")
  .attr("class","constant line")
  .attr("d", svgLine)

vis.append("g")
  .data([graph(funcs.curve)])
  .append("path")
  .attr("class","curve line")
  .attr("d", svgLine)

drawLines = ()->
  vis.selectAll(".top")
    .data([graph(funcs.top)])
    .transition()
      .duration(20)
      .attr("d", svgLine)


  vis.selectAll(".bottom")
    .data([graph(funcs.bottom)])
    .transition()
      .duration(20)
      .attr("d", svgLine)
