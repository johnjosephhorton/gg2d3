#TODO:
# Add in fisheye so it is easier to click on certain countries
# Find geo data for singpore. Is it under a different name perhaps?

#Width
width = 482
#Height
height = 482
#Padding
p=40

#Inital starting country
selectedCountry ="Canada"

# Mercator projection
# TODO:
projection = d3.geo.mercator()
    .scale(height*1)
  .translate([height/2,height/2])

#Function used for mapping countries to the mercator projection
path = d3.geo.path().projection(projection);

#Useful summation function
sum = (numbers) -> _.reduce(numbers, (a,b)-> a+b)

#Set up html for the map of countries
countries = d3.select("#countries")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append('g')

#Set up html for the clock
clock = d3.select("#clock")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append('g')
    .attr("transform","translate(#{width/2},#{height/2})")

#
resetClock = ()->
  instance = workerData[selectedCountry]
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
    .range([0, width/2])

  #Setting up the scaling function for y
  y=d3.scale.linear()
    .domain([0,max])
    .range([0,height/2])

  #TODO Clean this up.
  if clock then clock.select("g.time").remove()

  mainClock = clock.selectAll("g.time")
   .data([radialPercents]).enter()
     .append("g").attr("class","time")


  mainClock.append("path")
      .attr("class", "line")
      .attr("d",d3.svg.line()
        .interpolate("cardinal-closed")
        .x((d)->x(d[0]))
        .y((d)->y(d[1])))

  rim = max*0.9

  ref = clock.selectAll("g.ref")
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

#Update css based on whether or not a country should be highlighted
#and trigger the reset of the clock
onCountryClick = (d,i)->
  clicked = d.properties.name
  if not _.contains(_.keys(workerData),clicked) then return
  selectedCountry = clicked
  #Hacky way to add a class to a node element.
  #There should be a better way to do this.
  d3.selectAll(".selected").attr("class","unselected")
  dom = d3.select(this).attr("class","selected")
  # str = dom.attr("class")
  # str = if str is "selected" then "unselected" else "selected"
  # dom.attr("class",str)
  resetClock()


parseWorkerData = (rawdata)->
  data = new Object

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

  _.map(rawdata,addToData)

  return data

#TODO:There is a race condition here.  If the function after this
#recieves it's data first, then there will be errors. Not sure of a
#good way to solve this besides saying wait or sleep.

d3.csv "all_working_hours.csv", (rawdata)->
  @workerData = parseWorkerData(rawdata)
  resetClock()

d3.json "world-countries.json", (collection)->
    @names = (l.properties.name for l in collection.features)
    countries.selectAll(".feature").data(collection.features)
      .enter().append("path")
      .attr("class", (d)->
        contained =  _.contains(_.keys(workerData),d.properties.name)
        if d.properties.name is selectedCountry then return "selected"
        if contained then "unselected" else "feature")
      .attr("d",(d)-> path(d))
      .on('click', onCountryClick)







#TODO: Signapore isn't in the world countries data yet.
#Grab the data out of Mathematica.
check = ()->
  l for l in _.keys(odesk) when names.indexOf(l) is -1
