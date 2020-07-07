const express = require("express");
const router = express.Router();
const mongo = require("../mongo");
var Downloader = require("./downloader");
const {
  json
} = require("body-parser");

const fs = require("fs");

router.get("/:api/:VideoID", async (req, res) => {
  const api = req.params.api;
  const UserExists = await mongo.ApiKey.findOne({
    ApiKey: api,
  });
  if (!UserExists)
    return res.json({
      msg: `Wrong API Key`,
    });
  /*
  // checking of the IP address
  if (UserExists.IP != req.connection.remoteAddress)
    return res.json({
      msg: `Wrong IP Address used ${UserExists.IP} and ${req.connection.remoteAddress}`,
    });
*/
  // getting the fileID
  const CheckingvideoID = require('./videoID');
  var {
    FileID,
    lastID,
    err
  } = CheckingvideoID(__dirname + '/path/output/' + UserExists._id, UserExists.LastUsedID, UserExists.MaxRequests);
  if (err) return res.json({
    msg: err
  });
  // downloading the video
  var dl = new Downloader(UserExists._id);

  dl.getMP3({
      videoId: req.params.VideoID,
      name: FileID + '.mp3',
    },
    function (err, data) {
      if (err)
        return res.json({
          msg: `Error arrived when download video`,
        });
      return res.json({
        msg: `Found`,
        title: data.videoTitle,
        link: data.file,
      });
    });

  // update last id in the db
  mongo.ApiKey.findByIdAndUpdate(UserExists._id, {
    LastUsedID: lastID
  }, {
    upsert: true
  }, (err, doc) => {
    if (err) return res.json({
      msg: err
    });
  })
});



router.get("*", (req, res) => {
  return res.status(400).json({
    msg: `Wrong link`,
  });
});



module.exports = router;