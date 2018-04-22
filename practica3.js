window.addEventListener("load",function() {
  var Q = window.Q = Quintus().include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX")
                .setup({height: 480, width: 320})
                .controls().touch();


  Q.Sprite.extend("Player", {
    init:function(p){
      this._super(p, {
        sheet: "mario",
        x:150,
        y:380
      });
      this.add('2d, platformerControls');
    },

    reset:function(){
      Q.stageScene("level1");
    },

    step:function(dt){
      super.step(dt);
      if(this.p.y < 0){
        this.reset();
      }
    }
  });

  Q.scene("level1",function(stage) {
    Q.stageTMX("level.tmx",stage);
    //stage.collisionLayer()
    var player = stage.insert(new Q.Player());
    stage.add("viewport").follow(player, {x:true, y:true}, {minX:0, minY:0, maxY:600});
    //.centerOn(150, 380);
    //stage.add("Player");
  });

  Q.load("mario_small.json, mario_small.png", function(){
    Q.compileSheets("mario_small.png", "mario_small.json");
    Q.loadTMX("level.tmx", function() {
      //Q.compileSheets("sprites.png","sprites.json");
     
      Q.stageScene("level1");
    });
  })
});