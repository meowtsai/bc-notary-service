const express = require('express')
const bodyParser = require('body-parser')
const util = require('util')
const sha256 = require('sha256')

const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');



//npm install --save sha256
const app = express()
app.use(bodyParser.json())

class OwnerRequest{
    constructor(address){
        this.address = address;
        this.requestTimeStamp = 0;
        this.message ="";
        this.validationWindow = 0;
    }
}


class validSignResponse {
    constructor(oReq){
        this.registerStar = false;
        this.status = oReq;
    }
}

class RequestList {
    constructor(){
        this.list = [];
       }
}

class ValidRequestList {
    constructor(){
        this.list = [];
       }
}

class Blockchain {
    constructor(){
        this.chain = [];
    }
}

class Block {
    constructor(bodyObj){
        this.hash = "";
        this.height = "";
        this.body =  bodyObj;
        this.time = 0;
        this.previousBlockHash = "";

    }
}

const REQUEST_ACTION ="starRegistry";
let reqList = new RequestList();
let validReqList = new ValidRequestList();
let blockchain = new Blockchain();


app.get('/stars/hash::hash', function(req, res) {
    //console.log(req.params.hash);
    let hash = req.params.hash;
    let block = blockchain.chain.filter(x => x.hash===hash)[0];
    if (block){
        res.send(JSON.stringify(block));
    }
    else
    {
        res.send({found:0, message:util.format("hash %s not found",hash)});
    }
});


app.get('/block/:height', function(req, res) {
    //console.log(req.params.hash);
    let height = req.params.height;
    let block = blockchain.chain.filter(x => x.height===parseInt(height))[0];
    if (block){
        res.send(JSON.stringify(block));
    }
    else
    {
        res.send({found:0, message:util.format("height %s not found",height)});
    }
});

app.get('/stars/address::address', function(req, res) {
    //console.log(req.params.hash);
    let address = req.params.address;
    let blocks = blockchain.chain.filter(x => x.body.address===address);
    if (blocks){
        res.send(JSON.stringify(blocks));
    }
    else
    {
        res.send({found:0, message:util.format("No records registered by address %s found.",address)});
    }
});

app.post('/block',(req,res)=>{
    let address = req.body.address;
    let star = req.body.star;
   
    //check if the wallet is valid and verified
    let validRequest = validReqList.list.filter(x => x.status.address===address)[0];
    console.log("=========validRequest=========");
    console.log(validRequest);
    let currentTimeStamp = new Date().getTime().toString().slice(0,-3);
    if (!validRequest) {
        res.send({error:'Request from this wallet has not been verified. Please verify the signed message first.'});
        return;
    }
    if (300-(currentTimeStamp - validRequest.status.requestTimeStamp)<=0){
        res.send({error:'Request from this wallet has expired. Please restart a request.'});
        validReqList.list = validReqList.list.filter(x => x.status.address!=address); //remove the item from the valid request list
        return;
    }



    if (!star.ra)
    {
        res.send({error:'right_ascension is required.'});
        return;
    }

    if (!star.dec)
    {
        res.send({error:'declination is required.'});
        return;
    }

    if (star.story.length>250)
    {
        res.send({error:'star story is limited to 250 words.'});
        return;
    }

    star = {...star, 'story':ascii_to_hexa(star.story)}
    console.log(star);




    let block = new Block({address,star});
    block.time = new Date().getTime().toString().slice(0,-3);
    block.height = blockchain.chain.length+1;
    if (blockchain.chain.length>0)
    {
        block.previousBlockHash = blockchain.chain[blockchain.chain.length-1].hash;
    }
    block.hash= sha256(JSON.stringify(block));
    //console.log(block);

    blockchain.chain.push(block);
    res.send(JSON.stringify(block));


})

function ascii_to_hexa(str)
{
var arr1 = [];
for (var n = 0, l = str.length; n < l; n ++) 
{
    var hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
}
return arr1.join('');
}

app.post('/requestValidation',(req, res) => {

    console.log(req.body);
    let address = req.body.address

    //remove previous record
    reqList.list = reqList.list.filter(x => x.address!=address);
    

    let theRequest = new OwnerRequest(req.body.address)
    theRequest.requestTimeStamp = new Date().getTime().toString().slice(0,-3)
    theRequest.message = util.format("%s:%s:%s" ,theRequest.address, theRequest.requestTimeStamp,REQUEST_ACTION);
    theRequest.validationWindow=300

    
    reqList.list.push(theRequest)


    //let theRequest = {'name':'mary'};   
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(theRequest))

})

app.post('/message-signature/validate',(req, res) => {

    //console.log(req.body);

    let address = req.body.address
    let signature = req.body.signature;

    let isValid = true;

    let theReq = reqList.list.filter(x => x.address===address)[0];
    let currTimeStamp = new Date().getTime().toString().slice(0,-3);
    let response = new validSignResponse(theReq)
    console.log(theReq);
    if (theReq)
    {
        response.status.validationWindow = 300 - (currTimeStamp - theReq.requestTimeStamp) ;
        console.log(currTimeStamp);
        console.log(theReq.requestTimeStamp);
        
        if (theReq.validationWindow > 0){

            response.status.messageSignature  ="valid";
            let message = theReq.message;
            console.log(message);
            console.log(address);
            console.log(signature);

            let msgVerify =  bitcoinMessage.verify(message, address, signature);
            console.log("msgVerify",msgVerify);
            if (!msgVerify)
            {
                theReq.messageSignature = "invalid";
                isValid = false;
            }
            else
            {
                theReq.messageSignature = "valid";
                isValid = true;
            }
        }
        else
        {
            //request expired, exceed 300 seconds
            isValid = false;
            theReq.messageSignature = "request expired thus not verified. Please restart a request.";
        }

    
        
        
    }
    else
    {
        isValid = false;
    }

    response.registerStar = isValid;

    if (isValid) {
        validReqList.list.push(response);
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(response))

    


})

app.listen(8000,()=>console.log('Example app listening on port 8000!'))