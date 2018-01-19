var Net = require('Net');
cc.Class({
    extends: cc.Component,

    properties: {
        headIndex:{//头像
            default:1,
            type:cc.Integer
        },
        userName:cc.EditBox,
        littleTip:{
            default:null,
            type:cc.Prefab
        },
        root: {
            default: null,
            type: cc.Node
        },
    },
    // use this for initialization
    onLoad: function () {
        //隐藏fps
        cc.director.setDisplayStats(false);
    },
    toCreat(){//创建
        var userName = (this.userName.string).trim();
        if(!userName){
            this.showLittleTip('请填写角色名');
            return;
        }else if(userName.length>5){
            this.showLittleTip('角色名不能大于5个字符');
            return;
        }
        var self = this;
        let myDatas = {
            "nickname": userName,
            "pic": self.headIndex+""
        };
        cc.director.getScene().getChildByName('ReqAni').active = true;

        Net.post('/game/createPlayer',1,myDatas,(data)=>{
            if(!data.success){
                this.showLittleTip(data.msg);
                cc.director.getScene().getChildByName('ReqAni').active = false;
                return;
            }
            this.loadPlayer();
        },(err)=>{
            this.showLittleTip("网络错误");
            cc.director.getScene().getChildByName('ReqAni').active = false;
        });

    },
    loadPlayer(){//加载玩家信息
        Net.get('/game/loadPlayer',1,null,function(data){
            if(!data.success){
                this.showLittleTip(data.msg);
            }else{
                if(!this.getPerNode()){
                    this.perNode.getComponent('PersistNode').userData.selfInfo = data.obj;//玩家基本星系赋给常驻节点的selfInfo属性
                }
                if(data.obj.functions){
                    let functions = data.obj.functions;
                    Global.tranActive.market = functions[0].value;
                    Global.tranActive.users = functions[1].value;
                    Global.tranActive.exchange = functions[2].value;
                    Global.tranActive.transact = functions[3].value;
                    Global.tranActive.listed = functions[4].value;
                }
                cc.director.loadScene("Game",function(){//进入主场景

                }.bind(this));
            }
            cc.director.getScene().getChildByName('ReqAni').active = false;
        }.bind(this),function(err){
            this.showLittleTip('网络异常');
            cc.director.getScene().getChildByName('ReqAni').active = false;
        }.bind(this))
    },
    getPerNode(){//得到常驻节点
        this.perNode = cc.director.getScene().getChildByName('PersistNode');
        return this.perNode;
    },
    showLittleTip:function(str){//显示提示
        this.getComponent('LittleTip').setContent(str);
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
