const {Router} = require('express')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const RefreshToken = require('../models/refresh-token')
const crypto = require("crypto");
const router = Router();

router.post('/authenticate', authenticate);
router.post('/refresh-token', refreshToken);

async function authenticate(req, res){
        try{

            const {userId} = req.body;
            const ipAddress = req.ip;

            await RefreshToken.updateMany({userId}, {revoked: new Date()});

            const jwtToken = generateJwtToken(userId);

            const refreshToken = await generateRefreshToken(userId, ipAddress);

            res.json({
                jwtToken,
                refreshToken,
                userId
            });

        } catch (e){
            res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова', error: e.message });
        }
}

function generateJwtToken(userId) {
    return jwt.sign({  id: userId }, config.get('jwtSecret'), { expiresIn: '15m' , algorithm: 'HS512'});
}

async function generateRefreshToken(userId, ipAddress) {

    const refreshToken = randomTokenString();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);

    const docRefresh = new RefreshToken({
        userId,
        token:hashedRefreshToken,
        expires: new Date(Date.now() + 7*24*60*60*1000),
        createdByIp: ipAddress
    });

    await docRefresh.save();

    return refreshToken;
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

async function refreshToken(req, res){
        try{
            const { token, userId } = req.body;
            const ipAddress = req.ip;

            const refreshToken = await getRefreshToken(token, userId);
            if(!refreshToken){
                return res.status(400).json({ message: 'Токен не найден'});
            }

            const newRefreshToken = await generateRefreshToken(userId, ipAddress);
            refreshToken.revoked = Date.now();
            refreshToken.revokedByIp = ipAddress;
            refreshToken.replacedByToken = newRefreshToken;
            await refreshToken.save();

            const jwtToken = generateJwtToken(userId);

            res.status(200).json({
                jwtToken,
                refreshToken: newRefreshToken,
                userId
            })

        } catch (e){
            res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова', error: e.message });
        }
}

async function getRefreshToken(token, userId) {

    const refreshToken = await RefreshToken.findOne({ userId, revoked:null });

    if (!refreshToken){
        throw new Error('Токен не найден');
    }
    const isValid = await bcrypt.compare(token, refreshToken.token);

    if(!isValid){
        throw new Error('Неверный токен');
    }

    return refreshToken;
}

module.exports = router;