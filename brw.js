
/*
 * brw.js
 * Author: @westurner
 * License: MIT License
 *
 */

/* The jQuery plugin wrapping here is
 * copied/adapted/retabbed from jquery-boilerplate:
 * | Src: https://github.com/jquery-boilerplate/jquery-boilerplate/blob/v3.5.0/src/jquery.boilerplate.js
 * | License: MIT License
 */

;(function ( $, window, document, undefined ) {
  "use strict";

  var pluginName = "brw",
    options_defaults = {
      json_url: "./links.json",
      seconds_per_frame: 20,
      carousel_on_off: false,
      i: -1,

      store_link_hist: false,
      link_hist_max: 0,
      hide_link_list_on_select: true,
      link_hist: []
    };


  /**
    * BrwPlugin
    *
    * @param {element} element - A target DOM element
    * @param {Object} options - An options object
    */ 

  function BrwPlugin ( element, options ) {
    this.element = element;
    this.opts = $.extend( {}, options_defaults, options );
    this._opts_defaults = options_defaults;
    this._name = pluginName;
    return this.init();
  }

  // Avoid BrwPlugin.prototype conflicts
  $.extend(BrwPlugin.prototype, {

  /**
    * BrwPlugin.init
    *
    * @constructor
    * @return {this}
    */ 
    init: function () {
      var this__ = this;
      console.log("BrwPlugin.init");
      console.log(this.opts);

      this.data = {};
      this.elems = {};

      this.data.seconds_per_frame = this.opts.seconds_per_frame;

      this.data.json_url = this.opts.json_url;

      this.data.links = []; // ['/', 'about:blank'];

      this.data.store_link_hist = this.opts.store_link_hist;
      this.data.link_list_max = this.opts.link_hist_max;
      this.data.link_hist = this.opts.link_hist;

      this.data.i = this.opts.i; // initial i TODO

      this.data._dt = +(new Date);

      this.data.carousel_on_off = this.opts.carousel_on_off;

      this.elems.main = $('#main')[0];
      this.elems.current = $("#current");
      this.elems.prev = $("#prev");
      this.elems.next = $("#next");

      this.elems.carousel_on_off = $('#carousel_on_off');
      this.elems.seconds_per_frame = $('#seconds_per_frame');
      this.elems.time_display = $('#time_display');

      this.elems.link_list_window = $("div#link_list_window");
      this.elems.link_list_toggle = $("button#link_list_toggle");
      this.elems.link_list = $("ul#link_list");

      this.elems.link_list_window.css("display", "block");
      this.elems.link_list_window.css("visibility", "hidden");
      this.elems.link_list_toggle.bind("click", function(e) {
          if (this__.elems.link_list_window.css("visibility") == "hidden") {
            this__.elems.link_list_window.css("visibility", "visible");
          } else {
            this__.elems.link_list_window.css("visibility", "hidden");
          }
      });

      this.elems.prev.bind("click", function(e) {
	this__.prev_link();
      });
      this.elems.next.bind("click", function(e) {
	this__.next_link();
      });

      // back/forward
      $(window).on("popstate", function(e) {
	if (e.originalEvent.state !== null) {
	  this__.update_url(location.href);
	}
      });


      // onhashchage: update_url(parse(window.location.hash))
      window.onhashchange = function(e) {
	// console.log(e); // e.newURL , e.oldURL
	var loc_hash_url = this__.parseLocationHash(window.location.hash);
	if (loc_hash_url != false) {
	  this__.update_url(loc_hash_url);
	};
      };

      // on_init__update_url
      function on_init__update_url(this__) {
	// on_init: update_url(parse(window.location.hash))
	var loc_hash_url = this__.parseLocationHash(window.location.hash);

	if (loc_hash_url != false) {
	  console.log("there is a URL specified");
	  this__.update_url(loc_hash_url);
	//} else {
	//this.update_url(this.data.links[this.data.i]);
	};
      }


      // on_init: load_json(json_url)
      this.load_json(this.data.json_url, on_init__update_url);
      //// this.update_link_list(this.data.links);

      // carousel_on_off.on_click: toggle on/off and reset timer
      this.elems.carousel_on_off.bind("click", function(e) {
	this__.data.carousel_on_off = (
	  $(e.srcElement).prop("checked"));
	console.log("carousel_on_off.click");
	console.log(this__.data.carousel_on_off);
	console.log(e);
	this__.reset_timer();
      });
      this.elems.carousel_on_off.prop("checked",
	this.data.carousel_on_off);

      // seconds_per_frame.change: reset timer(t_seconds)
      this.elems.seconds_per_frame.bind("change", function(e) {
	var elem = $(e.srcElement);
	var t_seconds = parseInt(elem.prop("value"));
	if (t_seconds < 10) {
	  t_seconds = 10;
	  elem.prop("value", t_seconds);
	}
	this__.reset_timer(t_seconds);
      });

      // on_init: set_timer(seconds_per_frame)
      this.set_timer(this.data.seconds_per_frame);
      this.run(); // TODO: webworker compat
      return this;
    },


  /**
    * set_timer
    *
    * @param {number} t_seconds - Set timer to t_seconds | default
    *
    * @return {number} t_seconds 
    */
    set_timer: function(t_seconds) {
      console.log('.set_timer');
      console.log(t_seconds);
      if (t_seconds === undefined) {
	var t_seconds = this.data.seconds_per_frame;
	// TODO: this.data.seconds_per_frame = this.elems.seconds_per_frame.pop("value") // angular, react
      } else {
	this.data.seconds_per_frame = t_seconds;
      }
      this.elems.seconds_per_frame.prop("value",
	this.data.seconds_per_frame);
      return this.data.seconds_per_frame;
    },

  /**
    * reset_timer
    *
    * @param {number} t_seconds - Reset timer to t_seconds | default
    *
    * @return {number} t_seconds 
    */
    reset_timer: function(t_seconds) {
      console.log('.reset_timer');
      console.log(t_seconds);
      if (t_seconds === undefined) {
	var t_seconds = this.data.seconds_per_frame;
      }
      this.set_timer(t_seconds);
      this.data._dt = +(new Date);
      return t_seconds;
    },

  /**
    * set_time_display
    *
    * @param {number} t_seconds - Time in seconds to show
    */ 
    set_time_display: function (t_seconds) {
	this.elems.time_display.prop("value", t_seconds);
    },

  /**
    * run: start setInterval so that the type changes
    *
    * @param {number} run_interval_ms
    */ 
    run: function (run_interval_ms) {
      var this__ = this;
      var run_interval_ms = 1000;
      console.log('.run');
      setInterval(function() {
	if (this__.data.carousel_on_off) {
	  var now = +(new Date);
	  var t_elapsed_s = Math.round((now - this__.data._dt)/1000);
	  var newtime = this__.data.seconds_per_frame - t_elapsed_s;
	  this__.set_time_display(t_elapsed_s);
	  if (t_elapsed_s > this__.data.seconds_per_frame) {
	    this__.next_link();
	    this__.reset_timer();
	  }
	}
      }, run_interval_ms);
    },

  /**
    * parseLocationHash (e.g. window.location.
    *
    * @return {{string|false}} url_string|bool ~= '^.*##(.*)$'
    */
    parseLocationHash: function(loc_hash) {
      if ((loc_hash.length > 2) && (loc_hash.substr(0,2) === '##')) {
	var loc_hash_url = loc_hash.substr(2);
	return loc_hash_url;
      }
      return false;
    },

  /**
    * load_json: load JSON from a URL (with $.getJSON)
    *
    * @param {string} json_url - URL to a JSON string
    * @param {function} success_callback - a callback function for .getJSON.don
    * @return { }
    */
    load_json: function(json_url, success_callback) {
      var this__ = this;
      var conf = {}

      if (!(json_url)) {
	json_url = this.data.json_url;
      }
      conf.json_url = json_url;

      console.log('.load_json.conf');
      console.log(conf);

      var result = {};
      ($.getJSON(json_url)
	.done(function(data, textStatus, xhr) {
	  result.data = data;
	  result.textStatus = textStatus;
	  result.xhr = xhr;
	  console.log('.load_json.getJSON.done');
	  console.log(result);
	  $.each(result.data, function(key, val) { 
	    // console.log("key: " + key);
	    // console.log("val: " + val);
	    this__.data.links.push(val);
	  });
	  this__.update_link_list(this__.links);

	  if (success_callback) {
	     success_callback(this__);
	  }
	  // [ ... react, angular ... ]
	})
	.fail(function(xhr, textStatus, errorThrown) {
	  result.xhr = xhr;
	  result.textStatus = textStatus;
	  result.errorThrown = errorThrown;
	  console.log('.load_json.getJSON.fail');
	  console.log(result);
	  //console.log(errorThrown);
	})
      );
    },

  /**
    * list_max
    *
    * @param {Object[]} objs - List of objects
    * @param {string} key - Name of a number attr to get the max of
    *
    * @return {Object} data - {max: n, max_obj: Object}
    */ 
    list_minmax: function(objs, key) {
      if (objs === undefined) {
	var objs = self.data.links;
      }
      if (key === undefined) {
	var key = 'i';
      }
      var data = {};
      var _len = data.len = iterable.length;
      var max = 0;
      var max_obj = undefined;
      //var min = undefined; //
      //var min_obj = undefined;
      var obj, val;
      for (var i=0; i < _len; i++) {
	obj = objs[i];
	val = obj[key];
	if (val > max) {
	  max = val;
	  max_obj = obj;	
	}
	//if (val < min) {
	//  min = val;
	//  min_obj = obj;
	//}
      }
      data.max = max;
      data.max_obj = max_obj;
      //data.min = min;
      //data.min_obj = min_obj;
      return data;
    },

  /**
    * append_link
    *
    * @param {string} _link the link to append
    * @param {number} _i (optional) index key
    *
    * @return {elem} li <li><a href>link</a></li> w/ on_click  
    */
    append_link: function(_link, _i) {
      var this__ = this;
      var a = $('<a/>', {
	href: '##' + _link,
	text: _link,
      });
      var i_next = undefined;
      if (_i === undefined) {
	// i_next = this.data.links.length (wrong! because sparsity)
	//
	// TODO: instead, maintain count
	//
	i_next = this.list_max(this.data.links).max + 1;
	//
      } else {
	i_next = _i;
      }
      a.data({ i: i_next }); // !!! max(this.elems.link_list.length) TODO
      a.bind("click", function(e) {
	var elem = $(e.srcElement);
	var link_i = elem.data('i');
	var url = this__.links[link_i];
	this__.i = link_i;
	this__.update_url(url);

	if (this__.opts.hide_link_list_on_select) { // TODO: this.data
    this__.elems.link_list_toggle.css("visibility", "hidden");
	}

	console.log(document.location);
      });

      var li = $('<li></li>');
      li.append(a);
      this.elems.link_list.append(li);
      return li;
    },


  /** scroll_to_link - scroll to a link in link_list
    * @param {string} url - url to scroll to first instance of
    *
    */
    scroll_to_link: function(url) {
      console.log("scroll_to_link: " + url);
      var elem_selector = 'a[href="##' + url + '"]'; // TODO
      var elem = $('ul#link_list').find(elem_selector);
      var output = $('div#link_list_window').scrollTo(elem, 0,
                                                      // TODO: cache div ref
        {
         margin: true,
         limit: false}
      );
      console.log(output);
      return elem;
    },

  /**
    * update_link_list - reset and rebuild this.elems.link_list
    *
    * @param {string[]} links - Links to overwrite the link_list w/ TODO
    *
    * @return {string[]} this.data.links - this.data.links
    */
    update_link_list: function(links) {
      this.elems.link_list.empty(); // react, angular
      for (var i = 0; i < this.data.links.length; i++) {
	this.append_link(this.data.links[i], i);
      }
      return this.data.links;
    },

  /**
    * update_url - browse to a URL
    *
    * @param {string} url - URL to browse to
    *
    * @return {string[]} this.data.links - this.data.links
    */
    update_url: function(url) {
      console.log("brw.update_url: " + url);
      //main.attr("src",url);
      //main.location = url;
      this.elems.main.src = url;
      this.elems.current.attr("href", url);
      this.elems.current.text(url);

      // update the URL bar
      window.location.hash = '##' + url;
      // append to history (for back/forward)
      history.pushState({}, '', window.location.hash);

      // append actual link hist to this.data.list_hist
      // if this.opts.store_link_host
      if (this.opts.store_link_hist) {
	this.data.link_hist.append(url);
      }
      // if the url is not already in this.data.links, append and update
      if ($.inArray(url, this.data.links) == -1) {
	this.data.links.push(url);
	//this.append_link(url);
	this.update_link_list(this.data.links);
      }

      // update the link styling
      // TODO FIXE: this.elems.link_list.FIND('a')
      this.elems.link_list.find('a').removeClass('active');
      // $('#link_list a').removeClass('active');
      var elem_selector = 'a[href="##' + url + '"]';
      var elem = this.elems.link_list.find(elem_selector);
      //var elem = $('#link_list a[href="##' + url + '"]');
      console.log("ELEM:");
      console.log(elem);
      if (elem) {
	this.data.i = elem.data('i');
	console.log("i:");
	console.log(this.data.i);
	elem.addClass('active');
        this.scroll_to_link(url);
      }
    },

  /**
    * prev_link - go to the previous link and wrap around
    *
    * @param {TODO} e - 
    * @param {boolean} wrap - If true, wrap at the edges.
    *
    * @return
    */
    prev_link: function(e) {
      if (!(this.data.links.length)) {
	console.log("no links");
	return;
      }
      if (this.data.i >= 1) {
	this.data.i -= 1;
      } else {
	this.data.i = this.data.links.length - 1;
	console.log('this is the beginning.');
	//alert();
      }
      this.update_url(this.data.links[this.data.i]);
      this.reset_timer();
    },

  /**
    * next_link - go to the next link and wrap around
    *
    * @param {TODO} e - 
    * @param {boolean} wrap - If true, wrap at the edges.
    *
    * @return
    */
    next_link: function(e) {
      console.log(this.data.links);
      if (!(this.data.links.length)) {
	console.log("no links");
	return;
      }
      if (this.data.i < this.data.links.length - 1) {
	this.data.i = this.data.i + 1;
      } else {
	this.data.i = 0;
	console.log('this is the end.');
      }
      this.update_url(this.data.links[this.data.i]);
      this.reset_timer();
    },


  });

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[ pluginName ] = function ( options ) {
    return this.each(function() {
      if ( !$.data( this, "plugin_" + pluginName ) ) {
	$.data( this, "plugin_" + pluginName, new BrwPlugin( this, options ) );
	return $.data( this, "plugin_" + pluginName );
      }
    });
  };

})( jQuery, window, document );

