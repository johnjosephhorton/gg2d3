#Width
w = 482
#Height
h = 482

#Padding
p = 0
seWidth = 2

#Pulling out variables that are used later on
vis = null
x = null
y = null
errors = null

$("#se-slider").slider(
  value : seWidth
  min : 0.25
  max : 4
  step: 0.1
  slide : (event,ui)->
    seWidth =ui.value
    $("#se-value").text("SE Width: #{seWidth}")
    redrawErrorBars()
)

domain = _.range(100)

funcs = [
  (x) -> (1+2*Math.atan(x)/Math.PI)/2
  (x) -> (1-Math.pow(Math.atan(x),2)/Math.PI)/2
]


lines = (_.map(domain, (x)-> x: x,y: func(x)) for func in funcs)


#Setting up the scaling function for x
x=d3.scale.linear()
  .domain([-3,100])
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

#Draw the actual lines themselves
vis.selectAll("lines").data(lines).enter()
  .append("path")
  .attr("class","line")
  .attr("d", d3.svg.line()
      .x((d)-> x(d.x))
      .y((d)-> y(d.y)))

#Draw the horizontal x axis
xRules = vis.selectAll("g.xRule")
  .data([0]).enter().append("g")
  .attr("class", "rule")
  .append("line")
  .attr("x1", x(0))
  .attr("x2", 1)
  .attr("y1", 0)
  .attr("y2", h+1)

#Draw the vertical y axis
yRules = vis.selectAll("g.xRule")
  .data([0]).enter().append("g")
  .attr("class", "rule")
  .append("line")
  .attr("x1", 1)
  .attr("x2", w+1)
  .attr("y1", 0)
  .attr("y2", 1)

#Labeling function for passing info around
l = (x,y,text,rotate)->
  x: x
  y: y
  text: text

#Label data
labels =[
  l(0.5,0.5," job on oDesk"),
  l(0.5,0.5,"Average hourly wage earned in that period, as multiple of first period wage"),
  l(0.5,0.5,"# of contractors = 90,000")]



# #Adding in the labels.
# vis.selectAll("g.text")
#   .data(labels)
#   .enter().append("text")
#   .attr("x", (d)-> x(d.x))
#   .attr("y", (d)-> y(d.y))
#   .text((d)-> d.text)
