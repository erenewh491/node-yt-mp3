const mongoose = require("mongoose");
const uuidAPKey = require("uuid-apikey");
//connection
mongoose.connect(process.env.DBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const con = mongoose.connection;
con.on("error", console.error.bind(console, "connection error:"));
con.once("open", () => {
  //we are connected
  console.log(`We are finally Connected with the database!!`);
});

mongoose.set('useFindAndModify', false);


//Api Key configuration
const ApiKeySchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
  },
  Password: {
    type: String,
    required: true,
  },
  IP: {
    type: String,
    required: true,
  },
  ApiKey: {
    type: String,
    required: true,
  },
  MaxRequests: {
    type: Number,
    required: true
  },
  LastUsedID: {
    type: Number,
    default: 0
  },
});

var ApiKey = mongoose.model("ApiKey", ApiKeySchema);
/*
// created an API key
var api = uuidAPKey.create().apiKey;
// how to save data
var newData = new ApiKey({
    Name: 'test',
    Password: 'test',
    Email: 'test@test.com',
    IP: '::1',
    ApiKey: api,
    MaxRequests: 2,
  })
  .save();
*/


var Auth = mongoose.model('Auth', {
  Username: {
    type: String,
    required: true,
  },
  Password: {
    type: String,
    required: true,
  },
});
/*
var newData = new Auth({
  Username: 'admin',
  Password: 'test',
}).save();
*/
module.exports = {
  ApiKey: ApiKey,
  Auth: Auth
};