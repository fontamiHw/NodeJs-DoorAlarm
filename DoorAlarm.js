//configure webserver restful
var j5 = require("johnny-five");
var netEmitter = require("events").EventEmitter;
var util = require("util");
var lc = require('linino-components');
//var ms = require("magneticswitch");

var switchC={
		"pinDetect":'A0'
};

var debug = false;

var NO_CODE=0;
var GOOD_CODE=1;
var BAD_CODE=2;

var buttons = [['1','3','2'],['4','6','5'],['7','9','8'],['*','#','0']];
var defaultAlarm={
		"keys": {
			"Row1":11,
			"Row2":10,
			"Row3":9,
			"Col4":8,
			"Col3":5,
			"Col2":4,
			"Col1":2,
			"keys": buttons,
			"buttonHoldTime":100,
			"ScanCompleted":200,
			"feedBack":13},
			"sound":6,
			"alarmRetry":3
};

var DoorAlarm =  function(db, alarm, switchConf) {
	netEmitter.call(this);
	debug=db;
	this.codeValid='1470';
	this.codePos=0;
	this.retryNumber=0;
	this.alarmData=alarm;
	this.switchData=switchConf;	
	this.mSwitch = new lc.MagneticSwitch(db);
	this.keyBoard = new lc.KeyBoard(db);
	this.sound;
	
	// TODO throw excepton if not configuration data
	//		are present

	parent=this;

	this.retry = function() {
		parent.codePos=0; //reset 
		parent.emit('Retry');
		parent.retryNumber++;	
		if (parent.retryNumber === parent.alarmData.alarmRetry)
			return BAD_CODE;

		return NO_CODE;
	}

	this.checkValidity = function(button) {
		var sendAnswer = false;
		if (parent.codeValid[parent.codePos]===button) {
			if (debug === true)
				console.log('VALID');
			parent.codePos++;
			// if it is the last corect button
			if (parent.codePos == parent.codeValid.length) {
				parent.codePos=0; //reset
				return GOOD_CODE;
			}
		} else {
			return parent.retry();			
		}
		return NO_CODE;
	};

	// Check if all the pressed button are part of the code
	// and if the code is corect or not.
	// send to the user of the class the correct event
	// 'Alarm' if code is not valid
	// 'Open'  if the code is valid 
	this.detectCode = function(button){

		false;
		if (debug===true) {
			console.log('button Check =', button);
			console.log('code in analisys =', parent.codeValid[parent.codePos]);
		}

		// detect button by button if the code is corect
		var sendAnswer= parent.checkValidity(button)
		if (debug === true)
			console.log('Code Analyzed', sendAnswer);

		if (sendAnswer!==NO_CODE){
			if (sendAnswer===GOOD_CODE) {
				parent.sendGood();
			}else{
				parent.sendAlarm('Warning');
			}
		}
	};

	this.emitSound = function(strobems) {
		parent.sound.strobe(strobems);
		setTimeout(function(){
			parent.sound.stop();
			}, 
		1500);
	}
	
	this.sendGood = function(){
		parent.emitSound(500); // to inform the user the coe is orect
		parent.emit('Good');  // send event to the user of the library
		parent.retryNumber=0; // reset  the retry
		parent.mSwitch.enableTogle(); // togle the switch ena/disa
		if (parent.debug === true)
			console.log('OpenDoor');	
	}
	
	this.sendAlarm= function(emitMsg){
		parent.emitSound(100); 
		parent.emit(emitMsg);
		if (parent.debug === true)
			console.log('AlarmDoor');
	}

	// start the alarm initializing LininoBoard
	this.startAlarm = function() {
		this.board = new j5.Board({
	        port: "/dev/ttySPI0"
		});


		this.board.on("ready", function(){
			var val = 0;

			parent.sound = new j5.Led({
				pin:parent.alarmData.sound, 
				type: "PWM"
			});

			parent.keyBoard.configure(parent.alarmData.keys);
			parent.mSwitch.configure(parent.switchData);
			
			// Board Ready Send notification to the subscribers
			parent.emit('BoardReady');

			// Detected a button pressed
			// start to analize the code to trigger or disable 
			// the alarm of the Door
			parent.keyBoard.on('buttonPressed', function(button) {
				if (debug === true)
					console.log('detected Key',button);
				parent.detectCode(button);
			});

			parent.keyBoard.on('buttonReleased', function(button) {
				if (debug === true)
					console.log('released Key',button);
			});
		});
	};

	this.mSwitch.on('SwitchClose', function(){
		console.log('SwitchClose');
	});

	this.mSwitch.on('SwitchOpen', function(){
		console.log('SwitchOpen');
		parent.sendAlarm('Alarm');
	});
};

//Inherit event api
util.inherits(DoorAlarm, netEmitter);
module.exports = DoorAlarm;
