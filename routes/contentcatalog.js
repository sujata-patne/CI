

var contentcatalog = require('../controller/contentcatalog.controller');
module.exports = function (app) {
    app.route('/*')
        .all(contentcatalog.allAction);
    app.route('/getcontentcatalog')
      .post(contentcatalog.getcontentcatalog);
    app.route('/getcontentlisting')
      .post(contentcatalog.getcontentlisting);
    app.route('/updatestate')
      .post(contentcatalog.updatestate);
    app.route('/getPersonalizedDataForVcode')
        .post(contentcatalog.getPersonalizedDataForVcode);
    app.route('/importVcode')
        .post(contentcatalog.importVcode);
    app.route('/importPromocode')
        .post(contentcatalog.importPromocode);
    app.route('/addUpdateVcode')
        .post(contentcatalog.addUpdateVcode)
    app.route('/addUpdatePromocode')
        .post(contentcatalog.addUpdatePromocode)
}