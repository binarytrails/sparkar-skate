// Vsevolod Ivanov seva@binarytrails.net

const Reactive = require('Reactive');
const Scene = require('Scene');
const Time = require('Time');
const Animation = require('Animation');
const TouchGestures = require('TouchGestures')

export const Diagnostics = require('Diagnostics');

(async function() {
    const [plane] = await Promise.all([
      Scene.root.findFirst('planeTracker0')
    ]);
    //Diagnostics.log(plane);
    const [skate] = await Promise.all([
      Scene.root.findFirst('skate')
    ]);
    const [skateNull] = await Promise.all([
      Scene.root.findFirst('skateNull')
    ]);

    function olliePop(duration, height){
      const driver = Animation.timeDriver({
        durationMilliseconds: duration,
        loopCount: 2,
        mirror: true
      });
      driver.start();
      // https://sparkar.facebook.com/ar-studio/learn/documentation/reference/classes/animationmodule.samplerfactory/
      const sampler = Animation.samplers.linear(0, height);
      // https://sparkar.facebook.com/ar-studio/learn/documentation/reference/classes/scenemodule.transform
      skateNull.transform.y = Animation.animate(driver, sampler);
    }

    function ollieTilt(duration, tilt){
        const driver = Animation.timeDriver({
          durationMilliseconds: duration,
          loopCount: 1
        });
        driver.start();
        const z0 = skateNull.transform.rotationZ.pinLastValue();
        const sampler = Animation.samplers.easeInOutSine(z0, z0 - tilt);
        skateNull.transform.rotationZ = Animation.animate(driver, sampler);
        const interval = Time.setTimeout(function(){
            const driver = Animation.timeDriver({
              durationMilliseconds: duration,
              loopCount: 1
            });
            driver.start();
            const z1 = skateNull.transform.rotationZ.pinLastValue();
            const sampler = Animation.samplers.linear(z1, z0);
            skateNull.transform.rotationZ = Animation.animate(driver, sampler);
        }, duration / 2);
    }

    function kickflipSpin(duration, tilt, rotation){
        // board flip (-180 + 180)
        const interval = Time.setTimeout(function(){
            const driver = Animation.timeDriver({
              durationMilliseconds: duration / 4,
              loopCount: 1
            });
            driver.start();
            const x = skateNull.transform.rotationX.pinLastValue();
            const samplerX = Animation.samplers.linear(x, x + rotation / 2);
            skateNull.transform.rotationX = Animation.animate(driver, samplerX);
            const interval2 = Time.setTimeout(function(){
                const driver = Animation.timeDriver({
                  durationMilliseconds: duration / 4,
                  loopCount: 1
                });
                driver.start();
                const x = skateNull.transform.rotationX.pinLastValue();
                const samplerX = Animation.samplers.linear(x, x + (rotation / 2));
                skateNull.transform.rotationX = Animation.animate(driver, samplerX);
            }, duration / 4);
        }, duration / 2);
    }

    function shovitSpin(duration, tilt, rotation){
        const driver = Animation.timeDriver({
          durationMilliseconds: duration,
          loopCount: 1
        });
        driver.start();
        // board flip (-180 + 180)
        const interval = Time.setTimeout(function(){
            const driver = Animation.timeDriver({
              durationMilliseconds: duration / 4,
              loopCount: 1
            });
            driver.start();
            const y = skateNull.transform.rotationY.pinLastValue();
            const samplerY = Animation.samplers.linear(y, y + rotation / 2);
            skateNull.transform.rotationY = Animation.animate(driver, samplerY);
            const interval2 = Time.setTimeout(function(){
                const driver = Animation.timeDriver({
                  durationMilliseconds: duration / 4,
                  loopCount: 1
                });
                driver.start();
                const y = skateNull.transform.rotationY.pinLastValue();
                const samplerY = Animation.samplers.linear(y, y + (rotation / 2));
                skateNull.transform.rotationY = Animation.animate(driver, samplerY);
            }, duration / 4);
        }, duration / 2);
    }

    function ollie(){
        resetRotation();
        olliePop(400, 0.3 * skateNull.transform.scaleX.pinLastValue());
        ollieTilt(200, 0.9);
    }

    function shovit(){
        resetRotation();
        olliePop(700, 0.4 * skateNull.transform.scaleX.pinLastValue());
        shovitSpin(700, 1.2, 6.6);
    }

    function flip(){
        resetRotation();
        olliePop(700, 0.4 * skateNull.transform.scaleX.pinLastValue());
        kickflipSpin(700, 1.2, 6.6);
    }

    var lastTapInterval = 0;
    var tapInterval = 0;
    var tapMs = 100;
    var tapCount = 0;
    const maxTapSpeed = 200;

    Time.ms.interval(tapMs).subscribe(function(elapsedTime){
        tapInterval = elapsedTime;
    });

    TouchGestures.onTap().subscribe(function(gesture){
        var lastTap = tapInterval - lastTapInterval;
        Diagnostics.log("Tapped after " + lastTap + "ms");
        if (lastTap > 300){
            tapCount = 1;
        }
        else if (lastTap <= maxTapSpeed){
            tapCount += 1;
        }
        // check after a bit of time
        // const interval = Time.setTimeout(function(){
            if (tapCount == 1){
                Diagnostics.log(tapCount + " tap");
                ollie();
            }
            else if (tapCount == 2){
                Diagnostics.log(tapCount + " tap");
                shovit();
            }
            else if (tapCount == 3){
                Diagnostics.log(tapCount + " tap");
                flip();
            }
            else if (tapCount == 4){
                Diagnostics.log(tapCount + " tap");
                resetRotation();
                olliePop(700, 0.5);
                kickflipSpin(700, 1.2, 30);
            }
        //}, maxTapSpeed * 2);
        lastTapInterval = tapInterval;
    });

    function resetRotation(){
        skateNull.transform.rotationX = 0;
        skateNull.transform.rotationY = 0;
        skateNull.transform.rotationZ = 0;
        skate.transform.rotationX = 0;
        //skate.transform.rotationY = -90;
        skate.transform.rotationZ = 0;
    }

    TouchGestures.onPan().subscribe(function (gesture) {
        Diagnostics.log("pan begin");
        const gestureTransform = Scene.unprojectToFocalPlane(gesture.location);
        var rollSpeed = 1;
        gesture.state.monitor().subscribe(function (state) {
            if (state.newValue == 'CHANGED') {
              Diagnostics.log("CHANGED");
            }
            if (state.newValue == 'ENDED') {
                Diagnostics.log("pan end   x" + gestureTransform.x.pinLastValue() + " y" +  gestureTransform.y.pinLastValue());
                // const driver = Animation.timeDriver({
                //   durationMilliseconds: 1000,
                //   loopCount: 1
                // });
                // driver.start();
                // // nose tilt up
                // const z1 = skateNull.transform.z.pinLastValue();
                // const z2 = gestureTransform.z.pinLastValue();
                // const sampler = Animation.samplers.easeInOutSine(z1, z1 + z2);
                // skateNull.transform.z = Animation.animate(driver, sampler);
            }
        });
    });

    TouchGestures.onLongPress().subscribe(function(gesture) {
        Diagnostics.log("long press begin");
        resetRotation();
        const driver = Animation.timeDriver({
          durationMilliseconds: 5000,
          loopCount: 1,
          mirror: false
        });
        driver.start();
        const y = skateNull.transform.rotationY.pinLastValue();
        const sampler = Animation.samplers.linear(y, y + 10);
        skateNull.transform.rotationY = Animation.animate(driver, sampler);
        gesture.state.monitor().subscribe(function (state) {
            if (state.newValue == 'CHANGED') {
              Diagnostics.log("CHANGED");
            }
            if (state.newValue == 'ENDED') {
                Diagnostics.log("long press end");
                driver.stop();
            }
        });
    });
// Enables async/await in JS [part 2]
})();
