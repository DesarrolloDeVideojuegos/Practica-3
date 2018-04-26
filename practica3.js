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
      Q.stageScene("endGame",1, { label: "You Died" });
      this.destroy();
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
    },


  });

//
//  ENEMY
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
//  PRINCESS
//
  Q.Sprite.extend("Princess",{
    init: function(p){
      this._super(p,{
        asset: "princess.png",
        x: 2020,
        y: 452,
        sensor: true
      })
      this.on("sensor");
    },

    sensor:function(){
      Q.stage().pause();
      Q.stageScene("endGame", 2, {label: "You win!"});
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
    stage.insert(new Q.Princess());
  });

  Q.scene("endGame",function(stage) {
    var box = stage.insert(new Q.UI.Container({
      x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
    }));
    
    var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                             label: "Play Again" }))         
    var label = box.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
                                          label: stage.options.label }));
    button.on("click",function() {
      Q.clearStages();
      Q.stageScene("level1");
    });
    box.fit(20);
  });
  
  var title = true;
  Q.scene("title",function(stage) {
    title = true;
    var button = stage.insert(new Q.UI.Button({
      asset: "mainTitle.png",
      x: Q.width/2, 
      y: Q.height/2
    }));
    button.on("click", function(){
      Q.stageScene("level1");
      title = false;
    });
    Q.input.on("confirm", function(){
      //button.click();
      if(title){
        Q.stageScene("level1");
        title = false;
      }
    });
  })

  Q.load("mario_small.json, mario_small.png, goomba.json, goomba.png, bloopa.json, bloopa.png, princess.png, mainTitle.png", function(){
    Q.compileSheets("mario_small.png", "mario_small.json");
    Q.compileSheets("goomba.png", "goomba.json");
    Q.compileSheets("bloopa.png", "bloopa.json");
    Q.animations("Player", {
      walk_right: { frames: [1,2,3], rate: 1/15, loop: true },
      walk_left: { frames:  [15,16,17], rate: 1/15, loop: true },
      jump_right: { frames: [4], rate: 1/10 },
      jump_left: { frames:  [18], rate: 1/10 },
      stand_right: { frames:[0], rate: 1/10 },
      stand_left: { frames: [14], rate: 1/10 },
      death: {frames: [12], rate: 1 }
    })



    Q.loadTMX("level.tmx", function() {
      Q.stageScene("title");
    });
  })

});