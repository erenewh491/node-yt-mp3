const fs = require('fs');


module.exports = function (path, lastID, maxID) {
    // if !directory exists = create a new one
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, {
            recursive: true
        });
        return {
            FileID: 1,
            lastID: 1
        };
    }
    var Contents = 0;
    const dir = fs.readdirSync(path);
    dir.forEach((file) => {
        Contents += 1;
    });
    if (Contents < maxID) {
        Contents += 1;
        return {
            FileID: Contents,
            lastID: Contents
        };
    } else {
        lastID += 1;
        if (lastID > maxID) {
            lastID = 1;
        }
        Contents = lastID;

        if (fs.existsSync(path + '/' + Contents + '.mp3')) {
            path += '/' + Contents + '.mp3';
            try {
                const Done = fs.unlinkSync(path);
                return {
                    FileID: Contents,
                    lastID: Contents
                };
            } catch (err) {
                return {
                    err: `Resource is locked at the moment`
                };
            }
        }
    }
};