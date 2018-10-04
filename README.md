# Build a Private Blockchain Notary Service
This project demonstrate how to use Node.js Web APIs frameworks to notarize ownership of a digital asset by implement algorithms to sign and verify messages.

# Quickstart

### Install
Download or git clone this project. Enter the project path and run  `npm install`.

### Run
After the package installed complete, run `node index.js`. This should launch the service on http://localhost:8000.

### Step 1: Block ID Validation Routine.
**Validate User Request** 
First let the users begin by init a post request to notify the service of their wallet addresses.
The service will response with a message for them to sign.

- Open a command prompt, enter `curl -H 'Content-Type: application/json; charset=utf-8' -d '{"address": "14deUj1BQnGLMeazg8HmdoBkWeKuCJgv42"}' 'http://localhost:8000/requestValidation'` to execute a post rquest

- You should be able to see something like ```{"address":"14deUj1BQnGLMeazg8HmdoBkWeKuCJgv42","requestTimeStamp":"1538619245","message":"14deUj1BQnGLMeazg8HmdoBkWeKuCJgv42:1538619245:starRegistry","validationWindow":300}```
- validationWindow means this request will be expired after 300 seconds.
- message is for you to sign with your wallet in the next step.


**Verify Message Signature** 
This signature proves the users blockchain identity. Upon validation of this identity, the user should be granted access to register a single star.
- Open Electrum and use the message sign functionality to sign the message `14deUj1BQnGLMeazg8HmdoBkWeKuCJgv42:1538619245:starRegistry`.
- Copy the signature you got, for this example the signature is: `IDDeyravdTMX5h9GyENeqTQQe/CnMye5MWw9lkyLzSG3SnqcF5iZSp7Yuybzp5hAyZc2ElUMRP4IPZYRZn6bC0Y=`.
- Open a terminal
- run `curl -X "POST" "http://localhost:8000/message-signature/validate" \`
        `     -H 'Content-Type: application/json; charset=utf-8' \`
        `     -d $'{`
        `  "address": "14deUj1BQnGLMeazg8HmdoBkWeKuCJgv42",`
        `  "signature": "IDDeyravdTMX5h9GyENeqTQQe/CnMye5MWw9lkyLzSG3SnqcF5iZSp7Yuybzp5hAyZc2ElUMRP4IPZYRZn6bC0Y="`
        `}'`
- You will recive the star registr permission granted information in json format such as ```{"registerStar":true,"status":{"address":"14deUj1BQnGLMeazg8HmdoBkWeKuCJgv42","requestTimeStamp":"1538619245","message":"14deUj1BQnGLMeazg8HmdoBkWeKuCJgv42:1538619245:starRegistry","validationWindow":96,"messageSignature":"valid"}}```
- If the time expired, just re-init the request using previous step.


### Step 2: Configure Star Registration Endpoint
**Star Registration** 
This will allow validated users to submit a star registration.
- Open a terminal
- run `curl -X "POST" "http://localhost:8000/block" \`
   `     -H 'Content-Type: application/json; charset=utf-8' \`
   `     -d $'{`
   ` "address": "14deUj1BQnGLMeazg8HmdoBkWeKuCJgv42",`
   ` "star": {`
   `     "dec": "-26° 29'\'' 24.9",`
   `     "ra": "16h 29m 1.0s",`
   `     "story": "Found star using https://www.google.com/sky/"`
   ` }`
   ` }'`
- You will recive the star registr permission granted information in json format such as ```{"hash":"ad3ffdb9bf4829806211c256431badaa98307b4c3887814b74d5d0dabc302183","height":4,"body":{"address":"14deUj1BQnGLMeazg8HmdoBkWeKuCJgv42","star":{"dec":"-26° 29' 24.93","ra":"16h 29m 1.0s","story":"466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"}},"time":"1538620755","previousBlockHash":"31f1e495af268fb9085f5958dddf23cf0343a09d22c4f52923683499c32894ef"}```
- If the time expired, just re-init the request using previous step.



### Step 3: Configure Star Lookup
**By Wallet Address**
URL:`http://localhost:8000/stars/address:[ADDRESS]`
- Open a browser, enter `http://localhost:8000/stars/address:14deUj1BQnGLMeazg8HmdoBkWeKuCJgv42`
- You should be able to see an array of json objects list all the star registered using this wallet.

**By hash**
URL:`http://localhost:8000/stars/address:[ADDRESS]`
- Open a browser, enter `http://localhost:8000/stars/address:14deUj1BQnGLMeazg8HmdoBkWeKuCJgv42`
- You should be able to see an array of json objects list all the star registered using this wallet.

**By Wallet Address**
URL:`http://localhost:8000/stars/hash:[HASH]`
- Open a browser, enter `http://localhost:8000/stars/HASH:ad3ffdb9bf4829806211c256431badaa98307b4c3887814b74d5d0dabc302183`
- You should be able to see a single json object that describes the star registered under this hash.


**By Block Height**
URL:`http://localhost:8000/block/[HEIGHT]`
- Open a browser, enter `http://localhost:8000/block/4`
- You should be able to see a single json object of that star block height.


### License

This work dedicated using
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Feel free to do
whatever you want with it.