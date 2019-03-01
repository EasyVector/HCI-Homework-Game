/**
 * @constructor
 * @param {props} An object containing properties for the actor
 */
function Actor(props) {
    this.parent = null; //Set in the game.addActor method
    //TODO add additional properties for each actor
    this.height = props.height;
    this.width = props.width;
    this.x = props.x;
    this.y = props.y;
    this.img = props.img;
};

/**
 * Sets the FSM for the particular actor. 
 * @param {Object} FSM object as detailed in the instructions
 */
Actor.prototype.setFSM = function(startState, fsm) {
    this.states = fsm;//初始状态？还是现有的状态，可以用这个来确定使用的断言predicate函数
    this.currentState = fsm[startState];//给actor添加两个属性
}

/**
 * Receives an event from dispatch and transitions the FSM appropriately
 * @param {Event} The event object received, which includes certain information
 *  depending on the event type
 * @return {boolean} True if the event was consumed by the actor, false if it
 *  was not consumed
 */
Actor.prototype.deliverEvent = function(event) {//识别处理机状态，判断是否满足断言函数，执行一系列action，最后改变处理机为下一个状态
    var temp = false;
    var actions = 0;
    var params;
    if(this.currentState[event.type]!==undefined) {
      if(this.currentState[event.type].predicate!==undefined) {
          temp = this.currentState[event.type].predicate(event, this);
          if (temp !== true) {
          } else {
              for (actions = 0; actions < this.currentState[event.type].actions.length; actions++) {
                  params = this.currentState[event.type].actions[actions].params;
                  this.currentState[event.type].actions[actions].func(event, params, this);
              }
              event.type = this.currentState[event.type].endState;
              this.currentState = this.states[event.type];
          }
      }else
      {
          for(actions = 0; actions<this.currentState[event.type].actions.length; actions++) {
              params = this.currentState[event.type].actions[actions].params;
              this.currentState[event.type].actions[actions].func(event, params, this);
          }
          event.type = this.currentState[event.type].endState;
          this.currentState = this.states[event.type];
          return true;
      }
    }
    return temp;
}

/**
 * Transitions the FMS for a particular transition and event
 * @param {Event} event object received, which includes certain information
 *  depending on the event type
 */
Actor.prototype.makeTransition = function(event, transition) {
  //TODO
}

/**
 * Draws the actor on the canvas based on its parameters
 * @param {Context} The HTML5 canvas context object to be drawn on. 
 */
Actor.prototype.draw = function(context) {
  if(this.img!==null)
    context.drawImage(this.img,this.x,this.y,this.width,this.height);
}
