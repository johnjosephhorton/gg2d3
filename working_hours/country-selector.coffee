#TODO:Find geo data for singpore. Is it under a different name perhaps?
#TODO:Make time be relative to timezones. Orientation of the clocks matter visually.


###########
#
#
# Parameters
#
#
###########

#Width
width = 482
#Height
height = 482
#Padding
p=40

###########
#
#
# Variables
#
#
###########

#Inital starting country
selectedCountry ="Germany"

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
clock = d3.select("#clock")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append('g')
    .attr("transform","translate(#{width/2},#{height/2})")

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
  resetClock()
  resetMap()
  resetList()

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

  r = height/2

  angle = (d,i) -> i/12 * Math.PI

  mainClock.append("path")
    .attr("class", "area")
    .attr("d", d3.svg.area.radial()
      .innerRadius(0)
      .outerRadius((d)-> r * d/max)
      .angle(angle))

  mainClock.append("path")
    .attr("class", "line")
    .attr("d", d3.svg.line.radial()
      .radius((d)-> r * d/max)
      .angle(angle))

#Update css based on whether or not a country should be highlighted
onCountryClick = (d,i)->
  clicked = d.properties.name
  if not _.contains(_.keys(workerData),clicked) then return
  d3.selectAll(".selected").attr("class","feature unselected")
  dom = d3.select(this).attr("class","feature selected")
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
    .on('click', onCountryClick)

    #Set up mouse events
    d3.select("svg").on "mousemove", refish
    d3.select("svg").on "mousein", refish
    d3.select("svg").on "mouseout", refish
    d3.select("svg").on "touch", refish
    d3.select("svg").on "touchmove", refish

d3.csv "all_working_hours.csv", (rawdata)->
  @workerData = parseWorkerData(rawdata)
  getCountries()
  initList()
  updateClock()


refish = ()->
  fisheye.center(d3.mouse(this))
  map.selectAll(".feature")
  .attr "d",(d)->
    clone = $.extend({},d)
    type = clone.geometry.type
    processed = if type is "Polygon" then fishPolygon(d.org) else _.map(d.org,fishPolygon)
    clone.geometry.coordinates = processed
    path(clone)



#TODO: Signapore isn't in the world countries data yet.
#Grab the data out of Mathematica.
check = ()->
  l for l in _.keys(odesk) when names.indexOf(l) is -1
