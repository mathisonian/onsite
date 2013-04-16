exports.home = function(req, res) {
  res.render('index', {
      title: 'MY TITLE',
      description: 'MY PAGE DESCRIPTION',
      author: '@mpconlen'
  });
};
