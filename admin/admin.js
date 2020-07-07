//router
const express = require("express");
const router = express.Router();

// db
const mongo = require("../mongo");

// uuid and jwt
const uuidAPKey = require("uuid-apikey");
const jwt = require("jsonwebtoken");

//middlewares
const Authorize = require("./verify");


// password hashings
const bcrypt = require("bcrypt");
const crypto = require("crypto");


//registering object filter func
Object.filter = (arr, tosearch, key) => {
    var matches = [],
        i;
    for (i = arr.length; i--;) {
        if (arr[i].hasOwnProperty(key) && arr[i][key] === tosearch)
            matches.push(arr[i]);
    }
    return matches;
};

Object.Search = (arr, tosearch, key) => {
    var matches = [],
        i;
    for (i = arr.length; i--;) {
        if (arr[i].hasOwnProperty(key) && arr[i][key].indexOf(tosearch) > -1)
            matches.push(arr[i]);
    }
    return matches;
};

// login


router
    .get("/", async (req, res) => {
        res.render("Login", {
            LoggedIn: false,
        });
    })
    .post("/", async (req, res) => {
        const members = await mongo.ApiKey.find({}).lean();
        if (!req.user) {
            var pass = req.body.pass;
            const UserExists = await mongo.Auth.findOne({
                Username: req.body.user,
            });
            if (!UserExists || !(pass === UserExists.Password))
                return res.render("Login", {
                    Err: `Wrong credentials`,
                    Username: req.body.user,
                });
            const token = jwt.sign({
                    id: UserExists._id,
                    IP: req.socket.remoteAddress,
                },
                process.env.SECRET_TOKEN
            );
            res.cookie("authToken", token, {
                maxAge: 15 * 60 * 1000,
                expires: false,
                httpOnly: true,
            });
            return res.redirect("/adminpanel/dashboard/");
        }
    })

    // dashboard

    .get("/dashboard", Authorize, async (req, res) => {
        res.render("Admin", {
            Name: "test",
            Email: "test@test.com",
            IP: "::1",
            MaxReq: "15",
            members: await mongo.ApiKey.find({}).lean(),
        });
    })
    .post("/dashboard", Authorize, async (req, res) => {
        const FormName = req.body.FormName.toLowerCase();
        if (FormName == "add") {
            // check if email exists
            const EmailExists = await mongo.ApiKey.findOne({
                Email: req.body.email,
            });
            if (EmailExists)
                return res.render("Admin", {
                    Err: `Email already exists`,
                    Name: req.body.name,
                    Email: req.body.email,
                    IP: req.body.ip,
                    MaxReq: req.body.MaxReq,
                    members: await mongo.ApiKey.find({}).lean(),
                });
            //check if IP exists
            const IPExists = await mongo.ApiKey.findOne({
                IP: req.body.ip,
            });
            if (IPExists)
                return res.render("Admin", {
                    Err: `IP already exists`,
                    Name: req.body.name,
                    Email: req.body.email,
                    IP: req.body.ip,
                    MaxReq: req.body.MaxReq,
                    members: await mongo.ApiKey.find({}).lean(),
                });

            // check if the Max Requests is valid
            if (parseInt(req.body.MaxReq) <= 0)
                return res.render("Admin", {
                    Err: `Max Request should be greater than 0`,
                    Name: req.body.name,
                    Email: req.body.email,
                    IP: req.body.ip,
                    MaxReq: req.body.MaxReq,
                    members: await mongo.ApiKey.find({}).lean(),
                });

            // creating a random password
            const PlainPass = crypto.randomBytes(5).toString("hex").slice(0, 5);
            var Pass = bcrypt.hashSync(PlainPass, 10);
            // save a new entry
            var newData = new mongo.ApiKey({
                Name: req.body.name.toLowerCase(),
                Email: req.body.email.toLowerCase(),
                Password: Pass,
                IP: req.body.ip,
                ApiKey: uuidAPKey.create().apiKey,
                MaxRequests: req.body.MaxReq,
            });
            const members = newData.save(async (err, room) => {
                if (err)
                    return res.render("Admin", {
                        Err: `Failed to save in Database`,
                        Name: req.body.name,
                        Email: req.body.email,
                        IP: req.body.ip,
                        MaxReq: req.body.MaxReq,
                        members: await mongo.ApiKey.find({}).lean(),
                    });
                // reload the page

                return res.render("Admin", {
                    Scs: `Password: ${PlainPass}`,
                    members: await mongo.ApiKey.find({}).lean(),
                });
            });
            return;
        }
        if (FormName == "delete") {
            // Deleting API

            // check if email exists
            const EmailExists = await mongo.ApiKey.findOne({
                Email: req.body.delEmail,
            });
            if (EmailExists) {
                mongo.ApiKey.deleteOne({
                    Email: req.body.delEmail,
                }, async (err) => {
                    if (err)
                        return res.render("Admin", {
                            delErr: `Unable to Delete from Email`,
                            delEmail: req.body.delEmail,
                            delIP: req.body.delip,
                            members: await mongo.ApiKey.find({}).lean(),
                        });
                    return res.render("Admin", {
                        delScs: `Deleted Api from the Email`,
                        delEmail: req.body.delEmail,
                        delIP: req.body.delip,
                        members: await mongo.ApiKey.find({}).lean(),
                    });
                });
                return;

            }
            //check if IP exists
            const IPExists = await mongo.ApiKey.findOne({
                IP: req.body.delip,
            });
            if (IPExists) {
                mongo.ApiKey.deleteOne({
                    IP: req.body.delip,
                }, async (err) => {
                    if (err)
                        return res.render("Admin", {
                            delErr: `Unable to Delete from IP`,
                            delEmail: req.body.delEmail,
                            delIP: req.body.delip,
                            members: await mongo.ApiKey.find({}).lean(),
                        });
                    return res.render("Admin", {
                        delScs: `Deleted Api from the IP`,
                        delEmail: req.body.delEmail,
                        delIP: req.body.delip,
                        members: await mongo.ApiKey.find({}).lean(),
                    });
                });
                return;

            }
            return res.render("Admin", {
                delErr: `No entries found`,
                Email: req.body.delEmail,
                IP: req.body.delip,
                members: await mongo.ApiKey.find({}).lean(),
            });
        }
        if (FormName == 'update') {
            //updating the data



            // check if the Max Requests is valid
            if (parseInt(req.body.upMaxReq) <= 0)
                return res.render("Admin", {
                    upErr: `Max Request should be greater than 0`,
                    upEmail: req.body.upEmail,
                    upIP: req.body.upip,
                    upMaxReq: req.body.upMaxReq,
                    members: await mongo.ApiKey.find({}).lean(),
                });


            // check if email exists
            const EmailExists = await mongo.ApiKey.findOne({
                Email: req.body.upEmail,
            });
            if (EmailExists) {
                mongo.ApiKey.findOneAndUpdate({
                    Email: req.body.upEmail,
                }, {
                    MaxRequests: parseInt(req.body.upMaxReq),
                }, async (err, doc) => {
                    if (err)
                        return res.render("Admin", {
                            upErr: `Unable to update from Email`,
                            upEmail: req.body.upEmail,
                            upIP: req.body.upip,
                            upMaxReq: req.body.upMaxReq,
                            members: await mongo.ApiKey.find({}).lean(),
                        });
                    return res.render("Admin", {
                        upScs: `Updated Api from the Email`,
                        upEmail: req.body.upEmail,
                        upIP: req.body.upip,
                        upMaxReq: req.body.upMaxReq,
                        members: await mongo.ApiKey.find({}).lean(),

                    });
                });
                return;
            }
            //check if IP exists
            const IPExists = await mongo.ApiKey.findOne({
                IP: req.body.upip,
            });
            if (IPExists) {
                mongo.ApiKey.findOneAndUpdate({
                    IP: req.body.upip,
                }, {
                    MaxRequests: parseInt(req.body.upMaxReq),
                }, async (err, doc) => {
                    if (err)
                        return res.render("Admin", {
                            upErr: `Unable to update from IP ${err}`,
                            upEmail: req.body.upEmail,
                            upIP: req.body.upip,
                            upMaxReq: req.body.upMaxReq,
                            members: await mongo.ApiKey.find({}).lean(),
                        });
                    return res.render("Admin", {
                        upScs: `Updated Api from the IP`,
                        upEmail: req.body.upEmail,
                        upIP: req.body.upip,
                        upMaxReq: req.body.upMaxReq,
                        members: await mongo.ApiKey.find({}).lean(),
                    });
                })
                return;
            }
            // returning if not found
            return res.render("Admin", {
                upErr: `No entries found`,
                upEmail: req.body.upEmail,
                upIP: req.body.upip,
                upMaxReq: req.body.upMaxReq,
                members: await mongo.ApiKey.find({}).lean(),
            });
        }
        return res.redirect('error');
    })
    .get('/dashboard/search/', Authorize, async (req, res) => {
        res.render('Search');
    })
    .post('/dashboard/search', Authorize, async (req, res) => {
        var members = await mongo.ApiKey.find({}).lean();
        const Exact = req.body.Exact && req.body.Exact === "on";
        var filtered;
        if (Exact === true)
            filtered = Object.filter(members, req.body.value, req.body.option);
        else
            filtered = Object.Search(members, req.body.value, req.body.option);
        if (filtered.length === 0)
            return res.render('Search', {
                Err: `No entry found`,
                value: req.body.value
            });
        else return res.render('Search', {
            Found: true,
            members: filtered,
        });
    })
    .get('/SetPass/:id', Authorize, async (req, res) => {
        const UserExists = await mongo.ApiKey.findOne({
            _id: req.params.id,
        });
        if (!UserExists)
            return res.redirect('back');
        return res.render('ChangePass', {
            Title: `Change ${UserExists.Name}'s Password`
        })
    })
    .post('/SetPass/:id', Authorize, async (req, res) => {
        const UserExists = await mongo.ApiKey.findOne({
            _id: req.params.id,
        });
        if (!UserExists)
            return res.redirect('back');
        if (req.body.pass !== req.body.confirmpass)
            return res.render("ChangePass", {
                Title: `Change ${UserExists.Name}'s Password`,
                Err: `New password didn't match`,
            });
        const PlainPass = req.body.pass;
        const newPass = bcrypt.hashSync(PlainPass, 10);
        mongo.ApiKey.findOneAndUpdate({
                _id: req.params.id,
            }, {
                Password: newPass,
            },
            async (err, doc) => {
                if (err)
                    return res.render("ChangePass", {
                        Title: `Change ${UserExists.Name}'s Password`,
                        Err: `Failed to change pass, database error`,
                    });
                return res.render("ChangePass", {
                    Title: `Change ${UserExists.Name}'s Password`,
                    Scs: `Password changed to ${PlainPass}`,
                });
            }
        );
        return;
    })
//export
module.exports = router;