var _ = {
  each: function (obj, iterator) {
    if (Array.isArray(obj)) {
      for (var i = 0; i < obj.length; i++) iterator(obj[i], i);
    } else {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) iterator(obj[key], key);
      }
    }
  },
  map: function (obj, iterator) {
    var result = [];
    _.each(obj, function (value, index) {
      result.push(iterator(value, index));
    });
    return result;
  }
};
