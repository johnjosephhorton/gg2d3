#Width
width = 482
#Height
height = 482

#Padding
p=40

# Mercator projection
projection = d3.geo.mercator()
  .scale(height)
  .translate([height/2,height/2])

path = d3.geo.path().projection(projection);

#Useful summation function
sum = (numbers) -> _.reduce(numbers, (a,b)-> a+b)

vis = d3.select("#countries")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append('g')

d3.json("world-countries.json", (collection)->
    @names = (l.properties.name for l in collection.features)
    vis.selectAll(".feature").data(collection.features)
      .enter().append("path")
      .attr("class", "feature")
      .attr("d",(d)-> path(d))
      .on('click',(d,i)->
        console.log(d.properties.name)

        #Hacky way to add a class to a node element
        dom = d3.select(this)
        classString = dom.attr("class")
        classString = if classString is "feature" then "selected" else "feature"
        dom.attr("class",classString))
)

d3.csv("all_working_hours.csv", (rawdata)->
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

  (addToData(item) for item in rawdata)
  @odesk = data
)

check = ()->
  l for l in _.keys(odesk) when names.indexOf(l) is -1