let url = new URL(window.location.href);
let lat = url.searchParams.get("lat");
let long = url.searchParams.get("long");
makeRequest(lat, long);

function makeRequest(lat, long) {
  Promise.all([
    fetch('./config.json').then(value => value.json()).then(data => {
      return fetch(data.url + '/' + long + '/' + lat).then(value => value.json());
    })
  ])
  .then((obj) => {
    new MeteogramView(obj);
  })
  .catch((err) => {
    console.log(err);
  });
};
