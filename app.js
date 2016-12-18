window.onload = function(){
    app.init();
};

var app = {
    O: [],
    C: [],
    Q: [],
    S: [],
    A: [],
    cnv: '',
    ctx: '',
    cnvWIDTH: 0,
    cnvHEIGHT: 0,

    n: 10,
    R: 10,
    t: 20,
    bRandom: true,

    bStop: false,
    iStartAnimTime: 0,

    YminLeft: 0,
    iOyminLeft: 0,

    init: function(){
        app.cnv = document.getElementById('canvas');
        app.cnvHEIGHT = parseInt(app.cnv.height);
        app.cnvWIDTH  = parseInt(app.cnv.width);
        app.ctx = app.cnv.getContext('2d');

        app.ctx.setStrokeStyle = function(sColor,bOpaque){
            var oColors = {
                black: [0,0,0],
                red: [255,0,0],
                green: [0,255,0],
                blue: [0,0,255],
                aqua: [0,255,255],
                yellow: [255,255,0],
                white: [255,255,255]
            };
            var rgba = oColors[sColor];
            rgba.push(bOpaque ? 0.5 : 1);

            app.ctx.strokeStyle = "rgba(" + rgba.join(",") + ")";
        };

        app.O = [];
        app.C = [];
        app.Q = [];
        app.S = [];
        app.A = [];

        $('inpS').value = 'pause';

        if(app.bRandom){
            app.n = Math.floor(Math.random()*50+5);
            app.R = Math.floor(Math.random()*50+30);
            $('inpN').value = app.n;
            $('inpR').value = app.R;
        } else {
            app.n = parseInt($('inpN').value);
            app.R = parseInt($('inpR').value);
            if(app.n < 2) app.n = 2;
            if(app.R < 2) app.R = 2;
        }
        // generate random circles
        var x,y,r,fi; r = app.R;
        for(var i=0;i<app.n;i++){
            fi =i*Math.PI/(Math.floor(app.R/2));
            x = r*Math.cos(fi)+(app.cnvWIDTH/2);
            y = r*Math.sin(fi)+(app.cnvHEIGHT/2);
            app.C.push(new Circle(x,y,app.R));
            app.C[i].dx = (Math.random()<0.5) ? (-1)*(Math.random()*3+Math.random()*3) : Math.random()*3+Math.random()*3;
            app.C[i].dy = (Math.random()<0.5) ? (-1)*(Math.random()*3+Math.random()*3) : Math.random()*3+Math.random()*3;
        }

        clearTimeout(app.iStartAnimTime);
        $('codePS').innerHTML = '<br/>';
        app.bStop = false;
        app.start();
    },

    start: function(){
        app.animNextStep();

        app.prepareDataToScan();
        app.grahamsScan();
        app.getArcs();
        app.drawAll();

        if(!app.bStop) {
            app.iStartAnimTime = setTimeout(function(){
                app.start();
            }, app.t);
        }
    },

    animNextStep: function(){
        clearTimeout(app.iStartAnimTime);
        app.ctx.clearRect(0,0,app.cnvWIDTH,app.cnvHEIGHT);
        var R = app.R;
        for(var i=0,ii=app.C.length;i<ii;i++){
            var C = app.C[i];
            if((C.x+R+5 > app.cnvWIDTH) ||(C.x-R < 5)) C.dx*=(-1);
            if((C.y+R+5 > app.cnvHEIGHT)||(C.y-R < 5)) C.dy*=(-1);
            C.x+=C.dx;
            C.y+=C.dy;
        }
        app.O = [];
        app.O = app.C.slice();
        app.S = [];
        app.Q = [];
        app.A = [];
    },

    pause: function(){
        if(app.bStop){
            app.bStop = false;
            setTimeout(function() {
                app.start();
            } ,app.t);
            $('inpS').value = 'pause';
        } else {
            app.bStop = true;
            $('inpS').value = 'resume';
        }
    },

    updateFPS: function(ms) {
        app.t = Math.floor(1000/ms);
    },

    switchRandom: function(){
        app.bRandom = ($('inpRand').value == 'randomize on') ? false : true;
        $('inpRand').value = (app.bRandom) ? 'randomize on' : 'randomize off';
    },

    drawAll: function(){
        for(var i=0,ii=app.Q.length;i<ii;i++)
            app.Q[i].draw('white',true);

        for(var i=0,ii=app.S.length;i<ii;i++)
            app.S[i].draw('aqua',false);

        var A = app.A;
        var line = new Line();
        for(var i=0,ii=A.length;i<ii;i++){
            app.ctx.lineWidth = 3;
            line.fromPointToPoint(A[i].x2,A[i].y2,A[(i+1)%ii].x1,A[(i+1)%ii].y1);
            line.draw('white',false);
            A[i].draw('red',false);
            app.ctx.lineWidth = 0.5;
        }
    },

    prepareDataToScan: function(){
        app.YminLeft = app.O[0].y;
        for(var i=0,ii=app.O.length;i<ii;i++)
            if(app.O[i].y <= app.YminLeft){
                app.YminLeft = app.O[i].y;
                app.iOyminLeft = i;
            }

        for(var i=0,ii=app.O.length;i<ii;i++){
            app.O[i].centerToPolarRelated(app.O[app.iOyminLeft].x,app.O[app.iOyminLeft].y);
        }

        app.O.sort(app.O[0].polarSort);

        for(var i=0,ii=app.O.length;i<ii;i++){
            if((app.O[i].x == app.O[(i+1)%ii].x)&&(app.O[i].y == app.O[(i+1)%ii].y)){
                app.O.splice(i,1);
                ii--;
                i--;
            }
        }
    },

    grahamsScan: function(){
        var O = app.O;
        var S = app.S;
        var Q = app.Q;
        var iOlength = O.length;
        var Opi;
        S.push(O.pop());
        S.push(O.pop());
        for(var i=iOlength-3;i>-1;i--){
            Opi = O.pop();

            while (0 <= detThreeCenters(S[S.length-2],Opi,S[S.length-1]))
                Q.push(S.pop());

            S.push(Opi);
        }
    },

    getArcs: function(){
        var line = new Line();
        var S = app.S;
        var A = app.A;
        for(var i=0,ii=S.length;i<ii;i++){ A.push(new Arc()); }
        for(var i=0,ii=S.length;i<ii;i++){
            line.tangent(S[i],S[(i+1)%ii]);

            A[i].xo = S[i].x;
            A[i].yo = S[i].y;
            A[i].x2 = line.x1; A[(i+1)%ii].x1 = line.x2;
            A[i].y2 = line.y1; A[(i+1)%ii].y1 = line.y2;
        }
        var polar = [];
        for(var i=0,ii=S.length;i<ii;i++){
            polar = toPolarRelated(A[i].x1,A[i].y1,A[i].xo,A[i].yo);
            A[i].f1 = polar[1];
            polar = toPolarRelated(A[i].x2,A[i].y2,A[i].xo,A[i].yo);
            A[i].f2 = polar[1];
        }

    },

    getPS: function(){
        var R = app.R;
        var A = [];
        var C = [];

        app.A.forEach(function(a){
            A.push(JSON.parse(JSON.stringify(a)));
        });
        app.C.forEach(function(c){
            C.push(JSON.parse(JSON.stringify(c)));
        });

        var Xmin = C[0].x;
        var Xmax = C[0].x;
        var Ymin = C[0].y;
        var Ymax = C[0].y;

        C.forEach(function(c){
            if(c.x < Xmin) Xmin = c.x;
            if(c.x > Xmax) Xmax = c.x;
            if(c.y < Ymin) Ymin = c.y;
            if(c.y > Ymax) Ymax = c.y;
        });

        var maxWidth  = Xmax - Xmin + 2 * R;
        var maxHeight = Ymax - Ymin + 2 * R;

        var PAGEWIDTH  = 500;
        var PAGEHEIGHT = 550;

        var scale = (maxHeight > maxWidth) ? PAGEHEIGHT/maxHeight : PAGEWIDTH/maxWidth;

        A.forEach(function(a,i){
            A[i].xo = (a.xo - Xmin + R)*scale;
            A[i].yo = (a.yo - Ymin + R)*scale;
            A[i].x1 = (a.x1 - Xmin + R)*scale;
            A[i].y1 = (a.y1 - Ymin + R)*scale;
            A[i].x2 = (a.x2 - Xmin + R)*scale;
            A[i].y2 = (a.y2 - Ymin + R)*scale;
        });

        C.forEach(function(c,i){
            C[i].x = (c.x - Xmin + R)*scale;
            C[i].y = (c.y - Ymin + R)*scale;
        });

        R = R * scale;

        var ps = [
            "/myLine  { newpath moveto lineto stroke }def",
            "/myArc   { newpath arc stroke }def",
            "/myCircle{ newpath "+R.toFixed(5)+" 0 360 arc stroke }def",
            "",
            ""
        ];

        A.forEach(function(a,i){
            ps.push(
                [
                    a.xo.toFixed(6),
                    a.yo.toFixed(6),
                    R.toFixed(5),
                    (a.f1*180/Math.PI).toFixed(6),
                    (a.f2*180/Math.PI).toFixed(6),
                    "myArc"
                ].join(" ")
            );
        });

        ps.push("");

        A.forEach(function(a,i){
            ps.push(
                [
                    a.x2.toFixed(6),
                    a.y2.toFixed(6),
                    Number(A[(i+1) % A.length].x1.toFixed(5)),
                    Number(A[(i+1) % A.length].y1.toFixed(5)),
                    "myLine"
                ].join(" ")
            );
        });

        ps.push("");

        C.forEach(function(c,i){
             ps.push(
                 [
                     c.x.toFixed(6),
                     c.y.toFixed(6),
                     "myCircle"
                 ].join(" ")
             );
        });

        $('codePS').innerHTML = ps.join("\n");
    }
};


function Line(){
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;

    this.A = 0;
    this.B = 0;
    this.C = 0;
}

Line.prototype.fromPointToPoint = function(x1,y1,x2,y2){
    this.A = y1-y2;
    this.B = x2-x1;
    this.C = (this.A*x1 + this.B*y1)*(-1);

    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
};

Line.prototype.tangent = function(O1,O2,bLeft){
    var dLine = new Line();
        dLine.fromPointToPoint(O1.x,O1.y,O2.x,O2.y);
    this.A = dLine.A;
    this.B = dLine.B;
    this.C = dLine.C + O1.r*Math.sqrt(dLine.A*dLine.A+dLine.B*dLine.B);

    var polar = [];
        polar = toPolarRelated(O2.x,O2.y,O1.x,O1.y);
    var xk = O2.r*Math.cos(polar[1]+3*Math.PI/2)+O1.x;
    var yk = O2.r*Math.sin(polar[1]+3*Math.PI/2)+O1.y;

    this.x1 = xk;
    this.y1 = yk;
    this.x2 = xk+O2.x-O1.x;
    this.y2 = yk+O2.y-O1.y;
};

Line.prototype.destToPoint = function(x,y){
    var d = (this.A*x+this.B*y+this.C)/Math.sqrt(this.A*this.A+this.B*this.B);
    return (d>0) ? d : d*(-1);
};

Line.prototype.draw = function(sColor,bOpaque){
    app.ctx.beginPath();
    app.ctx.moveTo(this.x1,this.y1);
    app.ctx.lineTo(this.x2,this.y2);
    app.ctx.setStrokeStyle(sColor,bOpaque);
    app.ctx.stroke();
    app.ctx.setStrokeStyle('black',false);
};

function Circle(dX,dY,dR){
    this.x = dX;
    this.y = dY;
    this.r = (dR > 0) ? dR : (-1)*dR;
    this.Cr = 0;
    this.Cf = 0;

    this.dx = 1;
    this.dy = 1;
}

Circle.prototype.centerToPolarRelated = function(x,y){
    x = this.x - x;
    y = this.y - y;
    this.Cr = Math.sqrt(x*x+y*y);

    if((x>0)&&(y>=0)){  this.Cf = Math.atan(y/x); return; }
    if((x>0)&&(y<0)){   this.Cf = Math.atan(y/x) + Math.PI * 2; return; }
    if (x<0){           this.Cf = Math.atan(y/x) + Math.PI; return; }
    if((x===0)&&(y>0)){  this.Cf = Math.PI/2; return; }
    if((x===0)&&(y<0)){  this.Cf = Math.PI/2 * 3; return; }
    if((x===0)&&(y===0)){ this.Cf = 0; return; }
};

Circle.prototype.polarSort = function(O1,O2){
    if(O1.Cf == O2.Cf) return O2.x - O1.x;
    return O2.Cf - O1.Cf;
};

Circle.prototype.draw = function(sColor,bOpaque){
    app.ctx.beginPath();
    app.ctx.arc(this.x,this.y,this.r,0,Math.PI*2,true);
    app.ctx.setStrokeStyle(sColor,bOpaque);
    if(sColor == 'aqua'){
        app.ctx.fillStyle = "rgba(0,255,255,0.05)";
        app.ctx.fill();
        app.ctx.fillStyle = "rgba(0,0,0,1)";
    }
    app.ctx.stroke();
    app.ctx.setStrokeStyle('black',false);
};

function Arc(){
    this.x1 = 0; this.y1 = 0; this.f1 = 0;
    this.x2 = 0; this.y2 = 0; this.f2 = 0;
    this.xo = 0; this.yo = 0;
}

Arc.prototype.draw = function(sColor,bOpaque){
    app.ctx.beginPath();
    app.ctx.arc(this.xo,this.yo,app.R,this.f1,this.f2,false);
    app.ctx.setStrokeStyle(sColor,bOpaque);
    app.ctx.stroke();
    app.ctx.setStrokeStyle('black',false);
};

function detThreePoints(x1,y1,x2,y2,x3,y3){
    return x1*y2+y1*x3+x2*y3-x1*y3-y1*x2-y2*x3;
}

function detThreeCenters(O1,O2,O3){
    return detThreePoints(O1.x,O1.y,O2.x,O2.y,O3.x,O3.y);
}

function toPolarRelated(x,y,x0,y0){
    var Cr,Cf = 0;
    x = x - x0;
    y = y - y0;
    Cr = Math.sqrt(x*x+y*y);

    if((x>0)&&(y>=0))  Cf = Math.atan(y/x);
    if((x>0)&&(y<0))   Cf = Math.atan(y/x) + Math.PI * 2;
    if (x<0)           Cf = Math.atan(y/x) + Math.PI;
    if((x===0)&&(y>=0)) Cf = Math.PI/2;
    if((x===0)&&(y<0))  Cf = Math.PI/2 * 3;
    return [Cr,Cf];
}

function checkDecimal(inp,iMin,iMax,iDefault){
    var sString = inp.value;
    if(!isNumeric(sString) || (sString<iMin) || (iMax<sString)){
        inp.value = iDefault;
        alert("Please enter an integer between " + iMin + " and " + iMax);
        return false;
    }
    return true;
}

function isNumeric(sString){
    var sValidChars = "0123456789";
    var sChar;
    var bResult = true;

    if(sString.length === 0) return false;

    for(i = 0; i < sString.length && bResult === true; i++){
        sChar = sString.charAt(i);
        if(sValidChars.indexOf(sChar) == -1) bResult = false;
    }
    return bResult;
}

function $(id){
    return document.getElementById(id);
}
