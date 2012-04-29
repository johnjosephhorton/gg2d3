###########
#
#
# Notes and TODOS
#
#
###########

#TODO:Make time be relative to timezones. Orientation of the clocks matter visually.
#NB: Signapore isn't in the map persay. It's too small!
#Figure out timezone race condition
###########
#
#
# Parameters
#
#
###########

#Width
width = 300
#Height
height = 300
#Padding
p=40

#Max radius for clocks
r= width/2-5

arcWidth = 20
###########
#
#
# Variables
#
#
###########

#Inital starting country
selectedCountry ="United States"

timezones = null
###########
#
#
# d3 objects
#
#
###########

# Mercator projection
projection = d3.geo.mercator()
  .scale(height)
  .translate([height/2,height*2/3])

#Function used for mapping countries to the mercator projection
path = d3.geo.path().projection(projection);

#Fisheye
fisheye = d3.fisheye()
    .radius(50)
    .power(10)

#Set up svg for the map of countries
map = d3.select("#map")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append('g')

#Set up html for the clock
weekChart = d3.select("#week")
  .append("svg")
    .attr("width", width*2)
    .attr("height", height/2)
  .append('g')

#Set up html for the clock
clock = d3.select("#clock")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append('g')
    .attr("transform","translate(#{width/2},#{height/2})")

clock.selectAll("g.rule")
  .data(d3.range(3)).enter()
  .append("g")
  .attr("class","rule")
  .append("line")
  .attr("x1",0)
  .attr("y1",0)
  .attr("x2",(d)-> Math.cos(2*Math.PI*d/3-Math.PI)*r)
  .attr("y2",(d)-> Math.sin(2*Math.PI*d/3)*r)

#Outer clock, used for displaying max time and reference
outerCircle = clock.append("g")
  .data([_.range(361)])
  .append("path").attr("class","outerCircle")
  .attr("d", d3.svg.area.radial()
      .innerRadius(r-arcWidth)
    .outerRadius(r)
    .angle((d,i) -> i/180 * Math.PI))

outerArc = clock.append("g")
  .append("path").attr("class","outerArc")
  .attr("d", d3.svg.arc()
    .startAngle(0)
    .endAngle(0)
    .innerRadius(r-arcWidth)
    .outerRadius(r))

# numbers = clock.append("g")
#   .data(_.range(8))
#   .enter().append("g")
#   .append("text")
#   .attr("class","numbers")
#   .attr("x",(d,i)-> Math.cos(i-Math.PI/2)*r)
#   .attr("y",(d,i)-> Math.sin(i-Math.PI/2)*r)
#   .attr("text-anchor","middle")
#   .text((d)-> d)








###########
#
#
# Data processing related functions
#
#
###########

#Useful summation function
sum = (numbers) -> _.reduce(numbers, (a,b)-> a+b)

#Calculates the fisheye distortion of a polygon
fishPolygon = (polygon)->
  _.map(polygon, (list)->
    _.map(list,(tuple)->
      p = projection(tuple)
      c = fisheye({x : p[0], y : p[1]})
      projection.invert([c.x, c.y])
    )
  )

#Parses the worker data
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

###########
#
#
# Init functions
#
#
###########


#Set up the list of countries
initList = ()->
  list = $("<ul>").attr("id","countries-list")
  _.map(_.keys(workerData),(name)->
   elem = $("<li>").text(name)
   elem.click((event)->
     changeCountry($(event.target).text()))
   list.append(elem))

  $("#countries").append(list)

###########
#
#
# Update functions
#
#
###########

#Change the country. This calls the relevant functions
changeCountry = (name)->
  selectedCountry = name
  updateClock()
  updateMap()
  updateChart()
#  updateList()

updateChart = ()->
  instance = workerData[selectedCountry]
  flat  = _.flatten(instance)

  x = d3.scale.linear().domain([0, flat.length]).range([0, width*2])
  y = d3.scale.linear().domain([0, _.max(flat)]).range([height/2-15, 10])
  weekChart.select("path.line").remove()
  weekChart.select("path").remove()

  extended = ( instance[i].concat(instance[i][23])for i in d3.range(7))

  _.map _.range(7),(n)->
      weekChart.selectAll("path.area")
        .append("g")
        .data([extended[n]]).enter()
        .append("path")
        .attr("fill", (if n%2 is 0 then "steelblue" else "lightsteelblue"))
        .attr("d",d3.svg.area()
          .x((d,i)-> x(i+24*n))
          .y0(y(0))
          .y1((d,i)-> y(d))
          .interpolate("cardinal"))

  chartLine = weekChart.selectAll("g.thickline").transition(100)
    .data([flat]).enter()
    .append("path")
    .attr("class","thickline")
    .attr("d",d3.svg.line()
    .x((d,i)-> x(i))
    .y((d,i)-> y(d))
    .interpolate("cardinal"))


  weekChart.selectAll("g.day")
  #Did I spell Wednesday right
    .data(["Sunday","Monday", "Tuesday",
         "Wednesday", "Thursday", "Friday", "Saturday"])
    .enter().append("text")
    .attr("x",(d,i)->width*2/7*(i))
    .attr("dy",height/2-5)
    .text((d)->d)



updateMap = ()->
  map.selectAll(".feature").each((d,i)->
    name = d.properties.name
    if not _.contains(_.keys(workerData),name) then return
    classStr = "feature "
    classStr += (if name is selectedCountry then "selected" else "unselected")
    d3.select(this).attr("class",classStr)
  )

#Updates the clock to reflect the current country
updateClock = ()->

  instance = workerData[selectedCountry]
  transposed = _.zip.apply(this,instance)

  summed = (sum(row) for row in transposed)
  total=sum(summed)
  summed.push(summed[0])
  max = _.max(summed)

  if clock then clock.select("g.time").remove()

  mainClock = clock.selectAll("g.time")
   .data([summed]).enter()
     .append("g").attr("class","time")

  smallR = r-arcWidth-1

  angle = (d,i) -> i/12 * Math.PI

  mainClock.append("path")
    .attr("class", "area")
    .attr("d", d3.svg.area.radial()
      .innerRadius(0)
      .outerRadius((d)-> smallR * d/max)
      .interpolate("cardinal")
      .angle(angle))

  mainClock.append("path")
    .attr("class", "line")
    .attr("d", d3.svg.line.radial()
      .radius((d)-> smallR * d/max)
      .interpolate("cardinal")
      .angle(angle))

  zone = if timezones then timezones[selectedCountry] else [-7.5]

  #Lots of hand wavy math to get everything to line up the correct way.
  average=sum(zone)/zone.length+7.5+9
  angle = Math.PI*2*(average/24)
  outerArc.attr("d", d3.svg.arc()
    .startAngle(angle)
    .endAngle(2*Math.PI/3+angle)
    .innerRadius(r-arcWidth)
    .outerRadius(r))


#Update css based on whether or not a country should be highlighted
onCountryClick = (d,i)->
  clicked = d.properties.name
  if not _.contains(_.keys(workerData),clicked) then return
  changeCountry(clicked)


###########
#
#
# Fetch the data
#
#
###########

getCountries = () ->
  d3.json "world-countries.json", (collection)->
    @names = (l.properties.name for l in collection.features)

    map.selectAll(".feature").data(collection.features)
    .enter().append("path")
    .attr "class", (d)->
      #Class hackery. I don't like it.'
      contained =  _.contains(_.keys(workerData),d.properties.name)
      classStr = "feature "
      name = d.properties.name
      if name is selectedCountry then return (classStr+"selected")
      if contained then return (classStr+"unselected")
      classStr
    .attr("d",path)
    .each((d)-> d.org = d.geometry.coordinates)
    .on('mouseover', onCountryClick)

    #Set up mouse events
    d3.select("svg").on "mousemove", refish
    d3.select("svg").on "mousein", refish
    d3.select("svg").on "mouseout", refish
    d3.select("svg").on "touch", refish
    d3.select("svg").on "touchmove", refish

getTimezones = () ->
  d3.json "timezones.json", (zones)->
    window.timezones = zones

d3.csv "all_working_hours.csv", (rawdata)->
  @workerData = parseWorkerData(rawdata)
  getTimezones()
  getCountries()
  initList()
  changeCountry(selectedCountry)



#TODO Fix the off cursor bug.
refish = ()->
  fisheye.center(d3.mouse(this))
  map.selectAll(".feature")
  .attr "d",(d)->
    clone = $.extend({},d)
    type = clone.geometry.type
    processed = if type is "Polygon" then fishPolygon(d.org) else _.map(d.org,fishPolygon)
    clone.geometry.coordinates = processed
    path(clone)


check = ()->
  zones = _.keys(timezones)
  l for l in _.keys(workerData) when zones.indexOf(l) is -1
