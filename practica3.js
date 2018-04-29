window.addEventListener("load",function() {
  var Q = window.Q = Quintus().include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX")
                .setup({height: 480, width: 320})
                .controls().touch();


Q.SPRITE_PLAYER = 1;
Q.SPRITE_COINS = 2;
Q.SPRITE_ENEMY = 4;
Q.SPRITE_PRINCESS = 8;

//
//  PLAYER
//
  Q.Sprite.extend("Player", {
    init:function(p){
      this._super(p, {
        sheet: "mario",
        sprite: "marioAnim",
        x:150,
        y:380,
        dead:false,
        end:false,
        type: Q.SPRITE_PLAYER,
        collisionMask: Q.SPRITE_DEFAULT | Q.SPRITE_COINS | Q.SPRITE_ENEMY | Q.SPRITE_PRINCESS
      });
      this.add('2d, platformerControls, animation, tween');
      this.on("enemy.hit","enemyHit");
    },

    reset:function(){
      Q.stageScene("endGame",1, { label: "You Died" });
      this.destroy();
    },

    step:function(dt){
      if(!this.p.dead){
        if(this.p.landed>0){
          if(this.p.vx != 0) {
            this.play("walk_" + this.p.direction);
          } else {
            this.play("stand_" + this.p.direction);
          }
        } else{
          this.play("jump_" + this.p.direction);
        }

        if(this.p.y > 700){
          this.reset();
        }
      }else{
        this.play("death");
      }
    },

    enemyHit:function(){
      this.p.dead = true;
      this.del("2d, platformerControls");
      this.animate({x: this.p.x, y: this.p.y-100}, 0.5, Q.Easing.Quadratic.Out)
          .chain({x: this.p.x, y: maxYvp+100}, 1, Q.Easing.Quadratic.In, {callback: this.reset});
          
    }

  });

//
//  ENEMY
//

  Q.component("defaultEnemy", {
    defaults: {
      dead: false,
      type: Q.SPRITE_ENEMY,
      collisionMask: Q.SPRITE_DEFAULT | Q.SPRITE_PLAYER
    },

    added: function(){
      var p = this.entity.p;

      Q._defaults(p,this.defaults);
      
      this.entity.add("2d, aiBounce, animation, tween");
      this.entity.on("step",this,"step");
      this.entity.on("bump.top",this,"killed");
      this.entity.on("bump.left,bump.right,bump.bottom", this, "hit");
    },

    step:function(p){
      var p = this.entity.p;
      if(!p.dead){
        this.entity.play("walk");
      }else{
        this.entity.play("dead");
      }
    },

    hit:function(col){
      if(col.obj.isA("Player") && !col.obj.dead){
        this.entity.del("2d, platformerControls");
        col.obj.trigger("enemy.hit");      
      }
    },

    killed:function(col){
      var p = this.entity.p;
      if(col.obj.isA("Player")){
        p.dead = true;
        this.entity.del("2d, aiBounce");
        this.entity.animate(0.25,{callback: this.entity.destroy});
        col.obj.p.vy += -350;
      }
    }
  });

  Q.Sprite.extend("Goomba", {
    init: function(p) {
      this._super({
        sheet:"goomba",
        sprite:"goombaAnim",
        x:500,
        y:380,
        vx: -50
      })
      this.add("defaultEnemy");
    }
  });

  Q.Sprite.extend("Bloopa", {
    init: function(p) {
      this._super({
        sheet:"bloopa",
        sprite:"bloopaAnim",
        x:1000,
        y:450,
        vx:-35,
        vy:0,
        i:0,
        gravity:0
      })
      this.add("defaultEnemy");
    },   
    
    step:function(p){
      if(!this.p.dead){
        this.p.vy = 250 * Math.sin(this.p.i);
        this.p.i += 2*Math.PI / 75;
      }
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
        sensor: true,
        type: Q.SPRITE_PRINCESS,
        collisionMask: Q.SPRITE_PLAYER
      })
      this.on("sensor");
    },

    sensor:function(){
      Q.stage().pause();
      Q.stageScene("endGame", 2, {label: "You win!"});
    }
  });

//
//  COIN
//

  Q.Sprite.extend("Coin",{
    init: function(p){
      this._super(p,{
        sheet: "coin",
        sprite: "coinAnim",
        x:250,
        y:500,
        sensor: true,
        took: false,
        type: Q.SPRITE_COINS,
        collisionMask: Q.SPRITE_PLAYER
      })
      this.add("animation, tween");
      this.on("sensor");
    },

    step: function(dt){
      this.play("staying");
    },

    sensor:function(){
      if(this.p.took)
        return;
      this.animate({ x: this.p.x, y:  this.p.y - 25 }, 0.25, Q.Easing.Linear, {callback: this.destroy});
      Q.state.inc("score",100);
      this.p.took = true; 
    }
  });

//
//  SCORE
//

Q.UI.Text.extend("Score",{
  init: function() {
    this._super({
      label: "score: 0",
      align: "center",
      x: Q.width/2,
      y: 40,
      weight: "normal",
      size:18
    });

    Q.state.on("change.score",this,"score");
  },

  score: function(score) {
    this.p.label = "score: " + score;
  }
});

Q.scene("hud",function(stage) {
  stage.insert(new Q.Score());
}, { stage: 1 });

//
//  SCENE
//
  var maxYvp = 600;
  Q.scene("level1",function(stage) {
    Q.state.reset({ score: 0 });
    Q.stageScene("hud"); 
    Q.stageTMX("level.tmx",stage);
    var player = stage.insert(new Q.Player());
    stage.add("viewport").follow(player, {x:true, y:true}, {minX:0, minY:0, maxY:maxYvp});
    stage.insert(new Q.Bloopa());
    stage.insert(new Q.Goomba());
    stage.insert(new Q.Princess());
    stage.insert(new Q.Coin());
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
      Q.stageScene("title");
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
      if(title){
        Q.stageScene("level1");
        title = false;
      }
    });
  })

  Q.load("mario_small.json, mario_small.png, goomba.json, goomba.png, bloopa.json, bloopa.png, princess.png, mainTitle.png, coin.png, coin.json", function(){
    Q.compileSheets("mario_small.png", "mario_small.json");
    Q.compileSheets("goomba.png", "goomba.json");
    Q.compileSheets("bloopa.png", "bloopa.json");
    Q.compileSheets("coin.png", "coin.json");
    Q.animations("marioAnim", {
      walk_right: { frames: [1,2,3], rate: 1/8, loop: true },
      walk_left: { frames:  [15,16,17], rate: 1/8, loop: true },
      jump_right: { frames: [4], rate: 1/10 },
      jump_left: { frames:  [18], rate: 1/10 },
      stand_right: { frames:[0], rate: 1/10 },
      stand_left: { frames: [14], rate: 1/10 },
      death: {frames: [12], rate: 1, loop: false }
    });

    var EnemyAnimations = {
      walk: { frames: [0,1], rate: 2/3, loop: true },
      dead: { frames: [2], rate: 1, loop: false }
    }

    var CoinAnimations = {
      staying: {frames: [0, 1, 2], rate: 1/2, loop: true },
    }

    Q.animations("goombaAnim", EnemyAnimations);
    Q.animations("bloopaAnim", EnemyAnimations);
    Q.animations("coinAnim", CoinAnimations);

    Q.loadTMX("level.tmx", function() {
      Q.stageScene("title");
    });
  })

});