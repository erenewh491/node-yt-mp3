const jwt = require('jsonwebtoken');

async function Auth(req, res, next) {

    var cookie = req.cookies.UserAuthToken;
    if (!cookie) {
        return res.redirect('/');
    }

    jwt.verify(cookie, process.env.SECRET_TOKEN, (err, user) => {
        if (err) return res.redirect('/');
        // validating cookie
        if (user.IP != req.socket.remoteAddress) return res.redirect('/');
        next();

    });
}

module.exports = Auth;