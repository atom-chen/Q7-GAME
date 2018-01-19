var Net = require('Net');
cc.Class({
    extends: cc.Component,

    properties: {
        announce:{//公告牌
            default:null,
            type:cc.Node
        },
        shortAnnoWrap:{//屏幕滚动短公告的box
            default:null,
            type:cc.Node
        },
        shortAnno:{//屏幕滚动短公告
            default:null,
            type:cc.Node
        }
    },
    // use this for initialization
    onLoad: function () {
        this.msg = '';
        this.interVal = null;
        this.getShortMsgFromBackend();

        this.interVal = setInterval(()=>{
            this.getShortMsgFromBackend();
        },60*1000);

        // this.schedule(()=>{
        //     this.getShortMsgFromBackend();
        // },60);

        this.isHasNewAno();
        this.closeAnoAni();
    },
    //后台获取短公告数据
    getShortMsgFromBackend(){
        let id = cc.sys.localStorage.getItem('msgId')||'0';
        Net.get('/msg/getMsg',1,{id:id},function (data) {
            if(!data.success||!data.obj){
                return;
            }
            cc.sys.localStorage.setItem('msgId',data.obj.id);
            this.msg = data.obj.content;
            this.getShortAnno();
        }.bind(this),function (err) {

        }.bind(this))
    },
    //获取短公告
    getShortAnno(){
        this.shortAnnoWrap.active = true;
        var _wrapWidth = this.shortAnnoWrap.width;//短消息外框的宽度
        // this.msg +="1";
        this.shortAnno.getComponent(cc.Label).string = this.msg;
        var _width = this.shortAnno.width;//得到消息框Label的宽度
        //设置Label的位置在box的最右侧（隐藏Label）
        var _shortAnoPos = _wrapWidth/2+_width/2;
        this.shortAnno.x = _shortAnoPos;
        //设置到最左侧的位置
        var _endPos = -_shortAnoPos;
        //根据消息内容长度设置从最右侧走到最左侧所需要的时间
        var _time = _width*0.02;
        //回调
        var finished = cc.callFunc(function () {
            this.shortAnnoWrap.active = false;
        }, this);
        //设置Label运动action
        var _action = cc.sequence(
            cc.moveTo(_time,cc.p(_endPos,0)),
            cc.moveTo(0,cc.p(_endPos,0)),
            finished
        );
        //执行动作
        this.shortAnno.runAction(_action);
        //短公告滚动完隐藏box
        //this.scheduleOnce(()=>{
        //    this.shortAnnoWrap.active = false;
        //},_time);
    },
    AnoAni(_bool){//公告牌动画 true播放 false停止
        var _bool = _bool||false;
        if(_bool){
            this.announce.getComponent(cc.Animation).play('announce');
        }else{
            this.announce.getComponent(cc.Animation).stop('announce');
        }
    },
    //点击过后关闭公告牌动画
    closeAnoAni(){
        this.announce.on(cc.Node.EventType.TOUCH_END,()=>{
            //点击公告牌后设置公告为以查看状态
            Global.isLookNewAno = true;
            this.AnoAni(false);
        },this);
    },
    // 通过lastNotice接口获取最新公告id，通过id与本地储存的anoId对比，如果相同则说明对此用户没有最新公告，否者有最新公告；
    isHasNewAno(){
        Net.get('/notice/lastNotice',1,null,function (data) {
            if(data.success){
                let anoId = cc.sys.localStorage.getItem('anoId')||'none';
                if(!data.obj){
                    console.log('111');
                }else{
                    let id = data.obj.id;
                    if(anoId==id){
                        this.AnoAni(false);
                        if(!Global.isLookNewAno){//如果没查看过新公告（未点击公告牌） 则闪动公告牌动画
                            this.AnoAni(true);
                        }
                    }else {
                        this.AnoAni(true);
                        Global.isLookNewAno = false;//有新公告则设置为未查看状态
                    }
                    cc.sys.localStorage.setItem('anoId',id);
                }
            }
        }.bind(this),function (err) {

        }.bind(this));
    },
    onDestroy(){
        if(this.interVal){
            clearInterval(this.interVal);
        }
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
