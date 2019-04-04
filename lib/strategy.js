'use strict';

var util = require('util');
var passport = require('passport-strategy');
var debug = require('debug')('passport-alipay');
var AlipaySdk = require('alipay-sdk').default;

function AlipayStrategy(options, verify) {
    options = options || {};

    if (!verify) {
        throw new TypeError('AlipayStrategy required a verify callback');
    }

    if (typeof verify !== 'function') {
        throw new TypeError('_verify must be function');
    }

    if (!options.app_id) {
        throw new TypeError('AlipayStrategy requires a app_id option');
    }

    passport.Strategy.call(this, options, verify);

    this.name = options.name || 'Alipay';

    this._verify = verify;
    this._app_id = options.app_id;
    this._oauth =  new AlipaySdk({
        appId: options.app_id,
        privateKey: options.privateKey,
        alipayPublicKey: options.alipayPublicKey,
    });
    this._scope = options.scope || 'auth_user';
    this._callbackURL = options.callbackURL;
    this._passReqToCallback = options.passReqToCallback;
}

/**
 * Inherit from 'passort.Strategy'
 */
util.inherits(AlipayStrategy, passport.Strategy);

AlipayStrategy.prototype.authenticate = async function (req, options) {
    var self = this;

    if (!req._passport) {
        return self.error(new Error('passport.initialize() middleware not in use'));
    }

    options = options || {};

    // 获取auth_code,并校验相关参数的合法性
    if (req.query && req.query.state && !req.query.auth_code) {
        return self.fail(401);
    }

    // 获取auth_code授权成功
    if (req.query && req.query.auth_code) {
        var scope = options.scope || self._scope || 'auth_user';
        var auth_code = req.query.auth_code;
        console.log('auth_code',auth_code)
        debug('Alipay callback -> \n %s', req.url);
        try {
            const params = await self._oauth.exec('alipay.system.oauth.token', {
                grantType: 'authorization_code',
                code: auth_code,
                refreshToken: 'token'
            }, {
                // 验签
                validateSign: true,
                // 打印执行日志
                log: this.logger,
            });
            // 校验完成信息
            // noinspection JSAnnotator
            function verified(err, user, info) {
                if (err) {
                    return self.error(err);
                }
                if (!user) {
                    return self.fail(info);
                }
                self.success(user, info);
            }
            debug('fetch accessToken -> \n %s', JSON.stringify(params));
            if (~scope.indexOf('auth_base')) {
                let profile = params;
                try {
                    if (self._passReqToCallback) {
                        self._verify(req, params['accessToken'], params['refreshToken'], profile, verified);
                    } else {
                        self._verify(params['accessToken'], params['refreshToken'], profile, verified);
                    }
                } catch (ex) {
                    return self.error(ex);
                }
            } else {
                let profile = await self._oauth.exec('alipay.user.info.share', {
                    auth_token: params.accessToken,
                }, {
                    // 验签
                    validateSign: true,
                    // 打印执行日志
                    log: this.logger,
                });
                debug('fetch user info -> \n %s', JSON.stringify(profile));
                try {
                    if (self._passReqToCallback) {
                        self._verify(req, params['accessToken'], params['refreshToken'], profile, verified);
                    } else {
                        self._verify(params['accessToken'], params['refreshToken'], profile, verified);
                    }
                } catch (ex) {
                    return self.error(ex);
                }
            }
        } catch (e) {
            return self.error(e);
        }
    } else {
        var app_id = options.app_id || self._app_id;
        var scope = options.scope || self._scope || 'auth_user';
        var callbackURL = options.callbackURL || self._callbackURL;

        var url = 'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=' + app_id + '&scope=' + scope + '&redirect_uri=' + encodeURIComponent(callbackURL);
        debug('redirect -> \n%s', url);

        self.redirect(url, 302);
    }
};

module.exports = AlipayStrategy;
