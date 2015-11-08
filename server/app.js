var express = require('express');
var app = express();
var path = require('path');
var https = require('https');
var bodyParser = require('body-parser');
var fs = require('fs');
var unirest = require('unirest');


//boilerplate Express jazz
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json({limit:'50mb'}));


//mongo/ose ftw
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/spotwalk');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback) {/*no-op*/});


//totally not a plaintext api key...
var apiKey = "Id8SS1KAXuFd2W7R60XC5AUTTGKbnU2U";

//default target api url
var itemsEndpoint = "api.target.com";


app.post('/camtest', function(req, res) {
    var data = req.body.image;

    ConvertBase64StringToJPG(data, String(Date.now()),
        function(err, imgPath) {
            if (err) {
                console.log("Error converting image: " + err.message);
            }
            else {
                // These code snippets use an open-source library.
                unirest.post("https://camfind.p.mashape.com/image_requests")
                .header("X-Mashape-Key", "dGWQpgSyPEmshTREVNis3Ip1RyH1p1amMdejsnsy4BRexGTdcB")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Accept", "application/json")
                .send("image_request[language]=en")
                .send("focus[x]=160")
                .send("focus[y]=120")
                .send("image_request[locale]=en_US")
                .send("image_request[remote_image_url]=http://104.236.5.9:3000/" + imgPath)
                .end(function (result) {
                  res.send(result.body.token);
                });
                // var hostname = "camfind.p.mashape.com"
                // ,   endpoint = "/image_requests"
                // ,   mashapeKey = "baXGr5c4G2mshjvt7AvXcZJSeD2Bp1gXS9hjsneeg2s8JephhF"
                // ,   imagePath = "http://104.236.5.9:3000/" + imgPath
                // ,   postData = JSON.stringify({
                //         'image_request[locale]': 'en_US',
                //         'image_request[remote_image_url]': imagePath
                //     });

                // console.log(imagePath);
                // console.log(postData);

                // var options = {
                //     hostname: hostname,
                //     path: endpoint,
                //     method: "POST",
                //     headers: {
                //         'X-Mashape-Key': mashapeKey,
                //         'Content-Type': 'application/x-www-form-urlencoded',
                //         'Accept': 'application/json'
                //     }
                // };

                // var postReq = https.request(options, function(response) {
                //     console.log(response);
                //     var resData = "";
                //     response.on('data', function(chunk) {
                //         resData += chunk;
                //     });

                //     response.on('error', function(e) {
                //         console.log(e);
                //     });

                //     // process received data
                //     response.on('end', function() {
                //         var jsonResData = null;
                //         try {
                //             //should be able to parse valid response no problem
                //             jsonResData = JSON.parse(resData);

                //             if (jsonResData) {
                //                 console.log(resData);
                //             } else {
                //                 console.log("ERROR: COULD NOT RETRIEVE INFO ;(");
                //                 res.sendStatus(500);
                //             }
                //         }
                //         catch(e) {
                //             console.log("ERROR: CAN'T PARSE RESPONSE!: " + e.message);
                //             res.sendStatus(500);
                //         }
                //     });
                // });
                // postReq.write(postData);
                // postReq.end();
            
        }
    });


    
});

function ConvertBase64StringToJPG(base64String, imageName, callback, passthru) {
    console.log("_saveBase64StringAsImage()");

    if (!imageName) { callback("ArgumentNullException 'imageName'", null, passthru); return; }

    var savePath = path.join(__dirname, 'public', imageName + '.jpg')
        , decodedImage;
    if (base64String != null) {
        decodedImage = new Buffer(base64String, 'base64');

    } else { callback("ArgumentNullException 'base64String'", null, passthru); return; }

    if (imageName != null) {
        console.log('writing file...');
        fs.writeFile(savePath, decodedImage,
            function(err) {
                if (err)
                    callback(err.message, null, passthru);
                else
                    callback(null, imageName + '.jpg', passthru);
            }
        );
    }
}



app.get('/camfind', function(req, res) {
    console.log("get/camfind");
    var    hostname = "camfind.p.mashape.com"
    ,   path = "/image_responses/"
    ,   mashapeKey = "baXGr5c4G2mshjvt7AvXcZJSeD2Bp1gXS9hjsneeg2s8JephhF"
    ,   tolken = req.query.tolken;
    if (tolken) {
        //generate https options
        var options = {
            hostname: hostname,
            path: path + tolken,
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'X-Mashape-Key': mashapeKey
            }
        };
        setTimeout(function(){
            var postReq = https.request(options, function(response) {
            // data might come back in chunks...
            var resData = "";
            response.on('data', function(chunk) {
                resData += chunk;
            });

            // process received data
            response.on('end', function() {
                var jsonResData = null;
                try {
                    //should be able to parse valid response no problem
                    jsonResData = JSON.parse(resData);
                    console.log(resData, jsonResData);

                    if (jsonResData) {
                        tryshit(jsonResData, tolken, res);
                        

                    } else {
                        console.log("ERROR: COULD NOT RETRIEVE INFO ;(");
                        res.sendStatus(200);
                    }
                }
                catch(e) {
                    console.log("ERROR: CAN'T PARSE RESPONSE!: " + e.message);
                    res.sendStatus(200);
                }
            });
        });
        postReq.end();
    },7500);
        
    } else {
        console.log("ERROR: no data received!");
        res.sendStatus(500);
    }
    /*
    'https://camfind.p.mashape.com/image_responses/lOT-vizSk3Z3mpGaZLwqug' \
  -H 'X-Mashape-Key: dGWQpgSyPEmshTREVNis3Ip1RyH1p1amMdejsnsy4BRexGTdcB' \
  -H 'Accept: application/json'
    */
});

function tryshit(jsonResData, tolken, res) {
    var returnJSON = {"data":[{
    }]};
    if (jsonResData.name) {
        var rawBarcode = jsonResData.name
        ,   barcode = "";

        for (var ii = 0; ii < rawBarcode.length; ii++) {
            if (parseInt(rawBarcode[ii]) || parseInt(rawBarcode[ii]) === 0) {
                barcode += rawBarcode[ii];
            }
        }
        if (barcode == "") {
            returnJSON.data[0].barcode = "";
            returnJSON.data[0].success = false;
            returnJSON.data[0].tolken = tolken;
        } else {
            returnJSON.data[0].barcode = barcode;
            returnJSON.data[0].success = true;
            returnJSON.data[0].tolken = tolken;
        }
        tries = 10;
        res.send(returnJSON);
    }
    else {
        console.log("ERROR: NO NAME! ;(");
        res.sent("no go");
    }
}

/**
 * Endpoint for iOS app; sends an array of Target products, in
 * order maximizing distance traveled.
 * 
 * NOTE: this needs to run a query for each individual app user,
 *      checking that all items are available in the requested/nearest
 *      store!!
 */
app.get('/items', function (req, res) {
    var returnJSON = {"data":[]} //response format preferred by iOS app
      , NUM_PRODUCTS = 5;

    //search the database for
    Product.find().limit(NUM_PRODUCTS).sort({locationString:-1}).exec(function(err,products){
        if (err) {
            console.log(err.message);
            res.send(err.message);
        } else if (products.length > 0) {
            var productsSorted = [products.length]
            ,   midIndex = Math.floor((products.length+1)/2)
            ,   topIndex = 0
            ,   alt = false;

            //Mongoose is an asshole and adds data we don't want, which
            // makes iOS shit all over itself if not peeled out...
            products.forEach(function(p, i){

                var simpleProductObject = { //pay no attention to the gross ;/
                    upc: p.upc,
                    description: p.description,
                    imageUrl: p.imageUrl
                };

                if (alt) {
                    productsSorted[midIndex + topIndex] = simpleProductObject;
                    topIndex ++;
                    alt = false;
                } else {
                    productsSorted[topIndex] = simpleProductObject;
                    alt = true;
                }
                
            });

            //Send list to iOS app
            res.send(productsSorted);

        } else {
            console.log("ERROR: no products found!");
            res.send("ERROR: no products found!");
        }
    })
});



//mongoose 'Product' model
var productSchema = mongoose.Schema({
    upc: String,
    description: String,
    imageUrl: String,
    locationString: String
});

var Product = mongoose.model('Product', productSchema);

/**
 * Primary endpoint for adding a product to the database
 */
app.post('/item', function (req, res) {
    var data = req.body;
    console.log("data received at /item: ", data);

    if (data) {
        // generate and send JSON request to Target api for product info

        //get endpoint path
        var path = null;
        if (data.barcode) {
            path = "/items/v3/" + data.barcode + "?id_type=barcode&key=" + apiKey + "&fields=all_fields_group&store_id=3";
        } else {
            path = "/items/v3/" + data.dpci + "?id_type=dpci&key=" + apiKey + "&fields=all_fields_group&store_id=3";
        }

        //generate https options
        var options = {
            hostname: itemsEndpoint,
            path: path,
            method: "GET",
            headers: {
                'Accept': 'application/json'
            }
        };

        
        var postReq = https.request(options, function(response) {
            // data might come back in chunks...
            var resData = "";
            response.on('data', function(chunk) {
                resData += chunk;
            });

            // process received data
            response.on('end', function() {
                var jsonResData = null;
                try {
                    //should be able to parse valid response no problem
                    jsonResData = JSON.parse(resData);
                }
                catch(e) {
                    console.log("ERROR: CAN'T PARSE RESPONSE!: " + e.message);
                }
                if (jsonResData) {
                    //grab first item from response
                    var item = jsonResData.product_composite_response.items[0]; // should be fine?

                    if (!item.errors) {
                        try{
                            //peel out image and description
                            var productDescription = item.online_description.value // online desc = w00t
                              , alternateIdentifiers = item.alternate_identifier //list of upc's n shit
                              , image = item.image.internal_primary_image_url[0] //only one img to grab
                              , location = item.in_store_location[0]; //floor, block, aisle

                            
                            // get upc
                            var UPC = null;
                            alternateIdentifiers.forEach(function(ai) {
                                if (ai.id_type == 'UPC' && ai.is_primary == true) {
                                    UPC = ai.id;
                                }
                            });

                            var query = Product.where({ upc: UPC });
                            query.findOne(function(err,product) {
                                if (product) {
                                    console.log("Product already entered!", product);
                                } else {
                                    // create and store new Product
                                    var newProduct = new Product();
                                    newProduct.upc = UPC;
                                    newProduct.imageUrl = image;
                                    newProduct.description = productDescription;
                                    newProduct.locationString = location.floor+location.block+location.aisle;
                                    newProduct.save();
                                }
                            });

                            
                            console.log(productDescription, UPC, image);
                            res.sendStatus(200);
                        }
                        catch(e) {
                            console.log("ERROR: could not parse all item info: " + e.message);
                            res.sendStatus(500);
                        }
                    }
                    else {
                        console.log(item.errors);
                        res.sendStatus(500);
                    }
                } else {
                    console.log("ERROR: COULD NOT RETRIEVE INFO ;(");
                    res.sendStatus(500);
                }
            });
        });
        postReq.end();
    } else { //no data
        console.log("ERROR: no data!!");
        res.sendStatus(500);
    }
});

//note to self: send index.html
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public','index.html'));
});

app.use(express.static('public'));

var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});