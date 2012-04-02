#Width
w = 482
#Height
h = 482

#Padding
p = 20


#Grab the data and graph it
d3.csv "by_month_data.csv",(data)->

  #Formating function
  format = (d) ->
    month : parseInt(d['start_month'])
    mean : parseFloat(d['mean_normed'])
    se : parseFloat(d['se'])

  #Mapping over the data and formatting it how we need it
  formatted = (format(d) for d in data)

  #Plucking out the data we need to scale things properly
  months = _.pluck(formatted, 'month')
  means = _.pluck(formatted, 'mean')

  #Magic numbers to get everything to display in a way that pleases
  #the eye
  paddingX = 1
  paddingY = 0.1
  #Setting up the scaling function for x
  x=d3.scale.linear()
    .domain([_.min(months)-paddingX,_.max(months)+paddingX])
    .range([0, w])

  #Setting up the scaling function for y
  y=d3.scale.linear()
    .domain([_.min(means)-paddingY,_.max(means)+paddingY])
    .range([h, 0])

  #Creating the main line and setting up for later graphics
  vis = d3.select('body')
  .data([formatted])
  .append('svg')
    .attr("width",w+p*2)
    .attr("height",h+p*2)
  .append('g')
    .attr("transform","translate(#{p},#{p})")

  #Object for drawing the axis perp to x
  xRules = vis.selectAll("g.xRule")
    .data(x.ticks(10))
  .enter().append("g")
    .attr("class", "rule")

  #Draw the lines prep to x
  xRules.append("line")
    .attr("x1", x)
    .attr("x2", x)
    .attr("y1", 0)
    .attr("y2", h - 1)

  #Draw the tick marks
  xRules.append("text")
    .attr("x", x)
    .attr("y", h + 3)
    .attr("dy", ".71em")
    .attr("text-anchor", "middle")
    .text(x.tickFormat(10));

  #Object for drawing the axis prep to y
  #Repeat of the above method with proper switching of x/y
  yRules = vis.selectAll("g.yRule")
    .data(y.ticks(10))
    .enter().append("g")
    .attr("class", "rule")

  yRules.append("line")
    .attr("class", (d) -> if d then null else "axis")
    .attr("x1", 0)
    .attr("x2", w + 1)
    .attr("y1", y)
    .attr("y2", y)

  yRules.append("text")
    .attr("y", y)
    .attr("x", -3)
    .attr("dy", ".35em")
    .attr("text-anchor", "end")
    .text(y.tickFormat(10));

  #Draw the actual line itself
  vis.append("path")
   .attr("class","line")
   .attr("d", d3.svg.line()
     .x((d)-> x(d.month))
     .y((d)-> y(d.mean)))

  #Object to draw the error labels
  errors = vis.selectAll("g.error")
    .data(formatted)
    .enter().append("g")
    .attr("class","errors")

  #Draw the top part of the error bar
  errors.append("circle")
      .attr("cx",(d)-> x(d.month))
      .attr("cy",(d)-> y(d.mean))
      .attr("r",2)


  #Draw the top part of the error bar
  errors.append("line")
      .attr("x1",(d)-> x(d.month-0.3))
      .attr("x2",(d)-> x(d.month+0.3))
      .attr("y1",(d)-> y(d.mean+2*d.se))
      .attr("y2",(d)-> y(d.mean+2*d.se))

  #Draw the bottom part of the error bar
  errors.append("line")
      .attr("x1",(d)-> x(d.month-0.3))
      .attr("x2",(d)-> x(d.month+0.3))
      .attr("y1",(d)-> y(d.mean-2*d.se))
      .attr("y2",(d)-> y(d.mean-2*d.se))

  #Draw the middle part of the error bar
  errors.append("line")
      .attr("x1",(d)-> x(d.month))
      .attr("x2",(d)-> x(d.month))
      .attr("y1",(d)-> y(d.mean-2*d.se))
      .attr("y2",(d)-> y(d.mean+2*d.se))

  label = (x,y,string)->
      x: x
      y: y
      string: string

  # labels = [l(10,1.1,"Months since first job on oDesk"),
  # l(,,"Months since first job on oDesk"),
  # l(10,1.1,"Months since first job on oDesk")
 # ]
  xRules = vis.selectAll("g.xRule")
      .data()
  .enter().append("g")
    .attr("class", "rule")
