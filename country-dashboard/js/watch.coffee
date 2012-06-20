  #Watch chart methods and objects
watch = {max: {absolute: 0, relative:0} , hour:0, abs_q: false}
playing = false

watch.navigate = ()->
    route.navigate("#/watch/#{watch.abs_q}/#{watch.hour}")

orderWatchData = ()->
  data.watch = {relative: {}, absolute:{}}

  for country of data.working when data.working[country].normal_hours?

    abs =  _.flatten(data.working[country].utc_hours)
    rel =  _.chain(data.working[country].utc_hours)
          .flatten()
          .map((n)->n/data.working[country].total)
          .value()

    watch.max.relative = Math.max(watch.max.relative,d3.max(rel))
    watch.max.absolute = Math.max(watch.max.absolute,d3.max(abs))

    data.watch.relative[country] = rel
    data.watch.absolute[country] = abs

  instance = _.flatten(data.global.reduced)
  time = 60*60
  ranges =  _.range(instance.length)
  data.watch.charting = ({x: i*time, y: instance[i]} for i in ranges)
  data.watch

createWatchChart = ()->
  orderWatchData()
  createWatchMap()
  createWatchWeek()

  $("#radio-scale").button()

  type_update = ()->
    updateWatchChart()
    watch.navigate()

  $("#radio-scale > button:first").click(()->
    if watch.abs_q
      watch.abs_q = false
      type_update()
  )

  $("#radio-scale > button:last").click(()->
    if !watch.abs_q
      watch.abs_q = true
      type_update()
  )


createWatchWeek = ()->
  watch.chart = new Rickshaw.Graph({
      renderer: "area"
      element: document.querySelector("#global-weekly")
      height: $("#comparemap").parent().height()/2
      width: $("#global-weekly").parent().width()
      series:[{
        data:data.watch.charting
        color: "#168CE5"
        name: "Global"
        }]})

  watch.chart.render()

  ticks = "glow"
  week=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
  time = new Rickshaw.Fixtures.Time
  timer = time.unit("day")
  a = timer.formatter
  timer.formatter = (d)-> week[a(d)-1]

  watch.xAxis = new Rickshaw.Graph.Axis.Time({
    graph: watch.chart
    ticksTreatment: ticks
    timeUnit: timer
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
  })

  watch.yAxis = new Rickshaw.Graph.Axis.Y({
    graph: watch.chart
    ticksTreatment: ticks
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
  })

  watch.xAxis.render()
  watch.yAxis.render()

  watch.hover = new Rickshaw.Graph.HoverDetail({
    graph: watch.chart,
    xFormatter: ((x)->
      #HACKKKKKKKK
      watch.hour = x/3600
      playing = false
      updateWatchChart()
      h = x/3600
      day = week[Math.floor(h/24)]
      hour = h%24
      this.time = "#{day}, #{hour}:00-#{(hour+1)%24}:00"
      null
      ),
    yFormatter: (y)->  "#{Math.round(y)} total workers online <br /> #{this.time}"
  })

createWatchMap = ()->
  watch.rscale = d3.scale.linear()
    .range(["white","blue"])
    .domain([0,watch.max.relative])

  watch.ascale = d3.scale.log()
    .range(["white","red"])
    .domain([0.01,watch.max.absolute])

  size = $("#watchmap").parent().width()

  watch.map = d3.select("#watchmap").append("svg")
    .attr("height",size*0.7)
    .attr("width",size)

  watch.map.projection =  d3.geo.mercator()
    .scale(size)
    .translate([size/2,size/2])

  watch.map.path = d3.geo.path().projection(watch.map.projection)
  watch.map.fisheye = d3.fisheye().radius(50).power(10)

  feature = watch.map.selectAll("path")
    .data(data.countries.features).enter()
      .append("path")
    .attr("d",watch.map.path)
    .each((d)-> d.org = d.geometry.coordinates)

  feature.each((d,i)->
    $(this).tooltip(
      title: "#{d.properties.name}"
      space: 90
    )
  )

  fishPolygon = (polygon)->
    _.map(polygon, (list)->
      _.map(list,(tuple)->
        p = watch.map.projection(tuple)
        c = watch.map.fisheye({x : p[0], y : p[1]})
        watch.map.projection.invert([c.x, c.y])))

  refish = (e)->
    #Not sure why you have to get rid of 20
    #Padding maybe?
    x = e.offsetX
    y = e.offsetY
    #TODO: Still a little off on firefox
    m = $("##{name}map > svg").offset()
    if not x?
      totalOffsetX = 0
      totalOffsetY = 0
      currentElement = this
      while true
        totalOffsetX += currentElement.offsetLeft
        totalOffsetY += currentElement.offsetTop
        break if (currentElement = currentElement.offsetParent)

      x = e.pageX - totalOffsetX
      y = e.pageY - totalOffsetY


    watch.map.fisheye.center([x,y])
    watch.map.selectAll("path")
     .attr("d",(d)->
       clone = $.extend({},d)
       type = clone.geometry.type
       processed = if type is "Polygon" then fishPolygon(d.org) else _.map(d.org,fishPolygon)
       clone.geometry.coordinates = processed
       watch.map.path(clone)
    )

  $("#watchmap").on(i,refish) for i in ["mousemove","mousein","mouseout","touch","touchmove"]

updateWatchChart = (abs,h)->
  if h then watch.hour = +h
  if abs then watch.abs_q = (abs is "true")
  watch.navigate()

  week=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
  day = week[Math.floor(watch.hour/24)]
  hour = watch.hour%24
  watch.text = "#{day}, #{hour}:00-#{(hour+1)%24}:00 GMT"
  $("#watch-time").text( "Activity Map for #{watch.text}")
  if watch.abs_q
    $("#radio-scale > button:last").button('toggle')
  else
    $("#radio-scale > button:first").button('toggle')

  updateNameMap()


updateNameMap = ()->
  watch.map.selectAll("path")
    .transition().delay(100)
    .attr("fill",(d,i)->
      country = d.properties.name
      percent = data.watch.relative[country]?[watch.hour]
      number = data.watch.absolute[country]?[watch.hour]
      console.log(percent,number) if country is "Russia"
      if percent and number > 10
        if not watch.abs_q
          watch.rscale(percent)
        else
          watch.ascale(number)
      else
        "white"
    )
    .attr("stroke","black")
    .each((d,i)->
      country = d.properties.name
      hours = Math.round(data.watch.absolute[country]?[watch.hour])
      percent = data.watch.relative[country]?[watch.hour]
      if hours and percent
        #http://twigstechtips.blogspot.com/2012/04/twitter-bootstrap-change-tooltip-label.html
        t = "#{country} <br />"
        p = Math.round(percent*10000)/100
        t += "#{p}% of registered workers are active <br />"
        t += "#{hours} worker#{if hours isnt 1 then "s" else ""} online now <br />"

        $(this).attr('data-original-title',t)
          .tooltip('fixTitle')
    )
