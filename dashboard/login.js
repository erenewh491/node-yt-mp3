const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const mongo = require("../mongo");
const fs = require("fs");
const {
    cpus
} = require("os");

const jwt = require("jsonwebtoken");
const UserAuth = require("./verify");
router
    .get("/", (req, res) => {
        res.render("Login", {
            LoggedIn: false,
            Title: "User Login",
        });
    })
    .post("/", async (req, res) => {
        var pass = req.body.pass;
        const UserExists = await mongo.ApiKey.findOne({
            Email: req.body.user,
        });
        if (!UserExists || !(await bcrypt.compare(pass, UserExists.Password)))
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
        res.cookie("UserAuthToken", token, {
            maxAge: 15 * 60 * 1000,
            expires: false,
            httpOnly: true,
        });
        res.cookie("UserExists", UserExists._id, {
            maxAge: 15 * 60 * 1000,
            expires: false,
            httpOnly: true,
        });

        return res.redirect("/dashboard");
    })
    .get("/dashboard", UserAuth, async (req, res) => {
        var cookie = req.cookies.UserExists;
        if (!cookie) return res.redirect("/");
        const UserExists = await mongo.ApiKey.findOne({
            _id: cookie,
        });
        if (!UserExists) return res.redirect("/");
        const path = "./api/path/output/" + UserExists._id;
        const RequestExists = fs.existsSync(path);
        var members = [];
        if (RequestExists) {
            const dir = fs.readdirSync(path);
            dir.forEach((file) => {
                members.push({
                    file,
                    Path: "/api/path/output/" + UserExists._id + "/",
                });
            });
        }
        return res.render("dashboard", {
            Name: UserExists.Name,
            Email: UserExists.Email,
            IP: UserExists.IP,
            ApiKey: UserExists.ApiKey,
            MaxReq: UserExists.MaxRequests,
            ReqExists: members.length === 0 ? false : true,
            members: members,
        });
    })
    .get("/dashboard/ChangePass", UserAuth, async (req, res) => {
        res.render("ChangePass", {
            NoToken: true,
        });
    })
    .post("/dashboard/ChangePass", UserAuth, async (req, res) => {
        if (req.body.pass !== req.body.confirmpass)
            return res.render("ChangePass", {
                Err: `New password didn't match`,
                NoToken: req.body.NoToken,
            });
        if (req.body.NoToken) {
            const OldPass = req.body.OldPass;
            var cookie = req.cookies.UserExists;
            if (!cookie) return res.redirect("/");

            const UserExists = await mongo.ApiKey.findOne({
                _id: cookie,
            });
            if (!UserExists) return res.redirect("/");
            const match = await bcrypt.compare(OldPass, UserExists.Password);
            if (!match) return res.render('ChangePass', {
                NoToken: true,
                Err: `Wrong Old Password entered`
            });
        }
        const PlainPass = req.body.pass;
        const newPass = bcrypt.hashSync(PlainPass, 10);
        mongo.ApiKey.findOneAndUpdate({
                _id: req.cookies.UserExists,
            }, {
                Password: newPass,
            },
            async (err, doc) => {
                if (err)
                    return res.render("ChangePass", {
                        Err: `Failed to change pass, database error`,
                        NoToken: true,
                    });
                return res.render("ChangePass", {
                    Scs: `Password changed`,
                    NoToken: true,
                });
            }
        );
        return;
    });
module.exports = router;