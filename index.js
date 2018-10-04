const express = require('express')
const bodyParser = require('body-parser')
const util = require('util')
const sha256 = require('sha256')

const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');


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
        this.addBlock(new Block("First block in the chain - Genesis block"));
    }
      // Add new block
    addBlock(newBlock){
        // Block height
        newBlock.height = this.chain.length;
        // UTC timestamp
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        // previous block hash
        if(this.chain.length>0){
            newBlock.previousBlockHash = this.chain[this.chain.length-1].hash;
        }
        // Block hash with SHA256 using newBlock and converting to a string
        newBlock.hash = sha256(JSON.stringify(newBlock)).toString();
        // Adding block object to chain
        this.chain.push(newBlock);
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
    res.setHeader('Content-Type', 'application/json');
    if (block){
        if (block.body.star)
        {
            let storyDecoded = (block.body.star?hexa_to_ascii(block.body.star.story):"");
            res.send(JSON.stringify({...block,body:{...block.body, star:{...block.body.star,storyDecoded}}}));
        }
        else
        {
            res.send(JSON.stringify(block));
        }
    }
    else
    {
        res.send({found:0, message:util.format("hash %s not found",hash)});
    }
});


app.get('/block/:height', function(req, res) {
    
    let height = req.params.height;
    let block = blockchain.chain.filter(x => x.height===parseInt(height))[0];

    //console.log("get by height", block);
    res.setHeader('Content-Type', 'application/json');
    if (block){
        if (block.body.star)
        {
            let storyDecoded = (block.body.star?hexa_to_ascii(block.body.star.story):"");
            res.send(JSON.stringify({...block,body:{...block.body, star:{...block.body.star,storyDecoded}}}));
        }
        else
        {
            res.send(JSON.stringify(block));
        }
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
    let blockToRespond = [];
    for (var i = 0; i < blocks.length; i++) {
        let storyDecoded = hexa_to_ascii(blocks[i].body.star.story);
        blockToRespond.push({...blocks[i],body:{...blocks[i].body, star:{...blocks[i].body.star,storyDecoded}}});
    }
    res.setHeader('Content-Type', 'application/json');
    if (blockToRespond){    
        res.send(JSON.stringify(blockToRespond));
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

    res.setHeader('Content-Type', 'application/json');

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

    
    if (!checkIsAscii(star.story))
    {
        res.send({error:'Please make sure star story is in ascii format.'});
        return;
    }


    if (star.story.split(" ").length>250)
    {
        res.send({error:'star story is limited to 250 words.'});
        return;
    }

    star = {...star, 'story':ascii_to_hexa(star.story)}
    console.log(star);




    let block = new Block({address,star});
    // block.time = new Date().getTime().toString().slice(0,-3);
    // block.height = blockchain.chain.length+1;
    // if (blockchain.chain.length>0)
    // {
    //     block.previousBlockHash = blockchain.chain[blockchain.chain.length-1].hash;
    // }
    // block.hash= sha256(JSON.stringify(block));
    // //console.log(block);

    blockchain.addBlock(block);
    res.send(JSON.stringify(block));

    //successfully registered, remove the validated request so the user must re-init the request to register a new star
    validReqList.list = validReqList.list.filter(x => x.status.address!==address);
    reqList.list = reqList.list.filter(x => x.address!=address);


})

function checkIsAscii(str){
    for (var n = 0; n < str.length; n ++) 
    {
        if (str.charCodeAt(n)>127)
        {
            return false;
            break;
        }
    }
    return true;
}
//storyDecoded
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

//hexa_to_ascii("466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f")
function hexa_to_ascii(str)
{
    var arr1 = [];
    for (var n = 0; n <  str.length/2; n ++) 
    {
        console.log()
        arr1.push(String.fromCharCode(parseInt(str.slice(n*2,n*2+2), 16)))
    }
    return arr1.join('');
}

app.post('/requestValidation',(req, res) => {

    console.log(req.body);
    let address = req.body.address

    
    let theRequest = reqList.list.filter(x => x.address===address)[0];
    //remove previous record
    reqList.list = reqList.list.filter(x => x.address!=address);
    
    let currTimeStamp = new Date().getTime().toString().slice(0,-3);
    if (!theRequest || 300 - (currTimeStamp - theRequest.requestTimeStamp)<0){
        theRequest = new OwnerRequest(req.body.address)
        theRequest.requestTimeStamp = new Date().getTime().toString().slice(0,-3)
        theRequest.message = util.format("%s:%s:%s" ,theRequest.address, theRequest.requestTimeStamp,REQUEST_ACTION);
        theRequest.validationWindow=300
    }
    else {
        //if previous record exsit and has not expired, just update the validationWindow
        theRequest.validationWindow = 300 - (currTimeStamp - theRequest.requestTimeStamp) ;
    }
    
    
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