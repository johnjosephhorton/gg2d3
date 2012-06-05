#Static info
categories = ["Web Development", "Software Development", "Networking & Information Systems", "Writing & Translation", "Administrative Support", "Design & Multimedia", "Customer Service", "Sales & Marketing", "Business Services"]

#Gather the data
data = {}

total = 4
i=0

d3.json("./data/working_data.json", (d)->
  data.working= d
  i++
  if i is total then startQ()
)

d3.json("./data/world_countries.json", (d)->
  data.countries = d
  i++
  if i is total then startQ()
)

d3.json("./data/sorted.json", (d)->
  data.sorted = d
  i++
  if i is total then startQ()
)

d3.json("./data/global.json", (d)->
  data.global = d
  i++
  if i is total then startQ()
)

startQ = ()->
  if start? then start() else setTimeout(startQ,100)