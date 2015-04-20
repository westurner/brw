"use strict";

var links = ['https://westurner.org'];

var json_url = "tests/data/westurner-wikipaintings.list[str].json";

var link_list_max = 0;
var link_hist = [];

var store_link_hist = false;

var i = 0;
var main = function() {

  var main = $('#main')[0];
  var current = $("#current");
  var prev = $("#prev");
  var next = $("#next");

  var link_list_window = $("div#link_list_window");
  var link_list_toggle = $("button#link_list_toggle");

  link_list_toggle.bind("click", function(e) {
    link_list_window.toggle();
  });


  var update_link_list = function() {
    var link_list = $("ul#link_list");
    link_list.empty();
    var appendLink = function(_link) {
      var li = $('<li></li>');
      var a = $('<a/>', {
        href: '##' + _link,
        text: _link,
      });
      a.data({ i: __i }); // !!!
      a.bind("click", function(e) {
        var elem = $(e.srcElement);
        var link_i = elem.data('i');
        var url = links[link_i];
        update_url(url);
        i = link_i;
        link_list_window.hide();
        console.log(document.location);
      });
      li.append(a);
      link_list.append(li);
    }
    for (var __i = 0; __i < links.length; __i++) {
      appendLink(links[__i])
    }
  };

  var update_url = function(url) {
    console.log("update url to: " + url);
    //main.attr("src",url);
    //main.location = url;
    main.src = url;
    current.attr("href", url);
    current.text(url);
    window.location.hash = '##' + url;
    history.pushState({}, '', window.location.hash);
    if (store_link_hist) {
      link_hist.append(url);
    }
    if ($.inArray(url, links) == -1) {
      links.push(url);
      update_link_list();
    }
    $('#link_list a').removeClass('active');
    var elem = $('#link_list a[href="##' + url + '"]');
    if (elem) {
      i = elem.data('i');
      elem.addClass('active');
    }
  };

  var prev_link = function(e) {
    if (i >= 1) {
      i = i - 1;
    } else {
      i = links.length - 1;
    }
    update_url(links[i]);
  };
  prev.bind("click", prev_link);

  var next_link = function(e) {
    if (i < links.length- 1) {
      i = i + 1;
    } else {
      i = 0;
      console.log('this is the end.');
    }
    update_url(links[i]);
  };
  next.bind("click", next_link);

  $(window).on("popstate", function(e) {
    if (e.originalEvent.state !== null) {
      loadPage(location.href);
    }
  });

  var parseLocationHash = function(loc_hash) {
    if ((loc_hash.length > 2) && (loc_hash.substr(0,2) === '##')) {
      var loc_hash_url = loc_hash.substr(2);
      return loc_hash_url;
    }
    return false;
  }

  var loc_hash_url = parseLocationHash(window.location.hash);

  if (loc_hash_url != false) {
    update_url(loc_hash_url);
  } else {
    update_url(links[i]);
  };

  window.onhashchange = function(e) {
    // console.log(e); // e.newURL , e.oldURL
    var loc_hash_url = parseLocationHash(window.location.hash);
    if (loc_hash_url != false) {
      update_url(loc_hash_url);
    };
  };

  console.log(json_url);
  $.getJSON(json_url
  ).done(function(data, textStatus, xhr) {
    console.log('JSON data fetched');
    console.log(data);
    console.log(textStatus);
    console.log(xhr);
    $.each(data, function(key, val) { 
      // console.log("key: " + key);
      // console.log("val: " + val);
      links.push(val);
    });
    update_link_list(); // [ ... react, angular ... ]
  }).fail(function(xhr, textStatus, errorThrown) {
    //console.log(xhr);
    console.log(textStatus);
    //console.log(errorThrown);
  });
  console.log('here');
  update_link_list();


  var start = +(new Date);

  var carousel_on = false;
  $('#carousel_on').bind("click", function(e) {
    carousel_on = $(e.srcElement).prop("checked");
    console.log("click");
    console.log(carousel_on);
    console.log(e);
    start = +(new Date);
  });
  $('#carousel_on').prop("checked", carousel_on);

  var seconds_per_frame = 20;
  $('#seconds_per_frame').bind("change", function(e) {
    var elem = $(e.srcElement);
    var _value = parseInt(elem.prop("value"));
    if (_value < 10) {
      _value = 10;
      elem.prop("value", value);
    }
    seconds_per_frame = _value;
  });
  $('#seconds_per_frame').prop("value", seconds_per_frame);

  var time_display = $('#time_display');
  setInterval(function() {
    if (carousel_on) {
      var now = +(new Date);
      var seconds = Math.round((now - start)/1000);
      time_display.prop("value", seconds_per_frame - seconds);
      if (seconds > seconds_per_frame) {
        next_link();
        start = +(new Date);
      }
    }
  }, 1000);
};
$(document).ready(main);
