var j5 = require("johnny-five");
var lc = require('linino-components');
codePos=0;
codeValid='1470';

var buttons = [['1','3','2'],['4','6','5'],['7','9','8'],['*','#','0']];

var alarm={
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

var board = new j5.Board({
    port: "/dev/ttySPI0"
});

board.on("ready", function(){
	var val = 0;

	var keyBoard = new lc.KeyBoard(true);	
	keyBoard.configure(alarm.keys);

	// Detected a button pressed
	// start to analize the code to trigger or disable 
	// the alarm of the Door
	keyBoard.on('buttonPressed', function(button) {
		if (debug === true)
			console.log('detected Key',button);
		detectCode(button);
	});

	keyBoard.on('buttonReleased', function(button) {
		if (debug === true)
			console.log('released Key',button);
	});
});
var debug = true;

var NO_CODE=0;
var GOOD_CODE=1;
var BAD_CODE=2;

function retry() {
	codePos=0; //reset 
	return NO_CODE;
}

function checkValidity (button) {
	var sendAnswer = false;
	if (codeValid[codePos]===button) {
		if (debug === true)
			console.log('VALID');
		codePos++;
		// if it is the last corect button
		if (codePos == codeValid.length) {
			codePos=0; //reset
			return GOOD_CODE;
		}
	} else {
		return retry();			
	}
	return NO_CODE;
};



// Check if all the pressed button are part of the code
// and if the code is corect or not.
// send to the user of the class the correct event
// 'Alarm' if code is not valid
// 'Open'  if the code is valid 
function detectCode(button){

	false;
	if (debug===true) {
		console.log('button Check =', button);
		console.log('code in analisys =', codeValid[codePos]);
	}

	// detect button by button if the code is corect
	var sendAnswer= checkValidity(button)
	if (debug === true)
		console.log('Code Analyzed', sendAnswer);

	if (sendAnswer!==NO_CODE){
		if (sendAnswer===GOOD_CODE) {
			if (debug===true) {
				console.log('OPEN');
			}
		}else{
			console.log('Warning');
		}
	}
};