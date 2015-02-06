// simple-todos.js
Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  Meteor.subscribe("tasks");
  
  Router.route('/', {
    name: 'home',
    path: '/',
    template: 'home',
    action: function(){
      if(Meteor.user()){
        Router.go('tasks');
      } else {
        this.render();
      }
    }
  });
  
  Router.route('/tasks', {
    name: 'tasks',
    path: '/tasks',
    data: function () {
      if (Session.get("hideCompleted")) {
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
  });
  
  
  Template.tasks.helpers({
    // tasks: function () {
    //   if (Session.get("hideCompleted")) {
    //     // If hide completed is checked, filter tasks
    //     return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
    //   } else {
    //     // Otherwise, return all of the tasks
    //     return Tasks.find({}, {sort: {createdAt: -1}});
    //   }
    // },
    hideCompleted: function () {
      return Session.get("hideCompleted");
    }
  });
  
  // Inside the if (Meteor.isClient) block, right after Template.body.helpers:
  Template.tasks.events({
    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    },
    "submit .new-task": function (event, template) {
      event.preventDefault();
      // This function is called when the new task form is submitted
  
      var text = event.target.text.value;
  
      // Tasks.insert({
      //   text: text,
      //   createdAt: new Date(), // current time
      //   owner: Meteor.userId(),           // _id of logged in user
      //   username: Meteor.user().username  // username of logged in user
      // });
      
      Meteor.call("addTask", text);
  
      // Clear form
      event.target.text.value = "";
  
      // Prevent default form submit
      return false;
    }
  });
  
  Template.task.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });
  
  Template.task.events({
    "click .toggle-checked": function () {
      console.log(this);
      // Set the checked property to the opposite of its current value
      // Tasks.update(this._id, {$set: {checked: ! this.checked}});
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function () {
      console.log(this);
      //Tasks.remove(this._id);
      Meteor.call("deleteTask", this._id);
    },
    // Add an event for the new button to Template.task.events
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });
  
  // At the bottom of the client code
  // Accounts.ui.config({
  //   passwordSignupFields: "USERNAME_ONLY"
  // });
}

if (Meteor.isServer) {
  
  Meteor.publish("tasks", function () {
    return Tasks.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  });
  
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

Meteor.methods({
  addTask: function (text) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteTask: function (taskId) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }
  },
  setChecked: function (taskId, setChecked) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }
  },
  // Add a method to Meteor.methods called setPrivate
  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);
  
    // Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
  
    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }
});



SinglePageLogin.config({
  loginTitle: 'Login',
  signupTitle: 'Sign Up',
  forgotPasswordTitle: 'Retrieve password',
  canRetrievePassword: true,
  passwordSignupFields: 'USERNAME_ONLY',
  forbidClientAccountCreation: false,
  routeAfterLogin: '/tasks',
  routeAfterSignUp: '/tasks',
  forceLogin: true,
  routeAfterLogout: '/',
  exceptRoutes: ['home']
});