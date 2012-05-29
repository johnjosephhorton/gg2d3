var categories, data, i;

categories = ["Web Development", "Software Development", "Networking & Information Systems", "Writing & Translation", "Administrative Support", "Design & Multimedia", "Customer Service", "Sales & Marketing", "Business Services"];

data = {};

i = 0;

d3.json("./data/working_data.json", function(d) {
  data.working = d;
  i++;
  if (i === 2) return start();
});

d3.json("./data/world_countries.json", function(d) {
  data.countries = d;
  i++;
  if (i === 2) return start();
});
