let url = new URL(window.location.href);
let lat = url.searchParams.get("lat");
let long = url.searchParams.get("long");
makeRequest(lat, long);

function makeRequest(lat, long) {
  Promise.all([
    fetch('https://bm-eugis.tk/marine_data/data/'+long+'/'+lat).then(value => value.json()),
  ])
  .then((obj) => {
      var m = new MeteogramView(obj);
  })
  .catch((err) => {
    console.log(err);
  });
};
