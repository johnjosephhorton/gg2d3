#Static info
categories = ["Web Development", "Software Development", "Networking & Information Systems", "Writing & Translation", "Administrative Support", "Design & Multimedia", "Customer Service", "Sales & Marketing", "Business Services"]

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
