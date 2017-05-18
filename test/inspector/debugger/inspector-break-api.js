// Copyright 2017 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

InspectorTest.log("Checks breakProgram,(schedule|cancel)PauseOnNextStatement test API");

InspectorTest.addScript(`
function callBreakProgram() {
  inspector.breakProgram('reason', JSON.stringify({a: 42}));
}

function foo() {
  return 42;
}`, 7, 26);

InspectorTest.setupScriptMap();
Protocol.Debugger.onPaused(message => {
  InspectorTest.log('Stack:');
  InspectorTest.logCallFrames(message.params.callFrames);
  delete message.params.callFrames;
  InspectorTest.log('Other data:');
  InspectorTest.logMessage(message);
  InspectorTest.log('');
  Protocol.Debugger.resume();
});

Protocol.Debugger.enable();

InspectorTest.runTestSuite([
  function testBreakProgram(next) {
    Protocol.Runtime.evaluate({ expression: 'callBreakProgram()'})
      .then(next);
  },

  function testSchedulePauseOnNextStatement(next) {
    InspectorTest.contextGroup.schedulePauseOnNextStatement('reason', JSON.stringify({a: 42}));
    Protocol.Runtime.evaluate({ expression: 'foo()//# sourceURL=expr1.js'})
      .then(() => Protocol.Runtime.evaluate({
        expression: 'foo()//# sourceURL=expr2.js'}))
      .then(() => InspectorTest.contextGroup.cancelPauseOnNextStatement())
      .then(next);
  },

  function testCancelPauseOnNextStatement(next) {
    InspectorTest.contextGroup.schedulePauseOnNextStatement('reason', JSON.stringify({a: 42}));
    InspectorTest.contextGroup.cancelPauseOnNextStatement();
    Protocol.Runtime.evaluate({ expression: 'foo()'})
      .then(next);
  }
]);
