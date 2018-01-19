cc.Class({
    extends: cc.Component,

    properties: {
        sky:{//天空背景
            default:null,
            type:cc.Node
        },
        scrollView:{//滚动视图
            default:null,
            type:cc.ScrollView
        },
        content:{//滚动视图 
            default:null,
            type:cc.Node
        }
    },
    // use this for initialization
    onLoad: function () {
        this.mapScrolling();

        /*if(Global.isBackFromFac){
            setTimeout(()=>{
                this.content.setPosition(-400,0);
                Global.isBackFromFac = false;
            },0);
        }*/

    },
    update: function (dt) {
        
    },
    mapScrolling:function(){
        this.scrollView.node.on("scrolling",function(){

        });
    },
    scrollEvent:function(sender,event){
        var conPos = this.content.position;
        this.sky.setPosition(-conPos.x*0.3,506);
        // console.log(conPos)
        switch (event){
            case 0:
                //cc.log('top');
                break;
            case 1:
                //cc.log('bot');
                break;
        }
    }
});
