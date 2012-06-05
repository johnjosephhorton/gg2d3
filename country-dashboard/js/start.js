var categories, data, i, startQ, total;

categories = ["Web Development", "Software Development", "Networking & Information Systems", "Writing & Translation", "Administrative Support", "Design & Multimedia", "Customer Service", "Sales & Marketing", "Business Services"];

data = {};

total = 4;

i = 0;

d3.json("./data/working_data.json", function(d) {
  data.working = d;
  i++;
  if (i === total) return startQ();
});

d3.json("./data/world_countries.json", function(d) {
  data.countries = d;
  i++;
  if (i === total) return startQ();
});

d3.json("./data/sorted.json", function(d) {
  data.sorted = d;
  i++;
  if (i === total) return startQ();
});

d3.json("./data/global.json", function(d) {
  data.global = d;
  i++;
  if (i === total) return startQ();
});

startQ = function() {
  if (typeof start !== "undefined" && start !== null) {
    return start();
  } else {
    return setTimeout(startQ, 100);
  }
};
