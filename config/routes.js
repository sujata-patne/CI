/**
* Created by sujata.patne on 7/7/2015.
*/
module.exports = function (app) {
    require('../routes/index')(app);
    require('../routes/user')(app);
    require('../routes/vendor')(app);
    require('../routes/property')(app);
    require('../routes/contentfile')(app);
    require('../routes/contentcatalog')(app);
    require('../routes/metadata')(app);
    require('../routes/contentcatalog')(app);
    require('../routes/contentfile')(app);
    require('../routes/adminlog')(app);
    require('../routes/masterlist')(app);
    require('../routes/excel')(app);
    require('../routes/handsetgroup')(app);
    require('../routes/dailyactivity')(app);
    require('../routes/bulkupload')(app);

    app.use('/*', function (req, res, next) {
        res.status(404).json({ "error": "No such service present" });
    })

    app.use('*', function (req, res, next) {
        res.status(404).send('<html><body><h1>404 Page Not Found</h1></body></html>');
    })
}
