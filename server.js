import express from 'express';
import crypto from 'crypto';


const app = express();
app.use(express.json());

//memory storage for demonstration purposes
const idempotencyStore = new Map();  // key : idempotencyKey : { status, body , createdAt }
const orders = new Map(); // key: orderId : order

function requireIdempotencyKey(req, res, next) {
    const key = req.header('Idempotency-Key');
    if (!key) return res.status(400).send({ error: 'Idempotency-Key header is required' });
    req.idempotencyKey = key;
    next();
}

app.post('/orders', requireIdempotencyKey, (req, res) => {
    const key = req.idempotencyKey;

    //1. if the key is already used, return the stored response
    const cached = idempotencyStore.get(key);
    if (cached) {
        return res.status(cached.status).json({
            ...cached.body,
            idempotent: "replayed"
        });
    }

    // 2. otherwise, process the request
    const orderId = crypto.randomUUID();
    const order ={
        id: orderId,
        item: req.body.item,
        qty: req.body.qty,
        createdAt: new Date().toISOString()
    };
    orders.set(orderId, order);

    //3. store the response under the idempotency key
    const responseBody = { order };
    idempotencyStore.set(key, {
        status: 201,
        body: responseBody, 
        createdAt: Date.now()
    });

    return res.status(201).json({
        ...responseBody,
        idempotent: "created new idempotent entry"
    });
}); 

app.listen(3000, () => console.log('Server running on port http://localhost:3000'));
