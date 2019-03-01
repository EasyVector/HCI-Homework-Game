/**
 * @constructor
 * @param {props} An object containing properties for the actor
 */
function Game(canvas) {
    //Setup our fields
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.dragFocus = null;
    this.width = canvas.width;
    this.height = canvas.height;
    this.grabPointX = 0;
    this.grabPointY = 0;
    this.actors = [];//将actor添加到数组中
    var temp = this;//将Game对象添加到属性中
    // TODO Listen for events here and dispatch them
    //分配鼠标释放的事件，将事件类型标记为dragend
    canvas.addEventListener("mouseup", function(event) {
        event = _.clone(event);
        event.type = "dragend";
        temp.dispatchDragFocus(event);
    });
    //分配鼠标释放的事件，将事件类型标记为mousedown
    canvas.addEventListener("mousedown", function(event) {
        event = _.clone(event);
        event.type = "mousedown";
        temp.dispatchDragFocus(event);
    });
    //分配鼠标释放的事件，将事件类型标记为mousemove
    canvas.addEventListener("mousemove", function(event) {
        event = _.clone(event);
        event.type = "dragmove";
        temp.dispatchDragFocus(event);
    });
}


/**
 * Adds a new actor to the game. Each actor must be an independent object 
 * (new * object). Make sure to properly clone actors if adding multiple 
 * of the same type.
 * @param {Actor} actor to add to the game.
 */
Game.prototype.addActor = function(actor) {
  this.actors.push(actor);
  actor.parent = this;
};

/**
 * Find and return the list of actors whose bounds overlap the given
 * rectangular area.  The actors (if any) in the list should be in reverse
 * drawing order. That is, the actors drawn later should appear earlier in the
 * list.
 * @param {Integer} left position of the rectangle 
 * @param {Integer} top position of the rectangle
 * @param {Integer} width of the rectangle
 * @param {Integer} height of the rectangle
 * @return {Array} A list of actors in reverse drawing order that are under
 */
Game.prototype.actorsUnder = function(left, top, width, height) {
    var array = [];
    for (var i = 0; i<this.actors.length; i++)
    {
        var temp = this.actors[i];
        //对两个矩形进行碰撞检测，两个矩形中心的横坐标之差或纵坐标差如果都分别小于两个矩形宽的和除以2以及两个矩形高的和除以2，判断为碰撞
        if(
            Math.abs(temp.x - left + temp.width/2 - width/2) < temp.width/2 + width/2 //横向判断
            &&
            Math.abs(temp.y - top + temp.height/2 - height/2) < temp.height/2 + height/2 //纵向判断
        )
        {
            array.push(temp);//将满足碰撞的对象加到返回的数组中
        }

    }
    return array;
};

/**
 * Dispatch the given event to one actor under the given x,y position. When
 * multiple actors are under the position we offer it to them in reverse
 * drawing order. As soon as a actor takes the event (returns true from its
 * deliverEvent() method) we stop offering it to others so that only one actor
 * gets the event.
 * @param {Event} Javascript event object (from an event handler)
 * @return {boolean} True if the event was consumed, false if it was not
 */
Game.prototype.pointDispatch = function(event) {
    var actors = this.actorsUnder(event.screenX,event.screenY,0,0)
    for(var i = actors.length-1; i>=0; i--)
    {
        var temp =  this.directDispatch(event,actors[i]);
        if(temp===true)
        {
            break;
        }
    }
    return temp;
}

/**
 * Dispatch the given event to one actor whose bounds overlap the given
 * rectangle. When multiple actors are overlapped we offer it to them in
 * reverse drawing order. As soon as a actor takes the event (returns true from
 * its deliverEvent() method) we stop offering it to others so that only one
 * actor gets the event.
 * @param {Object} Javascript object with the following properties
 *  - top: top coordinate of the bounding box
 *  - left: left coordinate of the bounding box
 *  - width: Width of the bounding box
 *  - height: height of the bounding box
 * @param {Event} Javascript event object (from an event handler)
 * @return {boolean} True if the event was consumed, false if it was not
 */
Game.prototype.areaDispatch = function(area, event) {
    var actors = this.actorsUnder(area.left,area.top,area.width,area.height)
    for(var i = actors.length-1; i>=0; i--)
    {
        var temp = false;
        if(this.directDispatch(event,actors[i]))
        {
            temp = true;
            break;
        }
    }
    this.damageActor(actors);
}

/**
 ￼* Dispatch the given event directly to the evt) given actor
 * @param {Event} Javascript event object (from an event handler)
 * @param {Actor} Actor to dispatch the vent to
 * @return {boolean} True if the event was consumed, false if it was not
 */
Game.prototype.directDispatch = function(event, actor) {
    var temp = actor.deliverEvent(event);
    this.damageActor(event);
    return temp;
}

/**这个eventDispatch会遍历所有actor
 * Dispatch the given event to all actors in reverse drawing order. This
 * dispatch does not stop after the first actor accepts the event, but instead
 * always continues through the list of all actors
 * @param {Event} Javascript event object (from an event handler)
 * @return {boolean} True if the event was consumed by any of the actors
 */
Game.prototype.dispatchToAll = function(event) {
    var flag = false;
    for(var actorItem = 0; actorItem<this.actors.length; actorItem++)
    {
        if(this.actors[actorItem].deliverEvent(event))
        {
            flag = true;
        }
    }
    this.damageActor(actorItem);
    return flag;
}

/**这个eventDispatch会遍历到第一个接受事件的actor
 * Attempt to dispatch the given event to all actors in reverse drawing order
 * stopping as soon as some actor takes the event (returns true from its
 * deliverEvent() method).
 * @param {Event} Javascript event object (from an event handler)
 * @return {boolean} True if the event was consumed by one of the actors, false
 *  if it was not
 */
Game.prototype.dispatchTryAll = function(event) {
    var flag = false;
    for(var actorItem in this.actors)
    {
        if(actorItem.deliverEvent(event))
        {
            flag = true;
            break;
        }
    }
    return flag;
}

/**
 * Dispatch the given event to the current drag focus object (if any). If there
 * is no current drag focus or the current drag focus object rejects the event
 * (returns false from its deliverEvent() method), this method returns false.
 * All events which contain an x,y position will have their x,y position
 * adjusted by (-grabPointX, -grabPointY) prior to being delivered.  In this
 * way the position indicated in the event will reflect where the top-left
 * corner of the dragged actor should be placed, rather than where the cursor
 * was (which will normally be inside the actor; specifically at a distance of
 * (grabPointX, grabPointY) from the top-left of the object).
 * @param {Event} Javascript event object (from an event handler)
 * @return {boolean} True if the event was consumed, false if it was not
 */
Game.prototype.dispatchDragFocus = function(event) {
    var flag = false;
    var focus = this.actors[this.actors.length-1];
    if(event.type!=='dragmove') {
        //如果此时状态不是移动的状态，就要判断下方的靶子是否在点击范围中
        if ((event.offsetX >= focus.x && event.offsetX <= focus.x + focus.width) && (event.offsetY >= focus.y && event.offsetY <= focus.y + focus.height)) {
            this.directDispatch(event, focus);
        }
    }else
    {
        //如果是点击状态，就保持
        this.directDispatch(event, focus);
    }
    return flag;
}

/**
 * This method is responsible for drawing all of the actors
 */
Game.prototype.onDraw = function() {
  for(var temp = 0;temp<this.actors.length; temp++)
  {
      this.actors[temp].draw(this.context);
  }
}

/**
 * Provided methods below this line
 */

/**
 * Switch the current drag focus to the given actor.  The offset values
 * given indicate where inside the given actor the cursor was when the
 * drag was started.  This offset will be applied (negatively) to all
 * drag events later delivered.  This will allow each of those events to
 * reflect where the top-left corner of the dragged actor should be
 * placed, rather than where the cursor currently is.
 * 
 * @param {Actor} actor that is to be the new drag focus.
 * @param {Integer} x distance from the left of the actor that the cursor
 *              was when the drag was started.
 * @param {Integer} y distance from the top of the actor that the cursor
 *              was when the drag was started.
 */
Game.prototype.requestDragFocus = function(actor, x, y) {
  this.dragFocus = actor;
  this.grabPointX = x;
  this.grabPointY = y;
}

/**
 * Clear the current drag focus.
 */
Game.prototype.releaseDragFocus = function() {
  this.dragFocus = null;
    this.grabPointX = 0;
    this.grabPointY = 0;
}



/**
 * Creates a new animation to run
 * @param {Actor} movingActor - actor that will be moving
 * @param {Actor} targetActor - target the movingActor will be going to
 * @param {String} endMessage that will be send to targetActor after the
 *  animation completes
 * @param {String} passoverMessage that will be sent to any interactors the
 * movingActor animates over
 * @param {Integer} duration in ms for the animation
 */
Game.prototype.newAnimation = function(movingActor, targetActor, endMessage, passoverMessage, duration) {
  var self = this;
  var start = Date.now();
  var target_x = targetActor.x + (targetActor.width / 2) - (movingActor.width / 2);
  var target_y = targetActor.y + (targetActor.height / 2) - (movingActor.height / 2);
  var x_inc = (target_x - movingActor.x) / duration;
  var y_inc = (target_y - movingActor.y) / duration;
  var x_init = movingActor.x;
  var y_init = movingActor.y;
  self.directDispatch({type: "animstart"}, movingActor)
    // var curTime = 0;
  var animation = function (timestamp) {
    var curTime = Date.now() - start_time;
    var x = x_init + curTime * x_inc;
    var y = y_init + curTime * y_inc;
    self.directDispatch({type: "animmove", offsetX: x, offsetY: y}, movingActor);
    if (passoverMessage) {
      self.areaDispatch({
        top: y,
        left: x, 
        width: movingActor.width,
        height: movingActor.height
      }, {type: "message", message: passoverMessage});
    }
      if (curTime < duration) {
      window.setTimeout(animation,1);
    } else {
      self.directDispatch({type: "animend", offsetX: x, offsetY: y}, movingActor)
      self.sendMessage(targetActor, endMessage);
    }
  }
  var start_time = Date.now()
  window.setTimeout(animation, 1);
}

/**
 * Starts the game!
 */
Game.prototype.run = function() {
  //Send the init message to all of our actors
  this.dispatchToAll({type: "message", message: "$INIT$"});
  this.onDraw(); 
}

/**
 * Reports damage on a particular actors. Uses a fairly dumb redraw strategy,
 * however a smarter one could be implimented for bells and whistles
 * @param {Actor} an actor that has been damaged through state change
 */
Game.prototype.damageActor = function(actor) {
  this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
  this.onDraw(); 
};

/**
 * Sends a message to a particular actor
 * @param {Actor} actor to send the message to
 * @param {String} Message to send
 */ 
Game.prototype.sendMessage = function(actor, message) {
  this.directDispatch({type: "message", message: message}, actor) 
}
