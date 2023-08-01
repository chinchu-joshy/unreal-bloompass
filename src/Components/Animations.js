import * as TWEEN from "@tweenjs/tween.js";
const Animations = {
  LightAnimation: (torusArray) => {},
  CameraAnimation: (camera) => {
    const tweenA = new TWEEN.Tween(camera.target)
      .to(
        {
          x: 20,
          y: 5,
          z: 0,
        },
        3000,
        
      )
      .delay(1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((object) => {
        camera.target.x = object.x;
        camera.target.y = object.y;
        camera.target.z = object.z;
      })
      .start()
      .onComplete(() => {
        tweenB.start();
      });

    const tweenB = new TWEEN.Tween({ x: 20, y: 5, z: 0 })
      .to(
        {
          x: 0,
          y: 0,
          z: 0,
        },
        3000
      )
      .delay(1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((object) => {
        camera.target.x = object.x;
        camera.target.y = object.y;
        camera.target.z = object.z;
      })
      .start()
      .onComplete(() => {
        tweenA.start();
      });
    
  },
};
export default Animations;
