window.addEventListener("load",function() {
  var Q = window.Q = Quintus().include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX")
                .setup({height: 480, width: 320})
                .controls().touch();

//
//  PLAYER
//
  Q.Sprite.extend("Player", {
    init:function(p){
      this._super(p, {
        sheet: "mario",
        x:150,
        y:380
      });
      this.add('2d, platformerControls');
      this.on("enemy.hit","enemyHit");

    },

    reset:function(){
      Q.stageScene("level1");
      //this.p.x = 150;
      //this.p.y = 380;
    },

    step:function(dt){
      //this.super.step(dt);
      if(this.p.y > 700){
        this.reset();
      }
    },

    enemyHit:function(){
      this.reset();
    }
  });

//
//  GOOMBA
//
  Q.Sprite.extend("Enemy", {
    init:function(p){
      this._super(p,{
        vx:50,
        defaultDirection:'left'
      });
      this.add("2d, aiBounce");
      this.on("bump.top",this, function(collision){
        if(collision.obj.isA("Player")){
          this.destroy();
        }
      });

      this.on("bump.left,bump.right", this, "hit");
    },

    hit:function(col){
      if(col.obj.isA("Player")){
          col.obj.trigger("enemy.hit");
      }
    }
  })

  Q.Enemy.extend("Goomba", {
    init: function(p) {
      this._super({
        sheet:"goomba",
        x:500,
        y:380
      })
    }
  });
  Q.Enemy.extend("Bloopa", {
    init: function(p) {
      this._super({
        sheet:"bloopa",
        x:550,
        y:600,
        gravity:0
      })
      this.on("bump.bottom", this, "hit");
    },
    step:function(){
      this.p.y = 400;
    }
  });

//
//  SCENE
//
  Q.scene("level1",function(stage) {
    Q.stageTMX("level.tmx",stage);
    var player = stage.insert(new Q.Player());
    stage.add("viewport").follow(player, {x:true, y:true}, {minX:0, minY:0, maxY:600});
    stage.insert(new Q.Bloopa());
    stage.insert(new Q.Goomba());

  });

  Q.load("mario_small.json, mario_small.png, goomba.json, goomba.png, bloopa.json, bloopa.png", function(){
    Q.compileSheets("mario_small.png", "mario_small.json");
    Q.compileSheets("goomba.png", "goomba.json");
    Q.compileSheets("bloopa.png", "bloopa.json");

    Q.loadTMX("level.tmx", function() {
      //Q.compileSheets("sprites.png","sprites.json");
     
      Q.stageScene("level1");
    });
  })
});