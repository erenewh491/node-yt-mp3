const jwt = require('jsonwebtoken');

async function Auth(req, res, next) {

    var cookie = req.cookies.authToken;
    if (!cookie) {
        return res.redirect('/adminpanel/');
    }

    jwt.verify(cookie, process.env.SECRET_TOKEN, (err, user) => {
        if (err) return res.redirect('/adminpanel/');
        // validating cookie
        if (user.IP != req.socket.remoteAddress) return res.redirect('/adminpanel/');
        next();

    });
}

module.exports = Auth;