#Width
w = 482
h = 482

data = new Object
sum = (numbers) -> _.reduce(numbers, (a,b)-> a+b)

drawChart = ()->

  instance = data["Canada"]
  transposed = _.zip.apply(this,instance)

  summed = (sum(row) for row in transposed)
  total=sum(summed)
  percents = (number/total for number in summed)
  percents = ( [a,a] for a in percents)

  #Use d3.scale to display the numbers correctly. start rendering
  #things in radials.
  console.log(percents)
  line = d3.svg.line()

  vis = d3.select("#chart").append("svg")
    .attr("width", w)
    .attr("height", h);

  vis.append("rect")
    .attr("width", w)
    .attr("height", h)

  vis.append("path")
    .data([percents])
    .attr("class", "line")


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

  drawChart()
