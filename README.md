# passport-alipay-public

Passport strategy for authenticating with Alipay


> 授权登录获取支付宝用户信息


> 结合了蚂蚁金服node的alipay-sdk和其他资料,本文支持node8.0以上

# 安装 #
    
    npm install passport-alipay-public

# 引用 #


    var alipayStrategy = require('passport-alipay-public').Strategy;

# 举例 #

    passport.use(new alipayStrategy({
    app_id: '2019032163XXXX',
    alipayPublicKey: fs.readFileSync('../public-key.pem', 'ascii'),//自己的路径，下同
    privateKey: fs.readFileSync('../private-key.pem', 'ascii'),
    callbackURL: 'http://www.example.com/authCallBack',
    passReqToCallback: true,
    },function (req, accessToken, refreshToken, profile, done) {
	//写一些数据库插入语句或者其他..
	//不一定返回profile,可以自己创建对象返回
    done(null,profile);
    }))

-   **app_id**：蚂蚁金服开放平台：https://open.alipay.com，创建应用后生成的APPID
-   **alipayPublicKey**: 用开放平台提供的RSA签名验签工具生成的商户应用公钥，然后用商户应用公钥去应用中填写生成的支付宝公钥，不要误用商户的应用公钥
-   **privateKey**: 用开放平台提供的RSA签名验签工具生成的商户应用私钥
-   **callbackURL**:自己应用中放的回调地址
-   **passReqToCallback**: function中req是否需要


