var path = require('path');
var url = require('url');


var express = require('express');
var app = express();
var router = express.Router();
app.use(express.static(__dirname + '/public'));


var mongo = require('mongodb').MongoClient;
var urlMongo = 'mongodb://linkbot:linkbot@ds053136.mlab.com:53136/url-shortener';





//homepage
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'public/index.html'));
});




//new
router.get('/*', function(req, res){
    
    //formatting the url
    var loc = url.parse(req.url).path.slice(1);
    var valid = false;
    var ext = ['.com', '.net', '.org', '.gov', '.edu', '.io', '.co'];
    for (var i in ext){
        if (loc.indexOf(ext[i]) >= 0) {
            valid = true;
            break;
        }
    }
    if (valid == false) {
        return res.sendFile(path.join(__dirname, 'public/400.html'), 400);
    }
    if (loc.indexOf('http://') == -1 && loc.indexOf('https://') == -1){
        loc = 'http://' + loc;
    }
    
    
    //database connection
    mongo.connect(urlMongo, function(err, db){
        if (err) throw err;
       
        var links = db.collection('links');
        var count = 0;
        /*var count = links.find().sort({_id: -1}).limit(1) + 1|| 0;*/
        links.find().sort({count: -1}).limit(1).toArray(function(err, data){
             if (err) throw err;
             if (data.length > 0){
                 count = data[0].count + 1;
            }
        });
       
        links.find({url: loc}).toArray(function(err, docs){
            if (err) throw err;
            if (docs.length == 0) {
                links.insert({count: count, url: loc, eurl: 'https://eurl.herokuapp.com/' + count}, function(err, data) {
                    if (err) throw err;
                });
            }
            links.find({url: loc}, {_id: 0, url: 1, eurl: 1}).toArray(function(err, docs){
                if (err) throw err;
                res.send(docs[0]);
            });
        });
    });
});
app.use('/new', router);





//redirect
app.get('/*', function(req, res){
    var loc = 'https://eurl.herokuapp.com' + req.url;
    mongo.connect(urlMongo, function(err, db){
        if (err) throw err;
        var links = db.collection('links');
        links.find({eurl: loc}).toArray(function(err, docs){
            if (err) throw err;
            if (docs.length > 0) res.redirect(docs[0].url);
            else res.sendFile(path.join(__dirname, 'public/404.html'), 404);
        });
    });
});


app.listen(process.env.PORT, process.env.IP);