#Width
w = 482
#Height
h = 482
#Padding
p=40
#Data object
data = new Object
#Inital starting country
country ="Canada"

#Clock object
clock = null

#Useful summation function
sum = (numbers) -> _.reduce(numbers, (a,b)-> a+b)

vis = d3.select("#chart")
  .append("svg")
    .attr("width", w)
    .attr("height", h)
  .append('g')
    .attr("transform","translate(#{w/2},#{h/2})")

drawChart = ()->

  instance = data[country]
  transposed = _.zip.apply(this,instance)

  summed = (sum(row) for row in transposed)
  total=sum(summed)

  percents = (number/total for number in summed)
  radialPercents = (for i in _.range(24)
   [
      percents[i]*Math.cos(2*Math.PI*i/24-Math.PI/2),
      percents[i]*Math.sin(2*Math.PI*i/24-Math.PI/2)
   ])

  line = d3.svg.line()
  max = _.max(percents)
  #"Average" total?
  $("#total").text("Average total number of workers is #{total}")
  x=d3.scale.linear()
    .domain([0,max])
    .range([0, w/2])

  #Setting up the scaling function for y
  y=d3.scale.linear()
    .domain([0,max])
    .range([0,h/2])

  #TODO Clean this up.
  if clock then vis.select("g.time").remove()

  clock = vis.selectAll("g.time")
   .data([radialPercents]).enter()
     .append("g").attr("class","time")


  clock.append("path")
      .attr("class", "line")
      .attr("d",d3.svg.line()
        .interpolate("cardinal-closed")
        .x((d)->x(d[0]))
        .y((d)->y(d[1])))

  rim = max*0.9

  ref = vis.selectAll("g.ref")
    .data([[0,0],[0,-rim,"0"],[rim,0,"6"],[0,rim,"12"],[-rim,0,"18"]]).enter()
    .append("g").attr("class","ref")

  ref.append("circle")
    .attr("cx",(d)-> x(d[0]))
    .attr("cy",(d)-> y(d[1]))
    .attr("r",10)

  ref.append("text")
    .attr("x",(d)-> x(d[0]))
    .attr("y",(d)-> y(d[1]))
    .attr("dy",".5em")
    .attr("text-anchor","middle")
    .text((d)-> d[2])







setUpCountries = ()->
  d3.select("#country")
    .on("change", () ->
      country = this.value
      drawChart())
  .selectAll("option")
    .data(_.keys(data))
  .enter().append("option")
    .attr("value", String)
    .text(String);

#Grab the data and graph it
d3.csv "all_working_hours.csv",(rawdata)->
  addToData = (item)->
    country = item["Country"]
    workers = parseFloat(item["Workers"])
    day = item["Day"]
    hour = item["Hour"]

    if data[country]
      if data[country][day]
        data[country][day][hour]=workers
      else
        data[country][day]=[workers]
    else
      data[country]=[[workers]]

  (addToData(item) for item in rawdata)
  setUpCountries()

  drawChart()
