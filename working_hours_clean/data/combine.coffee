fs = require('fs')
csv = require('csv')
_ = require('../js/underscore.min.js')
timezones = JSON.parse fs.readFileSync "timezones.json","utf-8"

rawData = []

csv()
.fromPath(__dirname+'/more_working_hours.csv')
.toPath(__dirname+'/sample.out')
.transform((data)->
    data.unshift(data.pop())
    data
)
.on('data',(data,index)->
  rawData.push(data)
)
.on('end',(count)->
  data = new Object
  addToData = (item)->
    [num, d, hour, country, w,key, mouse] = item
    workers = +w
    day = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(d)
    if country is "Country" then return

    #Init empty arrays to deal with sparse arrays
    zeros = (0 for i in [0...24])
    zerozeros = (zeros[0..] for i in [0..6])
#    console.log(zeros,zerozeros)

    #Do we have an object
    if not data[country]?
      data[country] = new Object()
      data[country]["hours"] = zerozeros[0..]
      data[country]["zones"]= timezones[country]

    data[country]["hours"][day][hour]=workers

  _.map(rawData,addToData)
  console.log data["Iraq"]
  fs.writeFileSync("working-data.json",JSON.stringify(data))
)
.on('error',(error)->
    console.log(error.message)
)
