const crypto = require('crypto');

const jwk = {
    "kty": "RSA",
    "n": "7HJ_OsSQRNiCQGAuVqQ_pdAomR7WLdWqcf0uXFwmydCl7DUSSjVNRIGxFwdi5XZZLDz9TSJNgHGYOPhWh94T7OqriO18b3Rvrnwqy09Q5D0AcRyds3gowjUlZI4l0LSqHUKUotkZmyiQjE8UUUOlVmUezvlRFfi5M3ulqS4v3lSaMtMJHCFZH2u1YgHb17bH_3qffeETsH0qWEIAF4KMVAhE6LYDHUJDZzQm5qaN8aF4t4EJarbIVmCeKyhzg7v_4uk0brRYgsYWruL8UvRRbDVEBBTStLGt2L2fHl1_8GE6wvY-qDQSDKc3gQxEyXnJyBvHrRWVJsTxLYeLcMHIdQ",
    "e": "AQAB"
};

const pem = crypto.createPublicKey({
    key: jwk,
    format: 'jwk',
}).export({
    type: 'spki',
    format: 'pem'
});

console.log(pem.toString());
