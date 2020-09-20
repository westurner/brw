

/*
 * ThingSequence
 *
 * carousel
 * - timer
 * - (on/off)
 * - next/prev
 * - 
 *
 * TODO:
 * - REF: update location
 * - REF: append link on location change?
 * - ENH: loadJSON / loadJSON_linklist UI elements
 *   - thingList_window
 *   <input type="text" name="jsonLoad">
 *   <select>
 *    <option>load</option>
 *    <option>append</option>
 *   </select>
 *   <button
 *    onClick={() => { this.loadJSON(url, append) }
 *   >go</button>
 *  - BUG: #!  --> TST:
 *  - BUG: ##  --> TST
 *  - TST: automate tests
 */

// var update = require('react-addons-update');
// import React, {Component, PropTypes} from 'react';

class ThingCarousel extends React.Component {
  constructor () {
    console.group();
    console.log('m:ThingCarousel:constructor');
    super();
    this.state = {
      secondsPerThing: 20,
      secondsElapsed: 0,
      carouselOn: false,

      jsonUrl: undefined, // 'links.json',
      jsonUrlList: [],

      current_i: undefined,
      current: {},
      things: []
    };
    console.log(this.state);
    console.groupEnd();
  }

  reset = () => {
    this.setState({secondsElapsed: 0});
    this._dt = +(new Date);
  }

  start = () => {
    this._dt = +(new Date);
  }

  tick = () => {
    if (this.state.carouselOn === true) {
      var now = +(new Date);
      var t_elapsed_s = Math.round((now - this._dt)/1000);
      this._dt = now;
      this.setState({
        secondsElapsed: this.state.secondsElapsed + t_elapsed_s});
      if (this.state.secondsElapsed > this.state.secondsPerThing) {
        this.next();
      }
    }
  };

  parseLocationHash(loc_hash) {
    console.log('m:parseLocationHash');
    console.log(loc_hash);
    var routes = [];
    var lastRoutes = [];
    if (loc_hash.length > 2) {
      var parts = loc_hash.split(';;');
      for (var i=0; i < parts.length; i++) {
        var part = parts[i];
        if (part.substr(0,2) === '##') {
          var route = {};
          route.name = 'thinglink';
          route.url = part.substr(2);
          route.origUrl = loc_hash;
          routes.push(route);
        } else if (part.substr(0,2) === '#+') {
          var route = {};
          route.name = 'jsonlink:append';
          route.url = part.substr(2);
          route.origUrl = loc_hash;
          routes.push(route);
        } else if (part.substr(0,2) === '#!') {
          var route = {};
          route.name = 'jsonlink';
          route.url = part.substr(2);
          route.origUrl = loc_hash;
          routes.push(route);
        } else if (part.substr(0,2) === '#=') {
          var route = {};
          route.name = 'jsonlink:appendMaybe';
          route.url = part.substr(2);
          route.origUrl = loc_hash;
          routes.push(route);
        } else if (part.substr(0,2) === '#{') {
          console.log("JSON.parse", part.substr(1));
          urldata = JSON.parse(part.substr(1));
          console.log(urldata);
        } else if (part.substr(0,2) === '#?') {
          var urlParams = new URLSearchParams(part.substr(2));
          var params = Object.fromEntries(urlParams);
          console.log("params", params);
          if ("url" in params) {
            var route = {};
            route.name = 'jsonlink:appendMaybe';
            route.url = params["url"];
            route.origUrl = loc_hash;
            routes.push(route);
          }
          for (const key of ["fullscreen", "play", "urls"]) {
            if (key in params) {
              params[key] = JSON.parse(params[key]);
              if (key === "urls") {
                for (const url of params[key]) {
                  var route = {};
                  route.name = 'jsonlink:appendMaybe';
                  route.url = url;
                  route.origUrl = loc_hash;
                  routes.push(route);
                }
              } else if (key === "fullscreen") {
                var route = {};
                route.name = 'fullscreen';
                route.value = new Boolean(params[key]).valueOf(); // TODO: handle Boolean("this is true") == true
                lastRoutes.push(route);
              } else if (key === "play") {
                var route = {};
                route.name = 'play';
                route.value = new Boolean(params[key]).valueOf();
                lastRoutes.push(route);
              }
            }
          }
          console.log("parsedParams", params);
        }
      }
      for (var i=0; i < lastRoutes.length; i++) {
        console.log("append lastRoute", lastRoutes[i]);
        routes.push(lastRoutes[i]);
      }
    }
    return routes;
  }

  handleRoutes = (hash_url) => {
    console.group();
    console.log("m:handleRoutes");
    console.log(hash_url);
    var routes = this.parseLocationHash(hash_url);
    console.log('handleRoutes>');
    console.log(routes);
    var firstThinglinkItem = undefined;
    for (var i = 0; i < routes.length; i++) {
      var route = routes[i];
      console.log('handleRoute>');
      console.log(route);
      if (route.name === undefined) {
        continue;
      }
      if (route.name === 'thinglink') {
        if (route.url !== undefined) {
          var item = {url: route.url}; // TODO FIXME
          if (firstThinglinkItem === undefined) {
            firstThinglinkItem = item;
          }
          //this.setUrl(item);
        }
      } else if (route.name.substr(0,8) === 'jsonlink') {
        if (route.url !== undefined) {
          this.setState({jsonUrl: route.url});
          this.setWindowLocationHash(
            {jsonUrl: this.state.jsonUrl,
              jsonUrlList: this.state.jsonUrlList},
            null,
            '#' //route.origUrl // TODO: 
          );
          var append = false;
          if (route.name === 'jsonlink:append') {
            append = true;
          } else if (route.name === 'jsonlink:appendMaybe') {
            append = '=';
          }
          this.loadJSON_linklist(route.url, append,
                                this.handleLoadJSONSuccess.bind(!append));
        }
      } else if (route.name === 'fullscreen') {
        console.log("route.name", "fullscreen");
        this.handleIframeFullscreen({}, route.value);
      } else if (route.name === 'play') {
        console.log("route.name", "play");
        this.handleOnOffClick({}, route.value);
      } else {
        console.log("ERROR: unknown route", route);
      }
    }
    if (firstThinglinkItem !== undefined) {
      console.log("firstThinglinkItem");
      this.setUrl(firstThinglinkItem);
    }
    console.groupEnd();
    return routes;
  }

  componentDidMount = () => {
    console.group();
    var this__ = this;

    this.reset();
    this.interval = setInterval(this.tick, 1000);

    // back/forward
    $(window).on("popstate", (e) => {
      console.group();
      console.log('m:popstate');
      console.log(e);
      if (e.originalEvent.state !== null) {
        var state = e.originalEvent.state;
        console.log('popstate!');
        console.log(state);
        // this.handleRoutes(window.location.hash);
        this.setUrl(state.item, state.i);
      }
      console.groupEnd();
    });

    $(window).on("hashchange", (e) => {
      // console.log(e); // e.newURL , e.oldURL
      console.group();
      console.log("m:onhashchange");
      console.log(e);
      console.log(this._in_setUrl_);
      console.trace();
      //if (e.newURL === e.oldURL) {
      //  console.log('e.newURL === e.oldURL');
      //  return
      //}
      //e.preventDefault();
      if (this._in_setUrl_ === true) {
        this._in_setUrl_ = false;
      } else {
        this.handleRoutes(window.location.hash);
      }
      console.groupEnd();
    });

    var routes = this.handleRoutes(window.location.hash);

    if (routes.length !== 0) {
        if (this.state.jsonUrl !== undefined) {
        var append = true;
        this.loadJSON_linklist(this.state.jsonUrl, append,
                                this.handleLoadJSONSuccess.bind(!append));
        }
    }
    console.groupEnd();
  }

  handleLoadJSONSuccess = (loadNextItem) => {
    console.group();
    console.log('m:handleLoadJSONSuccess');
    var routes = this.handleRoutes(window.location.hash);
    console.log(routes);
    if ((this.state.current_i === undefined) || (loadNextItem === true)) {
      if (this.state.current_i === undefined) {
        console.log('default next()');
      }
      if (loadNextItem === true) {
        console.log('loadNextItem');
      }
      this.next();
    }
    console.groupEnd();
  }

  componentWillUnmount = () => {
    clearInterval(this.interval);
  }

  findUrl = (item) => {
    console.log('m:findUrl');
    console.log(item);
    for (var i = 0; i < this.state.things.length; i++) {
      if (item.url == this.state.things[i].url) {
        return i;
      }
    }
    return -1;
  }

  setUrl = (item, i) => {
    console.group();
    console.log("m:setUrl");
    console.log(item);
    console.log(this.state.current);
    console.log(i);
    if (item === undefined) {
      return false
    }
    if (i === undefined) {
      i = this.findUrl(item); // TODO: this finds the first instance //
      if (i === -1) {
        console.log('item not found in self.state.things');
        console.log(item);
        i = 0;
        this.setState({things:
          React.addons.update(this.state.things,
            {'$unshift': [item]}), // TODO: splice?
              current_i: i
            });
      }
    }
    console.log(i);
    console.log("setUrl!");
    console.log(item);

    // var updateObj = new Map();
    //if (this.state.current_i !== undefined) {
    //  updateObj[this.state.current_i] = {};
    //  updateObj[this.state.current_i]['cssClass'] = {'$set': ''};
    //}
    var things = React.addons.update(this.state.things, {
      '$apply': (x) => { return x.map((y) => { y.cssClass=''; return y; })}});

    item.cssClass = 'active';
    var updateObj = {};
    //updateObj[i] = {$set: item};
    updateObj[i] = {'cssClass': {$set: 'active'}};
    console.log(updateObj);
    this.setState({
      things: React.addons.update(things, updateObj),
      current: item,
      current_i: i});
    var elem = $('ul#thingList').find('a#thing-' + i).first()
    this.scrollToLink(elem);
    this._in_setUrl_ = true;
    this.setWindowLocationHash(
      {'item': item, 'i': i}, null, '##' + item.url);
    this._in_setUrl_ = false; // TODO: race condition w/ onhashchange evt?
    console.groupEnd();
  }

  setWindowLocationHash(state, title, url) {
    console.group();
    console.log('m:setWindowLocationHash');
    console.log(url);
    console.trace();
    if (history.pushState) {
      window.history.pushState(state, title, url);
    } else {
      window.location.hash = url;
    }
    console.groupEnd();
  }

  handleOnOffClick = (elem, forceStatus) => {
    if (forceStatus !== null) {
      this.state.carouselOn = forceStatus;
    } else {
      if (this.state.carouselOn === false) {
        this.state.carouselOn = true;
      } else {
        this.state.carouselOn = false;
      }
    }
    console.log('this.state.carouselOn', this.state.carouselOn);
    this._dt = +(new Date); // TODO:
  }

  handleLinkListClick = (item, i, event) => {
    console.group();
    console.log('m:handleLinkListClick');
    event.nativeEvent.preventDefault();
    var elem = $(event.nativeEvent.srcElement);
    this.setUrl(item, i);
    this.reset();
    console.groupEnd();
  }

  handleSecondsPerFrameChange = (event) => {
    var elem = $(event.nativeEvent.srcElement);
    var t_seconds = parseInt(elem.prop("value"));
    if (t_seconds < 10) {
      t_seconds = 10;
      elem.prop("value", t_seconds);
    }
    this.setState({secondsPerThing: t_seconds});
  }

  handleIframeLoad = (event) => {
    console.group();
    console.log('m:handleIframeLoad');
  //  console.log(event);
  //  console.log(event.nativeEvent);
  //  console.log($(event.nativeEvent.target));
  //  console.log(event.nativeEvent.target.contentWindow);
  //  console.log(event.nativeEvent.target.contentWindow.location); // only works w/ same-origin
    this.reset()
    console.groupEnd();
  }

  handleIframeFullscreen(e, forceStatus) {
    //var elem = $('iframe#main')[0];
    var elem = $('html')[0];
    if (forceStatus == null) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (document.webkitFullscreenElement) {
        document.webkitExitFullscreen();
      } else {
        if (elem.requestFullScreen) {
          elem.requestFullScreen();
        } else if (elem.webkitRequestFullScreen) {
          elem.webkitRequestFullScreen();
        }
      }
    } else {
      if (forceStatus == true) {
        if (document.fullscreenElement) {
          elem.requestFullScreen();
        } else if (document.webkitFullscreenElement) {
          elem.webkitRequestFullScreen();
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (document.webkitFullscreenElement) {
          document.webkitExitFullscreen();
        }
      }
    }
  }

  next = (event) => {
    console.group();
    console.log('m:next');
    if (!(this.state.things.length)) {
      console.log("no links");
      return;
    }
    var i;
    if (this.state.current_i !== undefined) {
      i = this.state.current_i;
    } else {
      i = -1;
    }
    if (i < this.state.things.length - 1) {
      i = i + 1;
    } else {
      i = 0;
      console.log('this is the end.');
    }
    this.setUrl(this.state.things[i], i);
    this.reset();
    console.groupEnd();
  }

  prev = () => {
    console.group();
    console.log("m:prev");
    if (!(this.state.things.length)) {
      console.log("no links");
      return;
    }
    var i;
    if (this.state.current_i !== undefined) {
      i = this.state.current_i;
    } else {
      i = 0;
    }
    if (i >= 1) {
      i -= 1;
    } else {
      i = this.state.things.length - 1;
      console.log('this is the beginning.');
    }
    this.setUrl(this.state.things[i], i);
    this.reset();
    console.groupEnd();
  }

  toggleThingList = () => {
    var elem = $("div#thingList_window");
    if (elem.css("visibility") == "hidden") {
      elem.css("visibility", "visible");
    } else {
      elem.css("visibility", "hidden");
    }
    // TODO: ThingList component
  }

  scrollToLink = (elem) => {
    //console.log('m:scrollToLink');
    //console.log(elem);
    if (elem === undefined) {
      return
    }
    var output = $('div#thingList_window').scrollTo(
      elem, 0,
      { offset: -18,
        margin: true,
        limit: false}
    );
    return elem;
  }

  loadJSON = (jsonUrl, append, transformFunc, successFunc) => {
    console.group();
    console.log('m:loadJSON');
    console.log(jsonUrl);
    if (append === '=') {
      if (this.state.jsonUrlList.indexOf(jsonUrl) !== -1) {
        console.log('loadJSON: jsonUrl already loaded');
        console.log(jsonUrl);
        return
      }
      append = false;
    }
    var this__ = this;
    ($.ajax({
      url: jsonUrl,
      dataType: 'json',
      cache: false}
      )
      .done(function(data, textStatus, xhr) {
        console.group();
        console.log('m:loadJSON.ajax.done');
        var data_;
        if (transformFunc !== undefined) {
          data_ = transformFunc(data);
        } else {
          data_ = data;
        }
        if (append !== true) {
          this__.setState({
            current_i: undefined,
            current: undefined,
            things: data_,
            jsonUrl: jsonUrl,
            jsonUrlList: [jsonUrl]});
        } else {
          this__.setState({
            things: React.addons.update(this__.state.things,
              {$push: data_}),
            jsonUrl: jsonUrl,
            jsonUrlList: React.addons.update(this__.state.jsonUrlList,
              {$push: [jsonUrl]}),
          }); 
        }
        if (successFunc !== undefined) {
          successFunc(data);
        }
        console.groupEnd();
      })
      .error(function(xhr, textStatus, err) {
        console.group();
        console.log('m:loadJSON.ajax.error');
        console.log(textStatus);
        console.log(err);
        console.groupEnd();
      })
    );
    console.groupEnd();
  }

  linklist_to_ThingList(data) {
    return data.map(function(x) {
      if (typeof(x) == 'string') {
        return {url: x};
      } else {
        return {url: x.url, name: x.name};
      }
    });
  }

  loadJSON_linklist = (jsonUrl, append, successFunc) => {
    return this.loadJSON(
      jsonUrl,
      append,
      this.linklist_to_ThingList,
      successFunc);
  }

  render = () => {
    var this_ = this;
    return (
      <div className="thingCarousel">
        <div id="nav">
          <a href={this.state.current ? this.state.current.url : ''}
            >{this.state.current ? this.state.current.url : ''}</a>
          <div id="thingList_window">
            <div className="jsonUrlList">
              <ul id="jsonUrlList">
                {this.state.jsonUrlList.map(function(item, i) {
                  return <li key={i}><a
                    href={item}
                    key={i}
                    className={item.cssClass}
                    target="_blank"
                    rel="noopener noreferer"
                    >{item}</a></li>
                })}
              </ul>
            </div>
            <div className="thingList">
              <ul id="thingList">
              {this.state.things.map((item, i) => {
                var cssId = "thing-" + i;
                var text;
                if (item.name !== undefined) {
                  text = React.createElement("span", null,
                    item.name,
                    React.createElement('br'),
                    React.createElement("span", null, item.url));
                } else {
                  text = React.createElement("span", null, item.url);
                }
                return <li key={i}><a
                  id={cssId}
                  href={item.url}
                  key={i}
                  className={item.cssClass}
                  onClick={this.handleLinkListClick.bind(null, item, i)}
                  >{text}</a></li>
              })}
              </ul>
            </div>
          </div>
          <div id="carousel_options">
            <button id="thingList_toggle"
              onClick={this.toggleThingList}>toggle thing list</button>
            <button id="fullscreen"
              onClick={this.handleIframeFullscreen}>fs</button>
            <button id="prev"
              onClick={this.prev}>prev</button>
            <button id="next"
              onClick={this.next}>next</button>
            <label><input type="checkbox"
              onClick={this.handleOnOffClick}
              />on/off</label>
            <input id="secondsPerThing" type="text"
              onBlur={this.handleSecondsPerFrameChange}
              placeholder={this.state.secondsPerThing}/>
            <input id="secondsElapsed" type="text"
              readOnly="readonly"
              placeholder={this.state.secondsElapsed}/>
          </div>
        </div>
        <div className="contentFrame">
          <iframe id="main"
            height="100%" width="100%"
            allowFullScreen="true"
            src={this.state.current ? this.state.current.url : ''}
            onLoad={this.handleIframeLoad}
            ></iframe>
        </div>
      </div>
    );
  }
}


ReactDOM.render(<ThingCarousel/> ,
    document.getElementById('container')
);

