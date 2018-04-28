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
        sprite: "marioAnim",
        x:150,
        y:380,
        dead:false,
        end:false
      });
      this.add('2d, platformerControls, animation, tween');
      this.on("enemy.hit","enemyHit");
      //this.on("enemy.killed", "enemyKilled");
    },

    reset:function(){
      Q.stageScene("endGame",1, { label: "You Died" });
      this.destroy();
    },

    step:function(dt){
      //console.log(this.p.vx);
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
  Q.Sprite.extend("Enemy", {
    init:function(p){
      this._super(p,{
        sheet: p.sheet,
        sprite: p.sprite,
        vx:-50,
        direction:'left',
        dead: false
      });
      this.add("2d, aiBounce, animation, tween");
      this.on("bump.top",this, "killed");
      this.on("bump.left,bump.right", this, "hit");
    },

    step:function(p){
      if(!this.p.dead){
        this.play("walk");
      }else{
        this.play("dead");
      }
    },

    hit:function(col){
      if(col.obj.isA("Player")){
        col.obj.trigger("enemy.hit");
      }
    },

    killed:function(col){
      if(col.obj.isA("Player")){
          this.p.dead = true;
          //col.obj.trigger("enemy.killed");
          this.del("2d, aiBounce");
          this.animate(0.25, {callback: this.destroy});
          col.obj.p.vy += -300;

        }
    }
  })

  Q.Enemy.extend("Goomba", {
    init: function(p) {
      this._super({
        sheet:"goomba",
        sprite:"goombaAnim",
        x:500,
        y:380
      })
    }
  });

  Q.Enemy.extend("Bloopa", {
    init: function(p) {
      this._super({
        sheet:"bloopa",
        sprite:"bloopaAnim",
        x:1000,
        y:450,
        gravity:0
      })
      this.on("bump.bottom", this, "hit");
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
  var maxYvp = 600;
  Q.scene("level1",function(stage) {
    Q.stageTMX("level.tmx",stage);
    var player = stage.insert(new Q.Player());
    stage.add("viewport").follow(player, {x:true, y:true}, {minX:0, minY:0, maxY:maxYvp});
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

  Q.load("mario_small.json, mario_small.png, goomba.json, goomba.png, bloopa.json, bloopa.png, princess.png, mainTitle.png", function(){
    Q.compileSheets("mario_small.png", "mario_small.json");
    Q.compileSheets("goomba.png", "goomba.json");
    Q.compileSheets("bloopa.png", "bloopa.json");
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
      walk: { frames: [0,1], rate: 1/3, loop: true },
      dead: { frames: [2], rate: 1, loop: false }
    }
    Q.animations("goombaAnim", EnemyAnimations);
    Q.animations("bloopaAnim", EnemyAnimations);



    Q.loadTMX("level.tmx", function() {
      Q.stageScene("title");
    });
  })

});