#Gather the data
data = {}
i=0
d3.json("./data/working_data.json", (d)->
  data.working= d
  i++
  if i is 2 then start()
)

d3.json("./data/world_countries.json", (d)->
  data.countries = d
  i++
  if i is 2 then start()
)

#SVG objects (which will later hold onto d3 charting objects)
map = null
bubble = null
categories = ["Web Development", "Software Development", "Networking & Information Systems", "Writing & Translation", "Administrative Support", "Design & Multimedia", "Customer Service", "Sales & Marketing", "Business Services"]
#Variables
country = "United States"

#Start everything up
start = ()->
  create()
  update()

create = ()->
  createMap()
  createBubble()

createMap = ()->
  size = $("#map").parent().parent().width()

  map = d3.select("#map").append("svg")
    .attr("height",size)
    .attr("width",size)

  map.projection =  d3.geo.mercator()
    .scale(size)
    .translate([size/2,size/2])

  map.path = d3.geo.path().projection(map.projection)
  map.fisheye = d3.fisheye().radius(50).power(10)


  feature = map.selectAll("path")
    .data(data.countries.features).enter()
    .append("path")
    .attr("class",(d)->
      if d.properties.name of data.working
        if d.properties.name is country
          'selected'
        else
          'unselected'
      else
        'feature'
    )
    .attr("d",(d)-> map.path(d))
    .each((d)-> d.org = d.geometry.coordinates)
    .on('click', (d,i)->
      clicked= d.properties.name
      if not (clicked of data.working) then return
      country = clicked
      update()
    )

  feature.each((d,i)->
    $(this).tooltip(
      title: d.properties.name
    )
  )
  fishPolygon = (polygon)->
    _.map(polygon, (list)->
      _.map(list,(tuple)->
        p = map.projection(tuple)
        c =  map.fisheye({x : p[0], y : p[1]})
        map.projection.invert([c.x, c.y])))

  refish = (e)->
    #Not sure why you have to get rid of 20
    #Padding maybe?
    x = e.offsetX
    y = e.offsetY
    #TODO: Still a little off on firefox
    x ?= e.screenX - map.offset().left
    y ?= e.screenY - map.offset().top

    map.fisheye.center([x,y])
    map.selectAll("path")
     .attr("d",(d)->
       clone = $.extend({},d)
       type = clone.geometry.type
       processed = if type is "Polygon" then fishPolygon(d.org) else _.map(d.org,fishPolygon)
       clone.geometry.coordinates = processed
       map.path(clone)
    )

  $("#map").on(i,refish) for i in ["mousemove","mousein","mouseout","touch","touchmove"]

createBubble = ()->

  size = Math.min($("#bubble").width(),$(document).height())

  bubble = d3.select("#bubble").append("svg")
    .attr("width",size)
    .attr("height",size)
    .attr("class","pack")
    .append("g")
    .attr("transform","translate(0,0)")

  bubble.size = size

  bubble.colors = d3.scale.category20().domain(categories)
  bubble.flatten= (root)->
    classes = []
    recurse = (name,node)->
      if node.children
        node.children.forEach((child)-> recurse(node.name,child))
      else
        classes.push({packageName: name, className: node.name, value: node.size})
    recurse(null,root)
    {children: classes, className: "Total"}

  for t in categories
    c = $("<div>")
    box = $("<div>").css({height: 10, width: 10, "background-color":bubble.colors(t) })
    $("#cats").append(box,$("<p>").text(t))
update = ()->
  updateMap()
  updateBubble()

updateMap = ()->
  feature = map.selectAll("path")
    .attr("class",(d)->
      if d.properties.name of data.working
        if d.properties.name is country
          'selected'
        else
          'unselected'
      else
        'feature'
    )

updateBubble = ()->
    d= data.working[country].job_types

    f = name: "jobs"

    children = []
    sums = {}
    for big_name, big_ob of d
      grandchildren = []
      sum = 0
      for small_name, small_size of big_ob
        grandchildren.push({"name": small_name, "size": small_size})
        sum+= small_size

      children.push({"name": big_name, "children": grandchildren.sort((a,b)-> a.size < b.size)})
      sums[big_name]=sum

    f.children = children.sort((a,b)-> sums[a.name] < sums[b.name])

    #Start firing up the formating objects
    format = d3.format(",d")

    packer = d3.layout.pack()
      .sort(null)
      .size([bubble.size,bubble.size]).value((d)-> d.value)

    timing = 100
    node = bubble.selectAll("g.node").data(packer.nodes(bubble.flatten(f)), (d)-> d.className)

    g = node.enter().append("g")
      .attr("transform", (d)->  "translate(#{d.x},#{d.y})")

    g.append("circle")

    g.each((d,i)->
      $(this).tooltip(
        title: "#{d.className} <br /> #{d.value} projects completed"
        placement: "top"
      )
    )

    g.filter((d)-> not d.children).append("text")

    node.transition().delay(timing)
      .attr("class",(d)-> if d.children? then "node" else "leaf node")
      .attr("transform", (d)->  "translate(#{d.x},#{d.y})")

    node.select("circle").transition().delay(timing)
      .attr("r",(d)-> d.r)
      .attr("fill",(d)->
        if d.packageName then bubble.colors(d.packageName) else "none")


    node.filter((d)->not d.children).select("text")
      .transition().delay(timing)
      .attr("text-anchor","middle")
      .attr("dy",".3em")
      .text((d)-> d.className.substring(0,d.r/4))

    node.exit().remove()
