f = null

flatten = (root)->
  classes = []
  recurse = (name,node)->
    if node.children
      node.children.forEach((child)-> recurse(node.name,child))
    else
      classes.push({packageName: name, className: node.name, value: node.size})
  recurse(null,root)
  {children: classes, className: "Total"}


d3.json "data/working-data.json", (data)->

  d= data["Brazil"]

  f = name: "jobs"

  children = []
  sums = {}
  for big_name, big_ob of d.job_types
    grandchildren = []
    sum = 0
    for small_name, small_size of big_ob
      grandchildren.push({"name": small_name, "size": small_size})
      sum+= small_size

    children.push({"name": big_name, "children": grandchildren.sort((a,b)-> a.size < b.size) })
    sums[big_name]=sum

  children = children.sort((a,b)-> sums[a.name] < sums[b.name])


  f.children = children

  r = $(document).height()

  format = d3.format(",d")
  fill =d3.scale.category20()

  bubble = d3.layout.pack()
    .sort(null)
    .size([r,r]).value((d)-> d.value)

  vis = d3.select("#bubble").append("svg")
      .attr("width",r)
      .attr("height",r)
      .attr("class","pack")
    .append("g")
      .attr("transform","translate(2,2)")


  node = vis.selectAll("g.node").data(bubble.nodes(flatten(f)))
       .enter().append("g")
       .attr("class",(d)-> if d.children? then "node" else "leaf node")
       .attr("transform", (d)->  "translate(#{d.x},#{d.y})")

  node.append("circle")
    .attr("r",(d)-> d.r)
    .attr("fill",(d)-> if d.packageName then fill(d.packageName) else "white")


  node.append("title")
    .text((d)-> "#{d.className} - #{d.value} projects completed")

  node.filter((d)-> not d.children).append("text")
    .attr("text-anchor","middle")
    .attr("dy",".3em")
    .text((d)-> d.className.substring(0,d.r/3))