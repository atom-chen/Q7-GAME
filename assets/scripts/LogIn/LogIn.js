var util = require('Util');
var Net = require('Net');
cc.Class({
    extends: cc.Component,

    properties: {
        userName:{// 用户名
            default:null,
            type:cc.EditBox
        },
        password:{// 密码
            default:null,
            type:cc.EditBox
        },
        verCode:{//图形验证码输入框
            default:null,
            type:cc.EditBox
        },
        verImg:{//验证码图片node
            default:null,
            type:cc.Node
        },
        codeImg:{//图片验证码sprite
            default:null,
            type:cc.Sprite
        },
        remPwd:{//  记住密码
            default:null,
            type:cc.Node
        },
        littleTip:{
            default:null,
            type:cc.Prefab
        },
        root: {
            default: null,
            type: cc.Node
        },
        persistNode:{//常驻节点
            default:null,
            type:cc.Node
        },
        reqAni:{//网络请求加载遮罩层
            default:null,
            type:cc.Node
        },
        /*打开重置密码弹框*/
        //重置密码弹框
        resetPwdBox:{
            default:null,
            type:cc.Prefab
        },
        //遮罩层
        alertLayer:{
            default:null,
            type:cc.Prefab
        },
        /*打开重置密码弹框*/
    },
    start(){
        //cc.director.loadScene('GameT',_=>{
        //
        //});
    },
    // use this for initialization
    onLoad: function () {
        //cc._initDebugSetting(cc.DebugMode.INFO);
        //cc.director.setDisplayStats(false);
        //添加常驻节点
        cc.game.addPersistRootNode(this.persistNode);//场景切换数据传递 //全局定时更新token
        cc.game.addPersistRootNode(this.reqAni);//网络请求加载遮罩层
        this.autoInput();
        this.changeVer();
        this.promoteSkip();
        this.quesNewGuide();
        //cc.director.preloadScene("Game", function () {
        //    cc.log("Game scene preloaded");
        //});
    },
    //答题推广页跳转过来-进行游戏新手引导
    quesNewGuide(){
        if(!cc.sys.isNative){
            if(util.getQueryString('fromDati')&&util.getQueryString('token')){
                let token = decodeURI(util.getQueryString('token'));
                cc.sys.localStorage.setItem('token',token);
                this.loadPlayer();//loadPalyer进入主场景
            }
        }
    },
    //判断是否为浏览器方式打开 接收推广码 跳转至注册界面
    promoteSkip(){
        if(Global.isFromPromoteLink) return;
        if(!cc.sys.isNative){
            if(util.getQueryString('sid')){
                Global.isFromPromoteLink = true;
                cc.director.loadScene("Regist",()=>{//进入注册界面

                });
            }
        }
    },
    logIn:function(){
        var logdata =  {
            "captchaCode": "",
            "captchaValue": "",
            "clientId": "098f6bcd4621d373cade4e832627b4f6",
            "login_channel": "",
            "password": "",
            "userName": ""
        };
        var self = this;
        // 登录
        var account = (this.userName.string).trim();//账号
        var password = (this.password.string).trim();//密码
        var verCode = (this.verCode.string).trim()||1;//图形验证码

        // 记住密码
        var isRemPwd = this.remPwd.children[2].active;//checkbox最后一个子节点钩号图片
        if(!util.regMobile(account)){
            this.showLittleTip("请填写正确手机号");
            return;
        }else if(!password){
            this.showLittleTip("请填写密码");
            return;
        }else if(!verCode){
            this.showLittleTip("请填写验证码");
            return;
        }
        logdata.password = password;
        logdata.userName = account;

        this.getComponent('ReqAni').showReqAni();//显示加载动画
        Net.post('/oauth/token',!1,logdata,function(data){
            cc.log(data);
            if(!data.success){//请求失败
                this.showLittleTip(data.msg);
                cc.director.getScene().getChildByName('ReqAni').active = false;
                return
            };
            cc.sys.localStorage.setItem('token',data.obj.tokenType+" "+data.obj.accessToken);//保存数据到本地
            //cc.log(cc.sys.localStorage.getItem('token'),444);
            this.remActPwd(account,password);
            //登录成功后定时更新token
            cc.director.getScene().getChildByName('PersistNode').getComponent('UpdateToken').updateToken();
            if(!isRemPwd){
                this.removeStorage();
            }
            //加载玩家信息
            this.loadPlayer();
        }.bind(this),function(err){
            self.showLittleTip("网络错误");
            cc.director.getScene().getChildByName('ReqAni').active = false;
        }.bind(this));
    },
    loadPlayer(){//加载玩家信息
        Net.get('/game/loadPlayer',1,null,function(data){
            console.log(data);
            if(!data.success){
                //this.showLittleTip(data.msg);
                if(!data.obj){//未创建角色
                    cc.director.loadScene("CreatRole",function(){//进入创建角色场景
                        cc.director.getScene().getChildByName('ReqAni').active = false;
                    }.bind(this));
                }
                cc.director.getScene().getChildByName('ReqAni').active = false;
            }else{
                if(!this.persistNode.name){
                    this.persistNode = cc.director.getScene().getChildByName('PersistNode');
                }
                this.persistNode.getComponent('PersistNode').userData.selfInfo = data.obj;//玩家基本星系赋给常驻节点的selfInfo属性
                if(data.obj.functions){
                    let functions = data.obj.functions;
                    Global.tranActive.market = functions[0].value;
                    Global.tranActive.users = functions[1].value;
                    Global.tranActive.exchange = functions[2].value;
                    Global.tranActive.transact = functions[3].value;
                    Global.tranActive.listed = functions[4].value;
                }
                cc.director.loadScene("Game",function(){//进入主场景
                    cc.director.getScene().getChildByName('ReqAni').active = false;
                }.bind(this));
            }
        }.bind(this),function(err){
            this.showLittleTip('网络错误');
            cc.director.getScene().getChildByName('ReqAni').active = false;
        }.bind(this))
    },
    //去Z家园官网
    toZNet(){
        cc.sys.openURL('http://www.zjiayuan.cn?isFromGame=1');
    },
    autoInput(){//记住密码状态下自动填充账号密码
        if(cc.sys.localStorage.getItem('act')&&cc.sys.localStorage.getItem('pwd')){
            this.userName.string = cc.sys.localStorage.getItem('act');
            this.password.string = cc.sys.localStorage.getItem('pwd');
        }else{
            this.userName.string = '';
            this.password.string = '';
        }
        this.verCode.string = '1'
    },
    remActPwd(act,pwd){//记住账号密码
        cc.sys.localStorage.setItem('act', act);
        cc.sys.localStorage.setItem('pwd', pwd);
        cc.sys.localStorage.setItem('Qact',act);
        cc.sys.localStorage.setItem('Qpwd',pwd);
    },
    removeStorage(){//删除本地数据
        cc.sys.localStorage.removeItem('act');
        cc.sys.localStorage.removeItem('pwd');
    },
    changeVer(){//切换验证码
        var self = this;
        this.verImg.on(cc.Node.EventType.TOUCH_END,function(event){
            //var remoteUrl = "http://image.lxway.com/upload/f/1a/f1a43af2f1affea07407bbae75f24208_thumb.gif";//跨域报错
            //cc.loader.load(remoteUrl, function (err, texture) {
            //    cc.log(texture)
            //});

            cc.loader.loadRes("/images/waterMalen", cc.SpriteFrame, function (err, spriteFrame) {//本地图片测试
                self.codeImg.spriteFrame = spriteFrame;
            });

        },this);
    },
    regist:function(){
        cc.director.getScene().getChildByName('ReqAni').active = true;
        cc.director.loadScene("Regist",function(){//进入主场景

        }.bind(this));
        //是否是原生平台
        /*let isNative = cc.sys.isNative;
        if(!isNative){
            window.location = "http://wap.market.o2plan.cn/#/regist?origin=web";
        }else{
            cc.sys.openURL("http://wap.market.o2plan.cn/#/regist?origin=native")
        }*/
        //this.showLittleTip("暂未设计");
    },
    //去重新设置密码(打开重置密码弹框)
    toRestPwd(){
        if(!Global.layer||!Global.layer.name){
            Global.layer = cc.instantiate(this.alertLayer);
        }
        Global.layer.parent = this.root;
        Global.layer.active = true;
        if(!Global.restPwd||!Global.restPwd.name){
            Global.restPwd = cc.instantiate(this.resetPwdBox);
        }
        Global.restPwd.parent = this.root;
        Global.restPwd.getComponent('ResetPwd').showThis();

        /*let isNative = cc.sys.isNative;
        if(!isNative){
            window.location = "http://wap.market.o2plan.cn/#/forgetPassword?origin=web";
        }else{
            cc.sys.openURL("http://wap.market.o2plan.cn/#/forgetPassword?origin=native")
        }*/
    },
    update: function (dt) {

    },
    //setInputControl(){//设置事件监听
    //    var self = this;
    //    var listener = {
    //        event:cc.EventListener.TOUCH_ONE_BY_ONE,
    //        onTouchBegan:function(touches,event){
    //            alert(1);
    //        },
    //        onTouchMoved:function(touches,event){
    //
    //        },
    //        onTouchEnded:function(touches,event){
    //
    //        }
    //    }
    //    cc.eventManager.addListener(listener,self.verImg.node);
    //},
    showLittleTip:function(str){//显示提示
        this.getComponent('LittleTip').setContent(str);
    }
});
