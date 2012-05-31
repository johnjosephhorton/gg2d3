country = "United States"

#Bubble chart methods and objects
bubble = {bubble: null, map: null}

createBubbleChart = ()->
  createBubbleMap()
  createBubbles()

createBubbleMap = ()->
  size = $("#bubblemap").parent().width()

  bubble.map = d3.select("#bubblemap").append("svg")
    .attr("height",size)
    .attr("width",size)

  bubble.map.projection =  d3.geo.mercator()
    .scale(size)
    .translate([size/2,size/2])

  bubble.map.path = d3.geo.path().projection(bubble.map.projection)
  bubble.map.fisheye = d3.fisheye().radius(50).power(10)


  feature = bubble.map.selectAll("path")
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
    .attr("d",bubble.map.path)
    .each((d)-> d.org = d.geometry.coordinates)
    .on('click', (d,i)->
      clicked= d.properties.name
      if not (clicked of data.working) then return
      country = clicked
      route.navigate("#bubble/#{country}")
      updateBubbleChart()
    )

  feature.each((d,i)->
    $(this).tooltip(
      title: d.properties.name
    )
  )

  fishPolygon = (polygon)->
    _.map(polygon, (list)->
      _.map(list,(tuple)->
        p = bubble.map.projection(tuple)
        c =  bubble.map.fisheye({x : p[0], y : p[1]})
        bubble.map.projection.invert([c.x, c.y])))

  refish = (e)->
    #Not sure why you have to get rid of 20
    #Padding maybe?
    x = e.offsetX
    y = e.offsetY
    #TODO: Still a little off on firefox
    m = $("bubblechart > svg").offset()
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

    bubble.map.fisheye.center([x,y])
    bubble.map.selectAll("path")
     .attr("d",(d)->
       clone = $.extend({},d)
       type = clone.geometry.type
       processed = if type is "Polygon" then fishPolygon(d.org) else _.map(d.org,fishPolygon)
       clone.geometry.coordinates = processed
       bubble.map.path(clone)
    )

  $("#bubblemap").on(i,refish) for i in ["mousemove","mousein","mouseout","touch","touchmove"]

createBubbles = ()->

  w = $("#bubblechart").parent().width()
  h = $("#bubblemap").parent().width()

  bubble.bubble = d3.select("#bubblechart").append("svg")
    .attr("width",w)
    .attr("height",h)
    .attr("class","pack")
    .append("g")
    .attr("transform","translate(0,0)")
  bubble.width = w
  bubble.height= h

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

  cats = $("#cats")
  for t in categories
    c = $("<div>")
    box = $("<div>").css({
      height: 10,
      width: 10,
      display: "inline-block",
      "white-space":"pre-line"
      "background-color": bubble.colors(t),
      "margin-right": "10px"})

    c.text(t).prepend(box)
    cats.append(c)

updateBubbleChart = (c)->
  if c then country = c
  updateBubbleMap()
  updateBubbles()

updateBubbleMap = ()->
    feature = bubble.map.selectAll("path")
    .attr("class",(d)->
      if d.properties.name of data.working
        if d.properties.name is country
          'selected'
        else
          'unselected'
      else
        'feature'
    )

updateBubbles = ()->
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
      .size([bubble.width,bubble.height]).value((d)-> d.value)

    timing = 100
    node = bubble.bubble.selectAll("g.node").data(packer.nodes(bubble.flatten(f)), (d)-> d.className)

    g = node.enter().append("g")
      .attr("transform", (d)->  "translate(#{d.x},#{d.y})")

    g.append("circle")

    g.each((d,i)->
      $(this).tooltip(
        title: "#{d.className} <br /> #{d.value} projects completed"
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