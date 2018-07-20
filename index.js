var fs = require("fs");
var http = require("http");
const csv = require("csvtojson"); //module permettant de convertir le csv en json
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";

//lien: http://donnees.ville.montreal.qc.ca/dataset/5829b5b0-ea6f-476f-be94-bc2b8797769a/resource/c6f482bf-bf0f-4960-8b2f-9982c211addd/download/interventionscitoyendo.csv

var options = {
  host: 'donnees.ville.montreal.qc.ca',
  path: '/dataset/5829b5b0-ea6f-476f-be94-bc2b8797769a/resource/c6f482bf-bf0f-4960-8b2f-9982c211addd/download/interventionscitoyendo.csv',
  rejectUnauthorized: false //Sinon, la console affiche un erreur comme quoi le nom de domaine n'est pas inclu dans le certificat
}

var request = http.request(options, function (res) {
  var csvstring = "";

  res.setEncoding('latin1'); //Préserve les caractères latin1

  res.on('data', function (chunk) {
    csvstring += chunk;
  });

  res.on('end', function () {
    csv().fromString(csvstring).then(function(jsonArrayObj) { //converti le buffer au format csv en json
      MongoClient.connect(url, { useNewUrlParser: true} , function(err, client) {
        if (err) {
          console.log(err);
          client.close();
        } else {
          const db = client.db("spvm");
          const collection = db.collection("actes");

          collection.remove({}, function () { //Vide la collection avant de la repopuler
            collection.insert(jsonArrayObj, function (err, result) {
              if (err)
                console.log(err);
              else
                console.log("Mise à jour de la DB réussie!");
                client.close();
            });
          });
        }
      });
    });
  });
});

request.on('error', function (e) {
	console.log(e.message);
});

request.end();
